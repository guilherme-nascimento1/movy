import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { NOTIFICATIONS_QUEUE } from '../automations/processors/notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
