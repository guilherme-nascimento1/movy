import { Controller, Get, Patch, Post, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import {
  OnboardingDto,
  UpdateModalitiesDto,
  UpdateTenantSettingsDto,
  TenantWithSettingsResponseDto,
  OnboardingCompleteResponseDto,
} from './dto/tenant-v3.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantId, CurrentUser, Roles } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Dados da academia', description: 'Retorna informações do tenant autenticado' })
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

  // ─── ONBOARDING ──────────────────────────────────────────

  @ApiOperation({
    summary: 'Completar onboarding',
    description: 'Passo 2 pós-cadastro: define nome, modalidades e terminologia. Marca onboardingComplete = true.',
  })
  @ApiResponse({ status: 201, type: OnboardingCompleteResponseDto })
  @Post('onboarding')
  completeOnboarding(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: OnboardingDto,
  ): Promise<object> {
    return this.tenantsService.completeOnboarding(tenantId, user.sub, dto);
  }

  // ─── MODALIDADES ─────────────────────────────────────────

  @ApiOperation({
    summary: 'Atualizar modalidades',
    description: 'Altera as modalidades ativas do tenant. Apenas role OWNER. Auditado em TenantAuditLog.',
  })
  @ApiResponse({ status: 200, description: 'Modalidades atualizadas com modulesEnabled recalculado' })
  @ApiResponse({ status: 403, description: 'Apenas OWNER pode alterar modalidades' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Put('modalities')
  updateModalities(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateModalitiesDto,
  ): Promise<object> {
    return this.tenantsService.updateModalities(tenantId, user.sub, user.role as UserRole, dto);
  }

  // ─── SETTINGS ────────────────────────────────────────────

  @ApiOperation({
    summary: 'Configurações do tenant',
    description: 'Retorna settings (termos, cor, módulos do dashboard), modalidades e modulesEnabled.',
  })
  @ApiResponse({ status: 200, type: TenantWithSettingsResponseDto })
  @Get('settings')
  getSettings(@TenantId() tenantId: string): Promise<object> {
    return this.tenantsService.getSettings(tenantId);
  }

  @ApiOperation({
    summary: 'Atualizar configurações',
    description: 'Atualiza terminologia, cor primária e módulos do dashboard. Apenas role OWNER.',
  })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas' })
  @ApiResponse({ status: 403, description: 'Apenas OWNER pode alterar configurações' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Put('settings')
  updateSettings(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTenantSettingsDto,
  ): Promise<object> {
    return this.tenantsService.updateSettings(tenantId, user.role as UserRole, dto);
  }

  // ─── MODULES ─────────────────────────────────────────────

  @ApiOperation({
    summary: 'Módulos ativos',
    description: 'Lista de módulos habilitados com base nas modalidades do tenant.',
  })
  @ApiResponse({ status: 200, description: 'Lista de slugs dos módulos ativos' })
  @Get('modules')
  getModules(@TenantId() tenantId: string): Promise<object> {
    return this.tenantsService.getModules(tenantId);
  }
}
