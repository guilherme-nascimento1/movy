import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DanceService } from './dance.service';
import { CreateDanceEventDto } from './dto/dance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('dance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dance')
export class DanceController {
  constructor(private readonly danceService: DanceService) {}

  @ApiOperation({ summary: 'Criar evento de dança' })
  @ApiResponse({ status: 201, description: 'Evento criado' })
  @Post('events')
  createEvent(@TenantId() tenantId: string, @Body() dto: CreateDanceEventDto): Promise<object> {
    return this.danceService.createEvent(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar eventos de dança' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'danceStyle', required: false, type: String, description: 'Ex: Ballet, Jazz, Forró' })
  @ApiResponse({ status: 200, description: 'Lista paginada de eventos' })
  @Get('events')
  findAllEvents(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { danceStyle?: string },
  ): Promise<object> {
    return this.danceService.findAllEvents(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar evento por ID' })
  @ApiParam({ name: 'id' })
  @Get('events/:id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.danceService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar evento' })
  @ApiParam({ name: 'id' })
  @Patch('events/:id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateDanceEventDto>): Promise<object> {
    return this.danceService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remover evento (soft delete)' })
  @ApiParam({ name: 'id' })
  @Delete('events/:id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.danceService.remove(tenantId, id);
  }
}
