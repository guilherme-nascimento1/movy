import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LeadsService, LEADS_QUEUE } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadEventService } from './services/lead-event.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: LEADS_QUEUE }),
    IntegrationsModule,
  ],
  providers: [LeadsService, LeadScoringService, LeadEventService],
  controllers: [LeadsController],
  exports: [LeadScoringService, LeadEventService, LEADS_QUEUE],
})
export class LeadsModule {}
