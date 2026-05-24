import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'KPIs principais', description: 'Alunos ativos, receita, inadimplência e crescimento' })
  @ApiResponse({ status: 200, description: 'KPIs do mês atual vs mês anterior' })
  @Get('kpis')
  getKpis(@TenantId() tenantId: string): Promise<object> {
    return this.dashboardService.getKpis(tenantId);
  }

  @ApiOperation({ summary: 'Gráfico de receita', description: 'Receita dos últimos 6 meses' })
  @ApiResponse({ status: 200, description: 'Array com receita por mês' })
  @Get('revenue-chart')
  getRevenueChart(@TenantId() tenantId: string): Promise<object> {
    return this.dashboardService.getRevenueChart(tenantId);
  }
}
