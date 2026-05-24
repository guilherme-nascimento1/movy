import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Dados da academia autenticada' })
  @ApiResponse({ status: 200, description: 'Dados do tenant' })
  @Get('me')
  findOne(@TenantId() tenantId: string): Promise<object> {
    return this.tenantsService.findOne(tenantId);
  }

  @ApiOperation({ summary: 'Atualizar configurações da academia' })
  @ApiResponse({ status: 200, description: 'Academia atualizada' })
  @Patch('me')
  update(@TenantId() tenantId: string, @Body() dto: UpdateTenantDto): Promise<object> {
    return this.tenantsService.update(tenantId, dto);
  }
}
