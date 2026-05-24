import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadStage } from './dto/lead.dto';
import { LeadResponseDto, LeadListResponseDto, LeadFunnelResponseDto } from './dto/lead-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @ApiOperation({ summary: 'Criar lead', description: 'Registra novo visitante ou interessado no CRM' })
  @ApiResponse({ status: 201, type: LeadResponseDto })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateLeadDto): Promise<object> {
    return this.leadsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar leads', description: 'Lista paginada com filtros por estágio do funil e busca textual' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'stage', required: false, enum: LeadStage, description: 'Filtrar por estágio do funil' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome, e-mail ou telefone' })
  @ApiResponse({ status: 200, type: LeadListResponseDto })
  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { stage?: string; search?: string },
  ): Promise<object> {
    return this.leadsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Funil de leads', description: 'Contagem de leads por estágio: NEW, CONTACTED, DEMO, NEGOTIATION, WON, LOST' })
  @ApiResponse({ status: 200, type: LeadFunnelResponseDto })
  @Get('stats/funnel')
  getStageStats(@TenantId() tenantId: string): Promise<object> {
    return this.leadsService.getStageStats(tenantId);
  }

  @ApiOperation({ summary: 'Buscar lead por ID' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar lead', description: 'Atualiza dados ou avança estágio no funil' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ): Promise<object> {
    return this.leadsService.update(tenantId, id, dto);
  }

  @ApiOperation({
    summary: 'Converter lead em aluno',
    description: 'Cria registro de Student a partir dos dados do lead e marca o lead como WON. Retorna o aluno criado.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { student: { description: 'Aluno criado' }, message: { type: 'string' } } } } } })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Post(':id/convert')
  convertToStudent(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.convertToStudent(tenantId, id);
  }

  @ApiOperation({ summary: 'Remover lead' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Lead removido com sucesso' } } } } } })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.remove(tenantId, id);
  }
}
