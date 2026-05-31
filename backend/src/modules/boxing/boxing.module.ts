import { Module } from '@nestjs/common';
import { BoxingService } from './boxing.service';
import { BoxingController } from './boxing.controller';

@Module({
  providers: [BoxingService],
  controllers: [BoxingController],
})
export class BoxingModule {}
