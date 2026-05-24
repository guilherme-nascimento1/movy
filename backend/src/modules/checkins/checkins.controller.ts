import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
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

  @ApiOperation({ summary: 'Fazer check-in em uma aula', description: 'Registra presença do aluno na aula programada' })
  @ApiParam({ name: 'scheduleId', description: 'UUID da aula programada (ClassSchedule)' })
  @ApiBody({ type: CreateCheckinDto })
  @ApiResponse({ status: 201, description: 'Check-in realizado' })
  @ApiResponse({ status: 409, description: 'Aluno já fez check-in' })
  @Post('schedule/:scheduleId')
  create(
    @TenantId() tenantId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: CreateCheckinDto,
  ): Promise<object> {
    return this.checkinsService.create(tenantId, scheduleId, dto.studentId);
  }

  @ApiOperation({ summary: 'Listar check-ins de uma aula programada' })
  @ApiParam({ name: 'scheduleId' })
  @Get('schedule/:scheduleId')
  findBySchedule(@TenantId() tenantId: string, @Param('scheduleId') scheduleId: string): Promise<object> {
    return this.checkinsService.findBySchedule(tenantId, scheduleId);
  }

  @ApiOperation({ summary: 'Histórico de check-ins de um aluno' })
  @ApiParam({ name: 'studentId' })
  @Get('student/:studentId')
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.checkinsService.findByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Remover check-in' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.checkinsService.remove(tenantId, id);
  }
}
