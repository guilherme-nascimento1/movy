import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/create-enrollment.dto';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto';
import { NOTIFICATIONS_QUEUE } from '../automations/processors/notifications.processor';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(NOTIFICATIONS_QUEUE) private notificationsQueue: Queue,
  ) {}

  async create(tenantId: string, dto: CreateEnrollmentDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const plan = await this.prisma.academyPlan.findFirst({ where: { id: dto.planId, tenantId, active: true } });
    if (!plan) throw new NotFoundException('Plano não encontrado ou inativo');

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    if (endDate <= startDate) throw new BadRequestException('Data de fim deve ser após a data de início');

    const enrollment = await this.prisma.enrollment.create({
      data: { tenantId, studentId: dto.studentId, planId: dto.planId, startDate, endDate },
      include: { student: true, plan: true },
    });

    // Verificar configuração de jornada do tenant
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId } });
    const journey = (settings?.welcomeJourney as Record<string, boolean> | null) ?? {};

    const jobBase = { tenantId, studentId: dto.studentId, enrollmentId: enrollment.id };
    const jobOpts = { attempts: 3, backoff: { type: 'exponential' as const, delay: 5000 } };
    const DAY = 86400000;

    const scheduleJobs: Promise<unknown>[] = [];

    // Jornada pós-matrícula
    if (journey['d1'] !== false)  scheduleJobs.push(this.notificationsQueue.add('journey', { type: 'JOURNEY_D1',  ...jobBase }, { ...jobOpts, delay: 1 * DAY }));
    if (journey['d7'] !== false)  scheduleJobs.push(this.notificationsQueue.add('journey', { type: 'JOURNEY_D7',  ...jobBase }, { ...jobOpts, delay: 7 * DAY }));
    if (journey['d30'] !== false) scheduleJobs.push(this.notificationsQueue.add('journey', { type: 'JOURNEY_D30', ...jobBase }, { ...jobOpts, delay: 30 * DAY }));
    if (journey['d60'] !== false) scheduleJobs.push(this.notificationsQueue.add('journey', { type: 'JOURNEY_D60', ...jobBase }, { ...jobOpts, delay: 60 * DAY }));
    if (journey['d90'] !== false) scheduleJobs.push(this.notificationsQueue.add('journey', { type: 'JOURNEY_D90', ...jobBase }, { ...jobOpts, delay: 90 * DAY }));

    // NPS satisfaction D+30
    scheduleJobs.push(this.notificationsQueue.add('nps', { type: 'NPS_SATISFACTION', ...jobBase }, { ...jobOpts, delay: 30 * DAY }));

    await Promise.all(scheduleJobs);

    return { data: enrollment };
  }

  async findAll(tenantId: string, query: PaginationDto & { studentId?: string; status?: string }): Promise<object> {
    const { studentId } = query;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'FROZEN'];
    const status = validStatuses.includes(query.status as string) ? query.status : undefined;

    const where = { tenantId, ...(studentId && { studentId }), ...(status && { status: status as never }) };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where, skip, take: limit,
        include: { student: true, plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, tenantId },
      include: { student: true, plan: true, payments: { orderBy: { dueDate: 'asc' } } },
    });
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    return { data: enrollment };
  }

  async update(tenantId: string, id: string, dto: UpdateEnrollmentDto): Promise<object> {
    const existing = await this.prisma.enrollment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Matrícula não encontrada');

    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: { ...dto, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
      include: { student: true, plan: true },
    });

    // NPS exit D+3 ao cancelar
    if (dto.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await this.notificationsQueue.add(
        'nps',
        { type: 'NPS_EXIT', tenantId, studentId: enrollment.studentId, enrollmentId: id },
        { attempts: 3, delay: 3 * 86400000 },
      );
    }

    return { data: enrollment };
  }
}
