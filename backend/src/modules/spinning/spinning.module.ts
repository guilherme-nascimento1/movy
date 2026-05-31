import { Module } from '@nestjs/common';
import { SpinningService } from './spinning.service';
import { SpinningController } from './spinning.controller';

@Module({
  providers: [SpinningService],
  controllers: [SpinningController],
})
export class SpinningModule {}
