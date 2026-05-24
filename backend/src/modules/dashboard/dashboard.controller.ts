import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { KpiResponseDto, RevenueChartResponseDto } from './dto/dashboard-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: 'KPIs principais',
    description: 'Retorna métricas do mês atual: alunos ativos, receita, inadimplência e variação % vs. mês anterior',
  })
  @ApiResponse({ status: 200, type: KpiResponseDto })
  @Get('kpis')
  getKpis(@TenantId() tenantId: string): Promise<object> {
    return this.dashboardService.getKpis(tenantId);
  }

  @ApiOperation({
    summary: 'Gráfico de receita mensal',
    description: 'Array dos últimos 6 meses com receita confirmada (status=PAID) por mês',
  })
  @ApiResponse({ status: 200, type: RevenueChartResponseDto })
  @Get('revenue-chart')
  getRevenueChart(@TenantId() tenantId: string): Promise<object> {
    return this.dashboardService.getRevenueChart(tenantId);
  }
}
