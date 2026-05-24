import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto';
import { PaymentStatus } from '../../common/enums';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePaymentDto): Promise<object> {
    const enrollment = await this.prisma.enrollment.findFirst({ where: { id: dto.enrollmentId, tenantId } });
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');

    const payment = await this.prisma.payment.create({
      data: { tenantId, ...dto, dueDate: new Date(dto.dueDate) },
      include: { enrollment: { include: { student: true } } },
    });
    return { data: payment };
  }

  async findAll(tenantId: string, query: PaginationDto & { status?: string; enrollmentId?: string }): Promise<object> {
    const { page = 1, limit = 20, status, enrollmentId } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status: status as PaymentStatus }),
      ...(enrollmentId && { enrollmentId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where, skip, take: limit,
        include: { enrollment: { include: { student: true, plan: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOverdue(tenantId: string, query: PaginationDto): Promise<object> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      status: PaymentStatus.PENDING,
      dueDate: { lt: new Date() },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where, skip, take: limit,
        include: { enrollment: { include: { student: true, plan: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: { enrollment: { include: { student: true, plan: true } } },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return { data: payment };
  }

  async update(tenantId: string, id: string, dto: UpdatePaymentDto): Promise<object> {
    await this.findOne(tenantId, id);
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { ...dto, paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined },
      include: { enrollment: { include: { student: true } } },
    });
    return { data: payment };
  }

  async confirmPayment(tenantId: string, id: string): Promise<object> {
    return this.update(tenantId, id, { status: PaymentStatus.PAID, paidAt: new Date().toISOString() });
  }
}
