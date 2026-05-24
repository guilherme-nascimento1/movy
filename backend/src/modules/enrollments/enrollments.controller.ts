import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/create-enrollment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('enrollments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Criar matrícula', description: 'Vincula aluno a um plano e calcula data de vencimento' })
  @ApiResponse({ status: 201, description: 'Matrícula criada' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateEnrollmentDto): Promise<object> {
    return this.enrollmentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar matrículas' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto & { studentId?: string; status?: string }): Promise<object> {
    return this.enrollmentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar matrícula por ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.enrollmentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar status da matrícula' })
  @ApiParam({ name: 'id' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateEnrollmentDto): Promise<object> {
    return this.enrollmentsService.update(tenantId, id, dto);
  }
}
