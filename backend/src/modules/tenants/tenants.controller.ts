import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Dados da academia', description: 'Retorna informações do tenant autenticado (nome, plano, configurações)' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @Get('me')
  findOne(@TenantId() tenantId: string): Promise<object> {
    return this.tenantsService.findOne(tenantId);
  }

  @ApiOperation({ summary: 'Atualizar academia', description: 'Atualiza nome, slug ou configurações da academia' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @Patch('me')
  update(@TenantId() tenantId: string, @Body() dto: UpdateTenantDto): Promise<object> {
    return this.tenantsService.update(tenantId, dto);
  }
}
