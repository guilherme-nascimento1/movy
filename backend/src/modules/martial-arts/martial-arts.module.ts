import { Module } from '@nestjs/common';
import { MartialArtsController } from './martial-arts.controller';
import { MartialArtsService } from './martial-arts.service';

@Module({
  controllers: [MartialArtsController],
  providers: [MartialArtsService],
})
export class MartialArtsModule {}
