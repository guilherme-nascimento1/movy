import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/create-enrollment.dto';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

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
    await this.findOne(tenantId, id);
    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: { ...dto, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
      include: { student: true, plan: true },
    });
    return { data: enrollment };
  }
}
