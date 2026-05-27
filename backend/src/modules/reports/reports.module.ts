import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ExcelGenerator } from './generators/excel.generator';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ExcelGenerator],
})
export class ReportsModule {}
