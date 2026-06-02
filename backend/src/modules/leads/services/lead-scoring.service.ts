import { Injectable } from '@nestjs/common';
import { Prisma, LeadStage } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeadEventService } from './lead-event.service';

interface ScoreBreakdown {
  origin: number;
  trialScheduled: number;
  trialAttended: number;
  responseSpeed: number;
  decay: number;
}

@Injectable()
export class LeadScoringService {
  constructor(
    private prisma: PrismaService,
    private leadEventService: LeadEventService,
  ) {}

  async recalculate(leadId: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        tenantId: true,
        source: true,
        stage: true,
        createdAt: true,
        stageEnteredAt: true,
        trialClassAt: true,
        trialClassAttended: true,
        scoreBreakdown: true,
      },
    });
    if (!lead) return;

    const now = new Date();
    const breakdown: ScoreBreakdown = {
      origin: this.calcOriginScore(lead.source),
      trialScheduled: lead.trialClassAt ? 15 : 0,
      trialAttended: lead.trialClassAttended ? 30 : 0,
      responseSpeed: this.calcResponseSpeed(lead.stage, lead.createdAt, lead.stageEnteredAt),
      decay: this.calcDecay(lead.stage, lead.stageEnteredAt, now),
    };

    const score = Math.max(0, Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0)));

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { score, scoreUpdatedAt: now, scoreBreakdown: breakdown as unknown as Prisma.InputJsonValue },
    });

    await this.leadEventService.record(leadId, lead.tenantId, 'SCORE_UPDATED', { score, breakdown });
  }

  // ── Aplica decay diário em leads sem atividade ≥ 7 dias ──
  async applyDecayAll(tenantId?: string): Promise<number> {
    const where = {
      stage: { notIn: [LeadStage.WON, LeadStage.LOST] },
      ...(tenantId && { tenantId }),
    };
    const leads = await this.prisma.lead.findMany({
      where,
      select: { id: true, tenantId: true, stageEnteredAt: true, scoreBreakdown: true, score: true },
    });

    let updated = 0;
    const now = new Date();

    for (const lead of leads) {
      const daysSinceActivity = Math.floor((now.getTime() - lead.stageEnteredAt.getTime()) / 86400000);
      if (daysSinceActivity < 7) continue;

      const decaySteps = Math.floor(daysSinceActivity / 7);
      const decay = Math.max(-50, decaySteps * -10);

      const prev = (lead.scoreBreakdown as ScoreBreakdown | null) ?? {
        origin: 0, trialScheduled: 0, trialAttended: 0, responseSpeed: 0, decay: 0,
      };
      const newBreakdown = { ...prev, decay };
      const score = Math.max(0, Math.min(100, Object.values(newBreakdown).reduce((a, b) => a + b, 0)));

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { score, scoreUpdatedAt: now, scoreBreakdown: newBreakdown },
      });
      updated++;
    }

    return updated;
  }

  private calcOriginScore(source: string | null): number {
    if (!source) return 10;
    const s = source.toLowerCase();
    if (s === 'indicacao' || s === 'indicação') return 30;
    if (s === 'instagram' || s === 'google' || s.includes('ads')) return 20;
    return 15;
  }

  private calcResponseSpeed(stage: string, createdAt: Date, stageEnteredAt: Date): number {
    if (stage === 'NEW') return 0;
    const diffMs = stageEnteredAt.getTime() - createdAt.getTime();
    const diffHours = diffMs / 3600000;
    if (diffHours < 1) return 15;
    if (diffHours < 24) return 5;
    return 0;
  }

  private calcDecay(stage: string, stageEnteredAt: Date, now: Date): number {
    if (stage === 'WON' || stage === 'LOST') return 0;
    const days = Math.floor((now.getTime() - stageEnteredAt.getTime()) / 86400000);
    return Math.max(-50, Math.floor(days / 7) * -10);
  }
}
