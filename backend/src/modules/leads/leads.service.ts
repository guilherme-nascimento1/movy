import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateLeadDto, UpdateLeadDto, AssignLeadDto, TrialLeadDto, LeadStage } from './dto/lead.dto';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadEventService } from './services/lead-event.service';
import { MetaConversionsService } from '../integrations/meta-conversions.service';

export const LEADS_QUEUE = 'movy-leads';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private scoring: LeadScoringService,
    private events: LeadEventService,
    private meta: MetaConversionsService,
    @InjectQueue(LEADS_QUEUE) private leadsQueue: Queue,
  ) {}

  async create(tenantId: string, dto: CreateLeadDto): Promise<object> {
    const lead = await this.prisma.lead.create({
      data: { tenantId, ...dto, stageEnteredAt: new Date() },
    });
    await this.events.record(lead.id, tenantId, 'CREATED', { stage: lead.stage });
    await this.scoring.recalculate(lead.id);

    // v5.1 — Meta Lead event (fire-and-forget, apenas se tem UTM)
    if (dto.utmSource || dto.utmCampaign) {
      this.meta.sendLeadEvent({
        userEmail: dto.email,
        userPhone: dto.phone,
        userName: dto.name,
        utmSource: dto.utmSource,
        utmCampaign: dto.utmCampaign,
      }).catch(() => void 0);
    }

    return { data: lead };
  }

  async findAll(tenantId: string, query: PaginationDto & { stage?: string; search?: string }): Promise<object> {
    const { stage, search } = query;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const validStages = Object.values(LeadStage) as string[];
    const where = {
      tenantId,
      ...(stage && validStages.includes(stage) && { stage: stage as LeadStage }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getRanking(tenantId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where = { tenantId, stage: { notIn: ['WON', 'LOST'] as LeadStage[] } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, skip, take: limit, orderBy: { score: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getStageStats(tenantId: string): Promise<object> {
    const stages = Object.values(LeadStage);
    const counts = await Promise.all(
      stages.map((stage) =>
        this.prisma.lead.count({ where: { tenantId, stage } }).then((count: number) => ({ stage, count })),
      ),
    );
    return { data: counts };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return { data: lead };
  }

  async getEvents(tenantId: string, id: string): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const events = await this.prisma.leadEvent.findMany({
      where: { leadId: id, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: events };
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const data: Record<string, unknown> = { ...dto };

    // Ao mudar de stage, registrar data de entrada e recalcular SLA
    if (dto.stage && dto.stage !== lead.stage) {
      data.stageEnteredAt = new Date();
      await this.events.record(id, tenantId, 'STAGE_CHANGED', {
        from: lead.stage,
        to: dto.stage,
      });
    }

    const updated = await this.prisma.lead.update({ where: { id }, data });
    await this.scoring.recalculate(id);
    return { data: updated };
  }

  async assign(tenantId: string, id: string, dto: AssignLeadDto): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { assignedTo: dto.assignedTo },
    });
    await this.events.record(id, tenantId, 'ASSIGNED', { assignedTo: dto.assignedTo });
    return { data: updated };
  }

  async scheduleTrial(tenantId: string, id: string, dto: TrialLeadDto): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const trialDate = new Date(dto.trialClassAt);
    const attended = dto.attended ?? false;

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { trialClassAt: trialDate, trialClassAttended: attended },
    });

    await this.events.record(id, tenantId, attended ? 'TRIAL_ATTENDED' : 'TRIAL_SCHEDULED', {
      trialClassAt: trialDate,
    });

    // Enfileirar os 4 jobs de aula experimental
    const dMinus1 = new Date(trialDate);
    dMinus1.setDate(dMinus1.getDate() - 1);
    dMinus1.setHours(9, 0, 0, 0);
    const delayMinus1 = Math.max(0, dMinus1.getTime() - Date.now());

    const followup2h = new Date(trialDate);
    followup2h.setHours(followup2h.getHours() + 2);
    const delay2h = Math.max(0, followup2h.getTime() - Date.now());

    const dPlus1 = new Date(trialDate);
    dPlus1.setDate(dPlus1.getDate() + 1);
    dPlus1.setHours(10, 0, 0, 0);
    const delayPlus1 = Math.max(0, dPlus1.getTime() - Date.now());

    const dPlus3 = new Date(trialDate);
    dPlus3.setDate(dPlus3.getDate() + 3);
    dPlus3.setHours(10, 0, 0, 0);
    const delayPlus3 = Math.max(0, dPlus3.getTime() - Date.now());

    const jobOpts = { attempts: 3, backoff: { type: 'exponential' as const, delay: 5000 } };

    await Promise.all([
      this.leadsQueue.add('trial', { type: 'TRIAL_REMINDER_D1', tenantId, leadId: id }, { ...jobOpts, delay: delayMinus1 }),
      this.leadsQueue.add('trial', { type: 'TRIAL_FOLLOWUP_2H', tenantId, leadId: id }, { ...jobOpts, delay: delay2h }),
      this.leadsQueue.add('trial', { type: 'TRIAL_PROPOSAL_D1', tenantId, leadId: id }, { ...jobOpts, delay: delayPlus1 }),
      this.leadsQueue.add('trial', { type: 'TRIAL_SECOND_FOLLOWUP', tenantId, leadId: id }, { ...jobOpts, delay: delayPlus3 }),
    ]);

    await this.scoring.recalculate(id);
    return { data: updated };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    await this.prisma.lead.delete({ where: { id } });
    return { data: { message: 'Lead removido com sucesso' } };
  }

  async convertToStudent(tenantId: string, id: string): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const student = await this.prisma.student.create({
      data: {
        tenantId,
        name: lead.name,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
      },
    });

    await this.prisma.lead.update({ where: { id }, data: { stage: LeadStage.WON } });
    await this.events.record(id, tenantId, 'CONVERTED', { studentId: student.id });

    return { data: { student, message: 'Lead convertido em aluno com sucesso' } };
  }
}
