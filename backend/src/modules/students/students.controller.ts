import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('students')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: 'Cadastrar aluno' })
  @ApiResponse({ status: 201, description: 'Aluno cadastrado' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateStudentDto): Promise<object> {
    return this.studentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar alunos', description: 'Lista paginada com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de alunos' })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: StudentQueryDto): Promise<object> {
    return this.studentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar aluno por ID' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, description: 'Dados do aluno' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.studentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar aluno' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, description: 'Aluno atualizado' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateStudentDto): Promise<object> {
    return this.studentsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Inativar aluno (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, description: 'Aluno inativado' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.studentsService.remove(tenantId, id);
  }
}
