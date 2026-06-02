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
export type NpsJob = { type: 'NPS_SATISFACTION' | 'NPS_EXIT'; tenantId: string; studentId: string; enrollmentId: string };
export type JourneyJob = {
  type: 'JOURNEY_D1' | 'JOURNEY_D7' | 'JOURNEY_D30' | 'JOURNEY_D60' | 'JOURNEY_D90';
  tenantId: string;
  studentId: string;
  enrollmentId: string;
};

type NotifJob = BirthdayJob | AbsenceJob | EnrollmentExpiryJob | LeadFollowUpJob | NpsJob | JourneyJob;

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
      case 'BIRTHDAY':           return this.handleBirthday(job.data as BirthdayJob);
      case 'ABSENCE':            return this.handleAbsence(job.data as AbsenceJob);
      case 'ENROLLMENT_EXPIRY':  return this.handleEnrollmentExpiry(job.data as EnrollmentExpiryJob);
      case 'LEAD_FOLLOWUP':      return this.handleLeadFollowUp(job.data as LeadFollowUpJob);
      case 'NPS_SATISFACTION':   return this.handleNps(job.data as NpsJob);
      case 'NPS_EXIT':           return this.handleNps(job.data as NpsJob);
      case 'JOURNEY_D1':         return this.handleJourney(job.data as JourneyJob);
      case 'JOURNEY_D7':         return this.handleJourney(job.data as JourneyJob);
      case 'JOURNEY_D30':        return this.handleJourney(job.data as JourneyJob);
      case 'JOURNEY_D60':        return this.handleJourney(job.data as JourneyJob);
      case 'JOURNEY_D90':        return this.handleJourney(job.data as JourneyJob);
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

  // ── NPS ─────────────────────────────────────────────────
  private async handleNps(data: NpsJob): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, tenantId: data.tenantId } });
    if (!student?.phone) return;

    const isSatisfaction = data.type === 'NPS_SATISFACTION';
    const message = isSatisfaction
      ? `Olá ${student.name}! 😊 Você está conosco há 30 dias — ótimo! De 0 a 10, o quanto você indicaria nossa academia para um amigo? Responda com um número.`
      : `Olá ${student.name}! Sentimos muito pela sua saída. Poderia nos contar sua nota de 0 a 10 para melhorarmos? Sua opinião é muito importante!`;

    const sent = await this.evolution.sendText(student.phone, message);
    await this.logNotification(data.tenantId, data.type, NotifChannel.WHATSAPP, sent, {
      studentId: data.studentId, enrollmentId: data.enrollmentId,
    });
  }

  // ── Jornada pós-matrícula ────────────────────────────────
  private async handleJourney(data: JourneyJob): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: data.studentId, tenantId: data.tenantId } });
    if (!student?.phone) return;

    // Verificar se a matrícula ainda está ativa
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: data.enrollmentId, status: 'ACTIVE' },
    });
    if (!enrollment) return;

    const messages: Record<string, string> = {
      JOURNEY_D1:  `Bem-vindo, ${student.name}! 🎉 Estamos muito felizes em ter você aqui. Qualquer dúvida sobre horários ou treinos, é só falar!`,
      JOURNEY_D7:  `Olá ${student.name}! 💪 Como estão sendo seus primeiros treinos? Sua evolução nos importa muito!`,
      JOURNEY_D30: `Olá ${student.name}! 🌟 Um mês de treinos — você está indo muito bem! De 0 a 10, o quanto você indicaria nossa academia para um amigo?`,
      JOURNEY_D60: `Olá ${student.name}! 📊 Já são 2 meses de dedicação! Que tal agendar uma avaliação física para ver sua evolução?`,
      JOURNEY_D90: `Parabéns, ${student.name}! 🏆 3 meses de comprometimento. Você já alcançou resultados incríveis! Conheça nossos planos com mais benefícios.`,
    };

    const message = messages[data.type];
    if (!message) return;

    const sent = await this.evolution.sendText(student.phone, message);
    await this.logNotification(data.tenantId, data.type, NotifChannel.WHATSAPP, sent, {
      studentId: data.studentId, enrollmentId: data.enrollmentId,
    });
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
