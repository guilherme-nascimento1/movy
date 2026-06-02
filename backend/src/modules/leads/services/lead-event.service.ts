import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type LeadEventType =
  | 'CREATED'
  | 'STAGE_CHANGED'
  | 'ASSIGNED'
  | 'SCORE_UPDATED'
  | 'SLA_BREACH'
  | 'TRIAL_SCHEDULED'
  | 'TRIAL_ATTENDED'
  | 'MESSAGE_SENT'
  | 'CONVERTED'
  | 'LOST';

@Injectable()
export class LeadEventService {
  constructor(private prisma: PrismaService) {}

  async record(leadId: string, tenantId: string, type: LeadEventType, payload?: object): Promise<void> {
    await this.prisma.leadEvent.create({
      data: { leadId, tenantId, type, payload: payload ?? {} },
    });
  }
}
