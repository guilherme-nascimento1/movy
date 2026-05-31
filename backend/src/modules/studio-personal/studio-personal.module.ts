import { Module } from '@nestjs/common';
import { StudioPersonalService } from './studio-personal.service';
import { StudioPersonalController } from './studio-personal.controller';

@Module({
  providers: [StudioPersonalService],
  controllers: [StudioPersonalController],
})
export class StudioPersonalModule {}
