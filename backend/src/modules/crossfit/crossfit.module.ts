import { Module } from '@nestjs/common';
import { CrossfitController } from './crossfit.controller';
import { CrossfitService } from './crossfit.service';

@Module({
  controllers: [CrossfitController],
  providers: [CrossfitService],
})
export class CrossfitModule {}
