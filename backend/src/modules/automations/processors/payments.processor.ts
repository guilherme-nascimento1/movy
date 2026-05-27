import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotifChannel, NotifStatus } from '../../../common/enums';
import { EvolutionApiService } from '../services/evolution-api.service';

export const PAYMENTS_QUEUE = 'movy-payments';

export type MarkOverdueJob = { type: 'MARK_OVERDUE' };
export type DunningJob = {
  type: 'DUNNING';
  tenantId: string;
  studentId: string;
  paymentId: string;
  daysOffset: number; // negativo = antes do vencimento, positivo = após
};

@Processor(PAYMENTS_QUEUE)
export class PaymentsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionApiService,
  ) {
    super();
  }

  async process(job: Job<MarkOverdueJob | DunningJob>): Promise<void> {
    if (job.data.type === 'MARK_OVERDUE') return this.handleMarkOverdue();
    if (job.data.type === 'DUNNING') return this.handleDunning(job.data);
  }

  private async handleMarkOverdue(): Promise<void> {
    const result = await this.prisma.payment.updateMany({
      where: { status: 'PENDING', dueDate: { lt: new Date() } },
      data: { status: 'OVERDUE' },
    });
    this.logger.log(`Marcados ${result.count} pagamentos como OVERDUE`);
  }

  private async handleDunning(data: DunningJob): Promise<void> {
    const { tenantId, studentId, paymentId, daysOffset } = data;

    const [student, payment] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: studentId, tenantId } }),
      this.prisma.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: { enrollment: { include: { plan: true } } },
      }),
    ]);

    if (!student || !payment) return;

    const message = this.buildDunningMessage(student.name, payment.enrollment.plan.name, payment.dueDate, daysOffset);

    let sent = false;
    if (student.phone) sent = await this.evolution.sendText(student.phone, message);

    await this.prisma.notificationLog.create({
      data: {
        tenantId,
        type: daysOffset <= 0 ? 'PAYMENT_DUE' : 'PAYMENT_OVERDUE',
        channel: NotifChannel.WHATSAPP,
        status: sent ? NotifStatus.SENT : NotifStatus.FAILED,
        payload: { studentId, paymentId, daysOffset, message },
        sentAt: sent ? new Date() : undefined,
      },
    });
  }

  private buildDunningMessage(name: string, planName: string, dueDate: Date, daysOffset: number): string {
    const due = dueDate.toLocaleDateString('pt-BR');
    if (daysOffset === -7) return `Olá ${name}! 📅 Seu plano *${planName}* vence em 7 dias (${due}). Renove para não perder o acesso!`;
    if (daysOffset === -3) return `Olá ${name}! ⚠️ Seu plano *${planName}* vence em 3 dias (${due}). Regularize agora!`;
    if (daysOffset === 0) return `Olá ${name}! 🔔 Seu plano *${planName}* vence hoje (${due}). Efetue o pagamento para continuar treinando!`;
    if (daysOffset === 3) return `Olá ${name}! ❗ Seu plano *${planName}* venceu há 3 dias. Regularize sua situação para retomar os treinos.`;
    if (daysOffset === 7) return `Olá ${name}! ❌ Plano *${planName}* está vencido há 7 dias. Entre em contato com a academia.`;
    if (daysOffset === 15) return `Olá ${name}! Notamos que seu plano *${planName}* está em aberto. Podemos ajudar? Fale com a gente!`;
    return `Olá ${name}! Seu plano *${planName}* possui parcelas em aberto. Por favor, regularize.`;
  }
}
