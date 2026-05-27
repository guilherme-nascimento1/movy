import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotifChannel, NotifStatus } from '../../../common/enums';
import { EvolutionApiService } from '../services/evolution-api.service';
import { ResendService } from '../services/resend.service';

export const NOTIFICATIONS_QUEUE = 'movy-notifications';

export type BirthdayJob = { type: 'BIRTHDAY'; tenantId: string; studentId: string };
export type AbsenceJob = { type: 'ABSENCE'; tenantId: string; studentId: string; days: number };
export type EnrollmentExpiryJob = { type: 'ENROLLMENT_EXPIRY'; tenantId: string; studentId: string; enrollmentId: string; daysLeft: number };
export type LeadFollowUpJob = { type: 'LEAD_FOLLOWUP'; tenantId: string; leadId: string };

type NotifJob = BirthdayJob | AbsenceJob | EnrollmentExpiryJob | LeadFollowUpJob;

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionApiService,
    private resend: ResendService,
  ) {
    super();
  }

  async process(job: Job<NotifJob>): Promise<void> {
    switch (job.data.type) {
      case 'BIRTHDAY': return this.handleBirthday(job.data);
      case 'ABSENCE': return this.handleAbsence(job.data);
      case 'ENROLLMENT_EXPIRY': return this.handleEnrollmentExpiry(job.data);
      case 'LEAD_FOLLOWUP': return this.handleLeadFollowUp(job.data);
    }
  }

  private async handleBirthday(data: BirthdayJob): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, tenantId: data.tenantId } });
    if (!student?.phone) return;

    const message = `🎂 Feliz aniversário, ${student.name}! A equipe da academia deseja um dia incrível. Continue arrasando nos treinos! 💪`;
    const sent = await this.evolution.sendText(student.phone, message);

    await this.logNotification(data.tenantId, 'BIRTHDAY', NotifChannel.WHATSAPP, sent, { studentId: data.studentId, message });
  }

  private async handleAbsence(data: AbsenceJob): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, tenantId: data.tenantId } });
    if (!student?.phone) return;

    const messages: Record<number, string> = {
      3: `Olá ${student.name}! 👋 Faz 3 dias que não te vemos. Tudo bem? Precisando de algo, é só falar!`,
      7: `Olá ${student.name}! 😟 Sentimos sua falta! Faz 7 dias sem treino. Que tal voltar amanhã?`,
      15: `Olá ${student.name}! 💙 Há 15 dias sem aparecer por aqui. Estamos aqui para ajudar — conte com a gente!`,
    };

    const message = messages[data.days] ?? `Olá ${student.name}! Sentimos sua falta. Volte a treinar!`;
    const sent = await this.evolution.sendText(student.phone, message);

    await this.logNotification(data.tenantId, `ABSENCE_${data.days}_DAYS`, NotifChannel.WHATSAPP, sent, {
      studentId: data.studentId, days: data.days, message,
    });
  }

  private async handleEnrollmentExpiry(data: EnrollmentExpiryJob): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, tenantId: data.tenantId } });
    if (!student?.phone) return;

    const msg = data.daysLeft === 7
      ? `Olá ${student.name}! 📅 Seu plano vence em 7 dias. Renove agora e continue treinando sem interrupção!`
      : `Olá ${student.name}! ⚠️ Seu plano vence em ${data.daysLeft} dias. Renove já!`;

    const sent = await this.evolution.sendText(student.phone, msg);
    await this.logNotification(data.tenantId, 'ENROLLMENT_EXPIRY', NotifChannel.WHATSAPP, sent, {
      studentId: data.studentId, enrollmentId: data.enrollmentId, daysLeft: data.daysLeft,
    });
  }

  private async handleLeadFollowUp(data: LeadFollowUpJob): Promise<void> {
    const lead = await this.prisma.lead.findFirst({ where: { id: data.leadId, tenantId: data.tenantId } });
    if (!lead?.phone) return;

    const message = `Olá ${lead.name}! 👋 Passamos para saber se você ainda tem interesse em conhecer nossa academia. Agende uma aula experimental gratuita!`;
    const sent = await this.evolution.sendText(lead.phone, message);

    await this.logNotification(data.tenantId, 'LEAD_FOLLOWUP', NotifChannel.WHATSAPP, sent, { leadId: data.leadId, message });
  }

  private async logNotification(
    tenantId: string, type: string, channel: NotifChannel, sent: boolean, payload: object,
  ): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        tenantId, type, channel,
        status: sent ? NotifStatus.SENT : NotifStatus.FAILED,
        payload,
        sentAt: sent ? new Date() : undefined,
      },
    });
  }
}
