import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { LEADS_QUEUE } from '../leads/leads.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: LEADS_QUEUE }),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
})
export class StudentsModule {}
