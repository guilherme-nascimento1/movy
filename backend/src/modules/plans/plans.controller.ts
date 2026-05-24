import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiOperation({ summary: 'Criar plano' })
  @ApiResponse({ status: 201, description: 'Plano criado' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePlanDto): Promise<object> {
    return this.plansService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar planos ativos' })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.plansService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.plansService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar plano' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<object> {
    return this.plansService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Desativar plano (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID do plano' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.plansService.remove(tenantId, id);
  }
}
