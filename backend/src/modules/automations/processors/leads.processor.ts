import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotifChannel, NotifStatus } from '../../../common/enums';
import { EvolutionApiService } from '../services/evolution-api.service';
import { LeadScoringService } from '../../leads/services/lead-scoring.service';

export const LEADS_QUEUE = 'movy-leads';

export type LeadScoreDecayJob = { type: 'LEAD_SCORE_DECAY' };
export type LeadSlaCheckJob = { type: 'LEAD_SLA_CHECK' };
export type TrialReminderJob = {
  type: 'TRIAL_REMINDER_D1' | 'TRIAL_FOLLOWUP_2H' | 'TRIAL_PROPOSAL_D1' | 'TRIAL_SECOND_FOLLOWUP';
  tenantId: string;
  leadId: string;
};
export type ReactivationJob = {
  type: 'REACTIVATION';
  tenantId: string;
  studentId: string;
  reason: string;
};

type LeadsJob = LeadScoreDecayJob | LeadSlaCheckJob | TrialReminderJob | ReactivationJob;

@Processor(LEADS_QUEUE)
export class LeadsProcessor extends WorkerHost {
  private readonly logger = new Logger(LeadsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private evolution: EvolutionApiService,
    private scoring: LeadScoringService,
  ) {
    super();
  }

  async process(job: Job<LeadsJob>): Promise<void> {
    switch (job.data.type) {
      case 'LEAD_SCORE_DECAY':   return this.handleDecay();
      case 'LEAD_SLA_CHECK':     return this.handleSlaCheck();
      case 'TRIAL_REMINDER_D1':  return this.handleTrial(job.data as TrialReminderJob);
      case 'TRIAL_FOLLOWUP_2H':  return this.handleTrial(job.data as TrialReminderJob);
      case 'TRIAL_PROPOSAL_D1':  return this.handleTrial(job.data as TrialReminderJob);
      case 'TRIAL_SECOND_FOLLOWUP': return this.handleTrial(job.data as TrialReminderJob);
      case 'REACTIVATION':       return this.handleReactivation(job.data as ReactivationJob);
    }
  }

  // ── Score decay diário ──────────────────────────────────
  private async handleDecay(): Promise<void> {
    const updated = await this.scoring.applyDecayAll();
    this.logger.log(`Score decay aplicado em ${updated} leads`);
  }

  // ── SLA check horário ───────────────────────────────────
  private async handleSlaCheck(): Promise<void> {
    const now = new Date();
    const leads = await this.prisma.lead.findMany({
      where: { stage: { notIn: ['WON', 'LOST'] } },
      select: { id: true, tenantId: true, name: true, stageEnteredAt: true, stageSlaHours: true, assignedTo: true, stage: true },
    });

    let breached = 0;
    for (const lead of leads) {
      const elapsedHours = (now.getTime() - lead.stageEnteredAt.getTime()) / 3600000;
      if (elapsedHours < lead.stageSlaHours) continue;

      // Verificar se já gerou evento de breach recentemente (evitar duplicatas)
      const recentBreach = await this.prisma.leadEvent.findFirst({
        where: {
          leadId: lead.id,
          type: 'SLA_BREACH',
          createdAt: { gte: new Date(Date.now() - 3600000) }, // última hora
        },
      });
      if (recentBreach) continue;

      await this.prisma.leadEvent.create({
        data: { leadId: lead.id, tenantId: lead.tenantId, type: 'SLA_BREACH', payload: { stage: lead.stage, hoursElapsed: Math.round(elapsedHours) } },
      });

      // Notificar responsável via push (se tiver assignedTo)
      if (lead.assignedTo) {
        const device = await this.prisma.deviceToken.findFirst({ where: { userId: lead.assignedTo } });
        if (device) {
          this.logger.log(`SLA breach para lead ${lead.id} — notificando ${lead.assignedTo}`);
        }
      }
      breached++;
    }
    this.logger.log(`SLA check: ${breached} leads em breach`);
  }

  // ── Automações de aula experimental ────────────────────
  private async handleTrial(data: TrialReminderJob): Promise<void> {
    const lead = await this.prisma.lead.findFirst({
      where: { id: data.leadId, tenantId: data.tenantId },
    });
    if (!lead?.phone) return;

    const messages: Record<string, string> = {
      TRIAL_REMINDER_D1: `Olá ${lead.name}! 💪 Só lembrando que sua aula experimental é amanhã. Estamos te esperando!`,
      TRIAL_FOLLOWUP_2H: `Olá ${lead.name}! 😊 Como foi sua aula? Adoraríamos saber sua opinião e te ajudar a dar o próximo passo!`,
      TRIAL_PROPOSAL_D1: `Olá ${lead.name}! 🎯 Que tal aproveitar e garantir sua vaga? Temos planos a partir de R$149/mês. Posso te contar mais?`,
      TRIAL_SECOND_FOLLOWUP: `Olá ${lead.name}! 👋 Passamos para saber se você ainda tem interesse em continuar treinando com a gente. Podemos conversar?`,
    };

    const message = messages[data.type];
    if (!message) return;

    const sent = await this.evolution.sendText(lead.phone, message);
    await this.logNotification(data.tenantId, data.type, NotifChannel.WHATSAPP, sent, { leadId: data.leadId });

    if (sent) {
      await this.prisma.leadEvent.create({
        data: { leadId: data.leadId, tenantId: data.tenantId, type: 'MESSAGE_SENT', payload: { jobType: data.type } },
      });
    }
  }

  // ── Reativação de ex-alunos ─────────────────────────────
  private async handleReactivation(data: ReactivationJob): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, tenantId: data.tenantId },
    });
    if (!student?.phone) return;

    const messages: Record<string, string> = {
      PRECO: `Olá ${student.name}! 🎁 Sentimos sua falta! Preparamos uma condição especial para você voltar a treinar. Podemos conversar?`,
      MUDANCA: `Olá ${student.name}! 😊 Você está de volta na cidade? Estamos aqui e adoraríamos te ver treinar novamente!`,
      LESAO: `Olá ${student.name}! 💙 Esperamos que esteja se recuperando bem. Quando quiser voltar, temos treinos adaptados para a sua situação!`,
      TEMPO: `Olá ${student.name}! ⏰ A vida ficou corrida, mas a saúde é sempre prioridade. Temos horários flexíveis — pode ser que encontremos um jeito!`,
      OUTRO: `Olá ${student.name}! 💚 Sentimos sua falta! Queremos saber como você está e se podemos fazer algo para você voltar a treinar.`,
    };

    const message = messages[data.reason] ?? messages['OUTRO'];
    const sent = await this.evolution.sendText(student.phone, message);
    await this.logNotification(data.tenantId, `REACTIVATION_${data.reason}`, NotifChannel.WHATSAPP, sent, {
      studentId: data.studentId, reason: data.reason,
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
