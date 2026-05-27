import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AutomationsScheduler } from './automations.scheduler';
import { PaymentsProcessor, PAYMENTS_QUEUE } from './processors/payments.processor';
import { NotificationsProcessor, NOTIFICATIONS_QUEUE } from './processors/notifications.processor';
import { EvolutionApiService } from './services/evolution-api.service';
import { ResendService } from './services/resend.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: PAYMENTS_QUEUE }, { name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [AutomationsController],
  providers: [
    AutomationsService,
    AutomationsScheduler,
    PaymentsProcessor,
    NotificationsProcessor,
    EvolutionApiService,
    ResendService,
  ],
  exports: [EvolutionApiService, ResendService],
})
export class AutomationsModule {}
