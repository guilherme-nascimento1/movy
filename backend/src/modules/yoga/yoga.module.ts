import { Module } from '@nestjs/common';
import { YogaService } from './yoga.service';
import { YogaController } from './yoga.controller';

@Module({
  providers: [YogaService],
  controllers: [YogaController],
})
export class YogaModule {}
