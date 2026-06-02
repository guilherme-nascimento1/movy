import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AutomationsService } from './automations.service';
import { AiService } from '../ai/ai.service';
import { LEADS_QUEUE } from './processors/leads.processor';

@Injectable()
export class AutomationsScheduler {
  private readonly logger = new Logger(AutomationsScheduler.name);

  constructor(
    private automations: AutomationsService,
    private aiService: AiService,
    @InjectQueue(LEADS_QUEUE) private leadsQueue: Queue,
  ) {}

  @Cron('0 6 * * *', { name: 'mark-overdue', timeZone: 'America/Sao_Paulo' })
  async markOverduePayments(): Promise<void> {
    this.logger.log('[Cron 06:00] Iniciando marcação de pagamentos vencidos');
    await this.automations.runMarkOverdue();
  }

  @Cron('0 7 * * *', { name: 'payment-dunning', timeZone: 'America/Sao_Paulo' })
  async paymentDunning(): Promise<void> {
    this.logger.log('[Cron 07:00] Iniciando régua de cobrança');
    await this.automations.runPaymentDunning();
  }

  @Cron('0 8 * * *', { name: 'enrollment-expiry', timeZone: 'America/Sao_Paulo' })
  async enrollmentExpiryAlerts(): Promise<void> {
    this.logger.log('[Cron 08:00] Iniciando alertas de vencimento de plano');
    await this.automations.runEnrollmentExpiryAlerts();
  }

  @Cron('0 9 * * *', { name: 'birthday-greetings', timeZone: 'America/Sao_Paulo' })
  async birthdayGreetings(): Promise<void> {
    this.logger.log('[Cron 09:00] Iniciando mensagens de aniversário');
    await this.automations.runBirthdayGreetings();
  }

  @Cron('0 10 * * *', { name: 'absence-alerts', timeZone: 'America/Sao_Paulo' })
  async absenceAlerts(): Promise<void> {
    this.logger.log('[Cron 10:00] Iniciando alertas de ausência');
    await this.automations.runAbsenceAlerts();
  }

  @Cron('0 3 * * *', { name: 'churn-risk', timeZone: 'America/Sao_Paulo' })
  async churnRiskCalculation(): Promise<void> {
    this.logger.log('[Cron 03:00] Iniciando cálculo de churn risk');
    await this.aiService.calculateAllChurnRisks();
  }

  @Cron('5 6 * * *', { name: 'lead-score-decay', timeZone: 'America/Sao_Paulo' })
  async leadScoreDecay(): Promise<void> {
    this.logger.log('[Cron 06:05] Iniciando decay de score de leads');
    await this.leadsQueue.add('lead-score-decay', { type: 'LEAD_SCORE_DECAY' }, { attempts: 3 });
  }

  @Cron('0 * * * *', { name: 'lead-sla-check', timeZone: 'America/Sao_Paulo' })
  async leadSlaCheck(): Promise<void> {
    this.logger.log('[Cron horário] Iniciando verificação de SLA de leads');
    await this.leadsQueue.add('lead-sla-check', { type: 'LEAD_SLA_CHECK' }, { attempts: 3 });
  }
}
