import { Module } from '@nestjs/common';
import { NpsService } from './nps.service';
import { NpsController } from './nps.controller';

@Module({
  providers: [NpsService],
  controllers: [NpsController],
  exports: [NpsService],
})
export class NpsModule {}
