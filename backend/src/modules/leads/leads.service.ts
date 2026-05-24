import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateLeadDto, UpdateLeadDto, LeadStage } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateLeadDto): Promise<object> {
    const lead = await this.prisma.lead.create({
      data: { tenantId, ...dto },
    });
    return { data: lead };
  }

  async findAll(tenantId: string, query: PaginationDto & { stage?: string; search?: string }): Promise<object> {
    const { page = 1, limit = 20, stage, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(stage && { stage: stage as LeadStage }),
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

  async update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<object> {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead não encontrado');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: dto,
    });
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

    return { data: { student, message: 'Lead convertido em aluno com sucesso' } };
  }
}
