import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifChannel, NotifStatus } from '../../common/enums';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findAll(tenantId: string, query: PaginationDto & { status?: string; channel?: string }): Promise<object> {
    const { status, channel } = query;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const validStatuses = Object.values(NotifStatus) as string[];
    const validChannels = Object.values(NotifChannel) as string[];
    const where = {
      tenantId,
      ...(status && validStatuses.includes(status) && { status: status as NotifStatus }),
      ...(channel && validChannels.includes(channel) && { channel: channel as NotifChannel }),
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

  async sendPush(tenantId: string, dto: { expoPushTokens: string[]; title: string; body: string; data?: Record<string, unknown> }): Promise<object> {
    const { expoPushTokens, title, body, data } = dto;

    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }));

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ data: Array<{ status: string; message?: string }> }>(
          'https://exp.host/--/api/v2/push/send',
          messages,
          { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
        ),
      );

      const results = response.data?.data ?? [];
      const successCount = results.filter((r) => r.status === 'ok').length;

      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          type: 'PUSH',
          channel: NotifChannel.PUSH,
          status: successCount > 0 ? NotifStatus.SENT : NotifStatus.FAILED,
          payload: { title, body, tokens: expoPushTokens, results },
          sentAt: successCount > 0 ? new Date() : null,
        },
      });

      return { data: { sent: successCount, total: expoPushTokens.length } };
    } catch (err: unknown) {
      this.logger.error(`Erro ao enviar push: ${(err as Error).message}`);
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          type: 'PUSH',
          channel: NotifChannel.PUSH,
          status: NotifStatus.FAILED,
          payload: { title, body, tokens: expoPushTokens, error: (err as Error).message },
        },
      });
      return { data: { sent: 0, total: expoPushTokens.length, error: 'Falha ao enviar push notifications' } };
    }
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
