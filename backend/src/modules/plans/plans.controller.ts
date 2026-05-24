import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanResponseDto, PlanListResponseDto } from './dto/plan-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiOperation({ summary: 'Criar plano', description: 'Cria novo plano de academia. O preço é em reais.' })
  @ApiResponse({ status: 201, type: PlanResponseDto })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePlanDto): Promise<object> {
    return this.plansService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar planos', description: 'Retorna planos ativos do tenant com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PlanListResponseDto })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.plansService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.plansService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar plano', description: 'Atualiza dados ou ativa/desativa o plano' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<object> {
    return this.plansService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Desativar plano', description: 'Soft delete: seta active=false' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Plano desativado com sucesso' } } } } } })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.plansService.remove(tenantId, id);
  }
}
