import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { YogaService } from './yoga.service';
import { CreateAsanaDto } from './dto/yoga.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('yoga')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('yoga')
export class YogaController {
  constructor(private readonly yogaService: YogaService) {}

  @ApiOperation({ summary: 'Criar asana', description: 'Adiciona asana à biblioteca do tenant' })
  @ApiResponse({ status: 201, description: 'Asana criado' })
  @Post('asanas')
  createAsana(@TenantId() tenantId: string, @Body() dto: CreateAsanaDto): Promise<object> {
    return this.yogaService.createAsana(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar asanas', description: 'Biblioteca de asanas com filtro por categoria e nível' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'level', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  @ApiResponse({ status: 200, description: 'Lista paginada de asanas' })
  @Get('asanas')
  findAllAsanas(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { category?: string; level?: string },
  ): Promise<object> {
    return this.yogaService.findAllAsanas(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar asana por ID' })
  @ApiParam({ name: 'id', description: 'UUID do asana' })
  @ApiResponse({ status: 200, description: 'Asana encontrado' })
  @ApiResponse({ status: 404, description: 'Asana não encontrado' })
  @Get('asanas/:id')
  findOneAsana(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.yogaService.findOneAsana(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar asana' })
  @ApiParam({ name: 'id', description: 'UUID do asana' })
  @ApiResponse({ status: 200, description: 'Asana atualizado' })
  @Patch('asanas/:id')
  updateAsana(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAsanaDto>,
  ): Promise<object> {
    return this.yogaService.updateAsana(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remover asana' })
  @ApiParam({ name: 'id', description: 'UUID do asana' })
  @ApiResponse({ status: 200, description: 'Asana removido' })
  @Delete('asanas/:id')
  removeAsana(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.yogaService.removeAsana(tenantId, id);
  }
}
