import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('units')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @ApiOperation({ summary: 'Criar unidade/filial', description: 'Disponível apenas no plano Pro' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'Plano não é Pro' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateUnitDto): Promise<object> {
    return this.unitsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar unidades' })
  @Get()
  findAll(@TenantId() tenantId: string): Promise<object> {
    return this.unitsService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Buscar unidade por ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.unitsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar unidade' })
  @ApiParam({ name: 'id' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateUnitDto): Promise<object> {
    return this.unitsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remover unidade (soft delete)' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.unitsService.remove(tenantId, id);
  }
}
