import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { CheckinListResponseDto, CheckinResponseDto } from './dto/checkin-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

class CreateCheckinDto {
  @ApiProperty({ description: 'UUID do aluno' })
  @IsString() @IsNotEmpty()
  studentId!: string;
}

@ApiTags('checkins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @ApiOperation({ summary: 'Fazer check-in', description: 'Registra presença do aluno na aula. Valida capacidade e duplicata.' })
  @ApiParam({ name: 'scheduleId', description: 'UUID da aula programada (ClassSchedule)' })
  @ApiBody({ type: CreateCheckinDto })
  @ApiResponse({ status: 201, type: CheckinResponseDto })
  @ApiResponse({ status: 400, description: 'Capacidade máxima da aula atingida' })
  @ApiResponse({ status: 404, description: 'Aula ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno já fez check-in nesta aula' })
  @Post('schedule/:scheduleId')
  create(
    @TenantId() tenantId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: CreateCheckinDto,
  ): Promise<object> {
    return this.checkinsService.create(tenantId, scheduleId, dto.studentId);
  }

  @ApiOperation({ summary: 'Check-ins de uma aula', description: 'Lista todos os check-ins de um ClassSchedule específico' })
  @ApiParam({ name: 'scheduleId', description: 'UUID do ClassSchedule' })
  @ApiResponse({ status: 200, type: CheckinListResponseDto })
  @Get('schedule/:scheduleId')
  findBySchedule(@TenantId() tenantId: string, @Param('scheduleId') scheduleId: string): Promise<object> {
    return this.checkinsService.findBySchedule(tenantId, scheduleId);
  }

  @ApiOperation({ summary: 'Histórico de check-ins do aluno', description: 'Retorna todas as aulas que o aluno frequentou, paginado' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, type: CheckinListResponseDto })
  @Get('student/:studentId')
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.checkinsService.findByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Remover check-in', description: 'Remove presença do aluno na aula' })
  @ApiParam({ name: 'id', description: 'UUID do check-in' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Check-in removido com sucesso' } } } } } })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.checkinsService.remove(tenantId, id);
  }
}
