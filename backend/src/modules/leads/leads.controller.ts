import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, AssignLeadDto, TrialLeadDto, LeadStage } from './dto/lead.dto';
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

  @ApiOperation({ summary: 'Criar lead', description: 'Registra novo visitante ou interessado no CRM. Aceita UTM params.' })
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

  @ApiOperation({ summary: 'Ranking de leads por score', description: 'Leads ativos ordenados por score descendente para priorizar atendimento' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: LeadListResponseDto })
  @Get('ranking')
  getRanking(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.leadsService.getRanking(tenantId, query);
  }

  @ApiOperation({ summary: 'Funil de leads', description: 'Contagem de leads por estágio: NEW, CONTACTED, DEMO, NEGOTIATION, WON, LOST' })
  @ApiResponse({ status: 200, type: LeadFunnelResponseDto })
  @Get('stats/funnel')
  getStageStats(@TenantId() tenantId: string): Promise<object> {
    return this.leadsService.getStageStats(tenantId);
  }

  @ApiOperation({ summary: 'Histórico de eventos do lead', description: 'Log imutável de todos os eventos: CREATED, STAGE_CHANGED, TRIAL_SCHEDULED, etc.' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, schema: { properties: { data: { type: 'array' } } } })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Get(':id/events')
  getEvents(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.getEvents(tenantId, id);
  }

  @ApiOperation({ summary: 'Buscar lead por ID' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.leadsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar lead', description: 'Atualiza dados ou avança estágio no funil. Troca de stage registra LeadEvent e recalcula score.' })
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

  @ApiOperation({ summary: 'Atribuir responsável ao lead', description: 'Define o userId do colaborador responsável. Registra evento ASSIGNED.' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Patch(':id/assign')
  assign(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
  ): Promise<object> {
    return this.leadsService.assign(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Registrar aula experimental', description: 'Define data/hora da aula experimental e enfileira 4 jobs automáticos (lembrete D-1, follow-up 2h, proposta D+1, segundo follow-up D+3)' })
  @ApiParam({ name: 'id', description: 'UUID do lead' })
  @ApiResponse({ status: 200, type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  @Patch(':id/trial')
  scheduleTrial(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: TrialLeadDto,
  ): Promise<object> {
    return this.leadsService.scheduleTrial(tenantId, id, dto);
  }

  @ApiOperation({
    summary: 'Converter lead em aluno',
    description: 'Cria registro de Student a partir dos dados do lead e marca o lead como WON.',
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
