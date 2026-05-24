import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { StudentResponseDto, StudentListResponseDto } from './dto/student-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';
import { StudentStatus } from '../../common/enums';

@ApiTags('students')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: 'Cadastrar aluno', description: 'Cria novo aluno no tenant. CPF deve ser único.' })
  @ApiResponse({ status: 201, type: StudentResponseDto })
  @ApiResponse({ status: 409, description: 'CPF já cadastrado nesta academia' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateStudentDto): Promise<object> {
    return this.studentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar alunos', description: 'Lista paginada com busca por nome, CPF, e-mail ou telefone' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome, CPF, e-mail ou telefone' })
  @ApiQuery({ name: 'status', required: false, enum: StudentStatus, description: 'Filtrar por status' })
  @ApiResponse({ status: 200, type: StudentListResponseDto })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: StudentQueryDto): Promise<object> {
    return this.studentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar aluno por ID', description: 'Retorna dados do aluno com última matrícula' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.studentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar aluno', description: 'Atualiza parcialmente os dados do aluno' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateStudentDto): Promise<object> {
    return this.studentsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Inativar aluno', description: 'Soft delete: altera status para INACTIVE' })
  @ApiParam({ name: 'id', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Aluno inativado com sucesso' } } } } } })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.studentsService.remove(tenantId, id);
  }
}
