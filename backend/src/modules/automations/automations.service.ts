import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PAYMENTS_QUEUE } from './processors/payments.processor';
import { NOTIFICATIONS_QUEUE } from './processors/notifications.processor';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(PAYMENTS_QUEUE) private paymentsQueue: Queue,
    @InjectQueue(NOTIFICATIONS_QUEUE) private notificationsQueue: Queue,
  ) {}

  // ── Chamado pelo scheduler às 06:00 ──────────────────────
  async runMarkOverdue(): Promise<{ queued: number }> {
    await this.paymentsQueue.add('mark-overdue', { type: 'MARK_OVERDUE' }, { attempts: 3 });
    this.logger.log('Job MARK_OVERDUE enfileirado');
    return { queued: 1 };
  }

  // ── Chamado pelo scheduler às 07:00 ──────────────────────
  async runPaymentDunning(): Promise<{ queued: number }> {
    const today = new Date();
    const offsets = [-7, -3, 0, 3, 7, 15, 30];
    let count = 0;

    for (const offset of offsets) {
      const target = new Date(today);
      target.setDate(today.getDate() - offset); // offset negativo = vence no futuro

      const start = new Date(target); start.setHours(0, 0, 0, 0);
      const end = new Date(target); end.setHours(23, 59, 59, 999);

      const payments = await this.prisma.payment.findMany({
        where: {
          status: offset <= 0 ? 'PENDING' : 'OVERDUE',
          dueDate: { gte: start, lte: end },
        },
        include: { enrollment: true },
        take: 500,
      });

      for (const p of payments) {
        await this.paymentsQueue.add(
          'dunning',
          { type: 'DUNNING', tenantId: p.tenantId, studentId: p.enrollment.studentId, paymentId: p.id, daysOffset: offset },
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        );
        count++;
      }
    }

    this.logger.log(`Régua de cobrança: ${count} jobs enfileirados`);
    return { queued: count };
  }

  // ── Chamado pelo scheduler às 08:00 ──────────────────────
  async runEnrollmentExpiryAlerts(): Promise<{ queued: number }> {
    const today = new Date();
    let count = 0;

    for (const daysLeft of [7, 3]) {
      const target = new Date(today);
      target.setDate(today.getDate() + daysLeft);
      const start = new Date(target); start.setHours(0, 0, 0, 0);
      const end = new Date(target); end.setHours(23, 59, 59, 999);

      const enrollments = await this.prisma.enrollment.findMany({
        where: { status: 'ACTIVE', endDate: { gte: start, lte: end } },
        take: 500,
      });

      for (const e of enrollments) {
        await this.notificationsQueue.add(
          'enrollment-expiry',
          { type: 'ENROLLMENT_EXPIRY', tenantId: e.tenantId, studentId: e.studentId, enrollmentId: e.id, daysLeft },
          { attempts: 3 },
        );
        count++;
      }
    }

    this.logger.log(`Alertas de vencimento: ${count} jobs enfileirados`);
    return { queued: count };
  }

  // ── Chamado pelo scheduler às 09:00 ──────────────────────
  async runBirthdayGreetings(): Promise<{ queued: number }> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const students = await this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        birthdate: { not: null },
      },
      select: { id: true, tenantId: true, birthdate: true },
    });

    let count = 0;
    for (const s of students) {
      if (!s.birthdate) continue;
      if (s.birthdate.getMonth() + 1 === month && s.birthdate.getDate() === day) {
        await this.notificationsQueue.add(
          'birthday',
          { type: 'BIRTHDAY', tenantId: s.tenantId, studentId: s.id },
          { attempts: 3 },
        );
        count++;
      }
    }

    this.logger.log(`Aniversários: ${count} jobs enfileirados`);
    return { queued: count };
  }

  // ── Chamado pelo scheduler às 10:00 ──────────────────────
  async runAbsenceAlerts(): Promise<{ queued: number }> {
    let count = 0;
    const today = new Date();

    for (const days of [3, 7, 15]) {
      const since = new Date(today);
      since.setDate(today.getDate() - days);
      since.setHours(0, 0, 0, 0);
      const sinceEnd = new Date(since); sinceEnd.setHours(23, 59, 59, 999);

      // Alunos que tiveram último check-in exatamente há `days` dias
      const checkins = await this.prisma.classCheckin.groupBy({
        by: ['studentId'],
        _max: { checkedAt: true },
        having: { checkedAt: { _max: { gte: since, lte: sinceEnd } } },
      });

      for (const c of checkins) {
        const student = await this.prisma.student.findFirst({
          where: { id: c.studentId, status: 'ACTIVE' },
          select: { id: true, tenantId: true },
        });
        if (!student) continue;

        await this.notificationsQueue.add(
          'absence',
          { type: 'ABSENCE', tenantId: student.tenantId, studentId: student.id, days },
          { attempts: 3 },
        );
        count++;
      }
    }

    this.logger.log(`Alertas de ausência: ${count} jobs enfileirados`);
    return { queued: count };
  }

  async getQueueStats(): Promise<object> {
    const [pWaiting, pActive, pFailed, nWaiting, nActive, nFailed] = await Promise.all([
      this.paymentsQueue.getWaitingCount(),
      this.paymentsQueue.getActiveCount(),
      this.paymentsQueue.getFailedCount(),
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getFailedCount(),
    ]);

    return {
      data: {
        payments: { waiting: pWaiting, active: pActive, failed: pFailed },
        notifications: { waiting: nWaiting, active: nActive, failed: nFailed },
      },
    };
  }
}
