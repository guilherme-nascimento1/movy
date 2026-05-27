import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Resumo financeiro', description: 'Totais de receita por status no período' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { total: { type: 'number' }, paid: { type: 'number' }, overdue: { type: 'number' }, pending: { type: 'number' } } } } } })
  @Get('financial/summary')
  financialSummary(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<object> {
    return this.reportsService.financialSummary(tenantId, { startDate, endDate });
  }

  @ApiOperation({ summary: 'Retenção de alunos', description: 'Série mensal dos últimos 6 meses: alunos ativos, novos e cancelamentos' })
  @ApiResponse({ status: 200, schema: { properties: { data: { type: 'array', items: { properties: { label: { type: 'string' }, active: { type: 'number' }, new: { type: 'number' }, cancelled: { type: 'number' } } } } } } })
  @Get('retention')
  retention(@TenantId() tenantId: string): Promise<object> {
    return this.reportsService.retentionReport(tenantId);
  }

  @ApiOperation({ summary: 'Exportar financeiro (Excel)', description: 'Baixa planilha .xlsx com todos os pagamentos do período' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Arquivo .xlsx' })
  @Get('financial/export')
  async exportFinancial(
    @TenantId() tenantId: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<void> {
    const buffer = await this.reportsService.exportFinancialExcel(tenantId, { startDate, endDate });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="financeiro.xlsx"');
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Exportar alunos (Excel)', description: 'Baixa planilha .xlsx com todos os alunos e seus planos' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Arquivo .xlsx' })
  @Get('students/export')
  async exportStudents(@TenantId() tenantId: string, @Res() res: Response): Promise<void> {
    const buffer = await this.reportsService.exportStudentsExcel(tenantId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="alunos.xlsx"');
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Exportar inadimplência (Excel)', description: 'Baixa planilha .xlsx com todos os pagamentos OVERDUE, ordenados por dias vencidos' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Arquivo .xlsx' })
  @Get('overdue/export')
  async exportOverdue(@TenantId() tenantId: string, @Res() res: Response): Promise<void> {
    const buffer = await this.reportsService.exportOverdueExcel(tenantId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inadimplencia.xlsx"');
    res.send(buffer);
  }
}
