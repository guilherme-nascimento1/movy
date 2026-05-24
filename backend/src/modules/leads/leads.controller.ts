import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadStage } from './dto/lead.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @ApiOperation({ summary: 'Criar lead', description: 'Registra novo lead no CRM' })
  @ApiResponse({ status: 201, description: 'Lead criado' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateLeadDto): Promise<object> {
    return this.leadsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar leads', description: 'Retorna lista paginada de leads com filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'stage', required: false, enum: LeadStage })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome, e-mail ou telefone' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { stage?: string; search?: string },
  ): Promise<object> {
    return this.leadsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Estatísticas por estágio', description: 'Contagem de leads por etapa do funil' })
  @ApiResponse({ status: 200, description: 'Funil retornado com sucesso' })
  @Get('stats/funnel')
  getStageStats(@TenantId() tenantId: string): Promise<object> {
    return this.leadsService.getStageStats(tenantId);
  }

  @ApiOperation({ summary: 'Buscar lead por ID' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, description: 'Lead retornado' })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar lead', description: 'Atualiza dados ou estágio do lead' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, description: 'Lead atualizado' })
  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ): Promise<object> {
    return this.leadsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Converter lead em aluno', description: 'Cria aluno a partir do lead e marca como WON' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 201, description: 'Aluno criado a partir do lead' })
  @Post(':id/convert')
  convertToStudent(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.convertToStudent(tenantId, id);
  }

  @ApiOperation({ summary: 'Remover lead' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, description: 'Lead removido' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.remove(tenantId, id);
  }
}
