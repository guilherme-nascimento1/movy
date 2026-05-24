import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto, EnrollmentListResponseDto } from './dto/enrollment-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';
import { EnrollmentStatus } from '../../common/enums';

@ApiTags('enrollments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Criar matrícula', description: 'Vincula aluno a um plano. endDate é calculado automaticamente pelo durationDays do plano se não informado.' })
  @ApiResponse({ status: 201, type: EnrollmentResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno ou plano não encontrado' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateEnrollmentDto): Promise<object> {
    return this.enrollmentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar matrículas', description: 'Lista paginada com filtros por aluno e status' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: String, description: 'Filtrar matrículas de um aluno específico' })
  @ApiQuery({ name: 'status', required: false, enum: EnrollmentStatus, description: 'Filtrar por status da matrícula' })
  @ApiResponse({ status: 200, type: EnrollmentListResponseDto })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto & { studentId?: string; status?: string }): Promise<object> {
    return this.enrollmentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar matrícula por ID', description: 'Retorna matrícula com aluno, plano e pagamentos' })
  @ApiParam({ name: 'id', description: 'UUID da matrícula' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.enrollmentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar matrícula', description: 'Atualiza status ou data de vencimento' })
  @ApiParam({ name: 'id', description: 'UUID da matrícula' })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateEnrollmentDto): Promise<object> {
    return this.enrollmentsService.update(tenantId, id, dto);
  }
}
