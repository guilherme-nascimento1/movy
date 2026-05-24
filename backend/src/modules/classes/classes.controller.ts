import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, CreateScheduleDto } from './dto/create-class.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('classes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @ApiOperation({ summary: 'Criar turma/aula' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateClassDto): Promise<object> {
    return this.classesService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar turmas ativas' })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.classesService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Listar agenda de aulas (schedules)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por data (YYYY-MM-DD)' })
  @ApiQuery({ name: 'classId', required: false })
  @Get('schedules')
  getSchedules(@TenantId() tenantId: string, @Query() query: PaginationDto & { date?: string; classId?: string }): Promise<object> {
    return this.classesService.getSchedules(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.classesService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar turma' })
  @ApiParam({ name: 'id' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateClassDto>): Promise<object> {
    return this.classesService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Desativar turma' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.classesService.remove(tenantId, id);
  }

  @ApiOperation({ summary: 'Programar aula para uma data específica' })
  @ApiParam({ name: 'id', description: 'UUID da turma' })
  @Post(':id/schedules')
  createSchedule(@TenantId() tenantId: string, @Param('id') classId: string, @Body() dto: CreateScheduleDto): Promise<object> {
    return this.classesService.createSchedule(tenantId, classId, dto);
  }
}
