import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SpinningService } from './spinning.service';
import { CreateEquipmentDto, UpdateEquipmentStatusDto } from './dto/spinning.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('spinning')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('spinning')
export class SpinningController {
  constructor(private readonly spinningService: SpinningService) {}

  @ApiOperation({ summary: 'Cadastrar equipamento', description: 'Cadastra bike, reformer ou outro equipamento' })
  @ApiResponse({ status: 201, description: 'Equipamento cadastrado' })
  @Post('equipment')
  createEquipment(@TenantId() tenantId: string, @Body() dto: CreateEquipmentDto): Promise<object> {
    return this.spinningService.createEquipment(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar equipamentos' })
  @ApiQuery({ name: 'type', required: false, enum: ['BIKE', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('equipment')
  findAllEquipment(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { type?: string; status?: string },
  ): Promise<object> {
    return this.spinningService.findAllEquipment(tenantId, query);
  }

  @ApiOperation({ summary: 'Atualizar status do equipamento' })
  @ApiParam({ name: 'id' })
  @Patch('equipment/:id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentStatusDto,
  ): Promise<object> {
    return this.spinningService.updateStatus(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Registrar manutenção', description: 'Marca o equipamento como mantido (lastMaintenanceAt = agora, status = ACTIVE)' })
  @ApiParam({ name: 'id' })
  @Patch('equipment/:id/maintenance')
  registerMaintenance(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ): Promise<object> {
    return this.spinningService.registerMaintenance(tenantId, id, body.notes);
  }
}
