import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, CreateScheduleDto } from './dto/create-class.dto';
import { ClassResponseDto, ClassListResponseDto, ScheduleListResponseDto } from './dto/class-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('classes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @ApiOperation({ summary: 'Criar turma', description: 'Cria uma turma recorrente com grade horária semanal' })
  @ApiResponse({ status: 201, type: ClassResponseDto })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateClassDto): Promise<object> {
    return this.classesService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar turmas ativas', description: 'Retorna turmas ativas do tenant com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ClassListResponseDto })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.classesService.findAll(tenantId, query);
  }

  @ApiOperation({
    summary: 'Agenda de aulas (schedules)',
    description: 'Lista aulas programadas para datas específicas. Filtre por data (YYYY-MM-DD) ou turma.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filtrar por data (YYYY-MM-DD)' })
  @ApiQuery({ name: 'classId', required: false, type: String, description: 'Filtrar por UUID da turma' })
  @ApiResponse({ status: 200, type: ScheduleListResponseDto })
  @Get('schedules')
  getSchedules(@TenantId() tenantId: string, @Query() query: PaginationDto & { date?: string; classId?: string }): Promise<object> {
    return this.classesService.getSchedules(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiParam({ name: 'id', description: 'UUID da turma' })
  @ApiResponse({ status: 200, type: ClassResponseDto })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.classesService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar turma', description: 'Atualiza dados da turma (nome, horário, capacidade, etc.)' })
  @ApiParam({ name: 'id', description: 'UUID da turma' })
  @ApiResponse({ status: 200, type: ClassResponseDto })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateClassDto>): Promise<object> {
    return this.classesService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Desativar turma', description: 'Soft delete: seta active=false' })
  @ApiParam({ name: 'id', description: 'UUID da turma' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Turma desativada com sucesso' } } } } } })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.classesService.remove(tenantId, id);
  }

  @ApiOperation({ summary: 'Programar aula', description: 'Cria um ClassSchedule para uma data específica. Impede duplicata.' })
  @ApiParam({ name: 'id', description: 'UUID da turma' })
  @ApiResponse({ status: 201, schema: { properties: { data: { description: 'ClassSchedule criado' } } } })
  @ApiResponse({ status: 409, description: 'Aula já programada para essa data' })
  @Post(':id/schedules')
  createSchedule(@TenantId() tenantId: string, @Param('id') classId: string, @Body() dto: CreateScheduleDto): Promise<object> {
    return this.classesService.createSchedule(tenantId, classId, dto);
  }
}
