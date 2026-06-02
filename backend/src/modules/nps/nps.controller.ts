import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NpsService } from './nps.service';
import { CreateNpsDto, NpsReportDto } from './dto/nps.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('nps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('nps')
export class NpsController {
  constructor(private readonly npsService: NpsService) {}

  @ApiOperation({ summary: 'Registrar resposta NPS', description: 'Salva a nota (0–10) e comentário opcional. Tipos: "satisfaction" (D+30 da matrícula) ou "exit" (D+3 do cancelamento).' })
  @ApiResponse({ status: 201, schema: { properties: { data: { description: 'NpsResponse criado' } } } })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateNpsDto): Promise<object> {
    return this.npsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Relatório NPS', description: 'Score médio, NPS calculado (% promotores - % detratores), distribuição e comentários recentes.' })
  @ApiResponse({ status: 200, type: NpsReportDto })
  @Get('report')
  getReport(@TenantId() tenantId: string): Promise<object> {
    return this.npsService.getReport(tenantId);
  }
}
