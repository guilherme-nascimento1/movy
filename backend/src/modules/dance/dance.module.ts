import { Module } from '@nestjs/common';
import { DanceService } from './dance.service';
import { DanceController } from './dance.controller';

@Module({
  providers: [DanceService],
  controllers: [DanceController],
})
export class DanceModule {}
