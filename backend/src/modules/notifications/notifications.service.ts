import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifChannel, NotifStatus } from '../../common/enums';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationDto & { status?: string; channel?: string }): Promise<object> {
    const { page = 1, limit = 20, status, channel } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status: status as NotifStatus }),
      ...(channel && { channel: channel as NotifChannel }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notificationLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async sendPaymentReminder(tenantId: string, studentId: string, paymentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { enrollment: { include: { plan: true } } },
    });

    if (!student || !payment) return { data: { message: 'Notificação não enviada: dados insuficientes' } };

    const log = await this.prisma.notificationLog.create({
      data: {
        tenantId,
        type: 'PAYMENT_DUE',
        channel: NotifChannel.WHATSAPP,
        status: NotifStatus.PENDING,
        payload: {
          studentId, paymentId,
          studentName: student.name,
          phone: student.phone,
          amount: payment.amount,
          dueDate: payment.dueDate,
          plan: payment.enrollment.plan.name,
        },
      },
    });

    return { data: log };
  }

  async getStats(tenantId: string): Promise<object> {
    const [sent, pending, failed] = await this.prisma.$transaction([
      this.prisma.notificationLog.count({ where: { tenantId, status: NotifStatus.SENT } }),
      this.prisma.notificationLog.count({ where: { tenantId, status: NotifStatus.PENDING } }),
      this.prisma.notificationLog.count({ where: { tenantId, status: NotifStatus.FAILED } }),
    ]);

    return { data: { sent, pending, failed, total: sent + pending + failed } };
  }
}
