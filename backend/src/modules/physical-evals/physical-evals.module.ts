import { Module } from '@nestjs/common';
import { PhysicalEvalsController } from './physical-evals.controller';
import { PhysicalEvalsService } from './physical-evals.service';

@Module({
  controllers: [PhysicalEvalsController],
  providers: [PhysicalEvalsService],
})
export class PhysicalEvalsModule {}
