import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BoxingService } from './boxing.service';
import { CreateCombatRecordDto } from './dto/boxing.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('boxing')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('boxing')
export class BoxingController {
  constructor(private readonly boxingService: BoxingService) {}

  @ApiOperation({ summary: 'Registrar combate', description: 'Registra resultado de combate do aluno' })
  @ApiResponse({ status: 201, description: 'Combate registrado' })
  @Post('combats')
  createCombat(@TenantId() tenantId: string, @Body() dto: CreateCombatRecordDto): Promise<object> {
    return this.boxingService.createCombatRecord(tenantId, dto);
  }

  @ApiOperation({ summary: 'Histórico de combates do aluno' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de combates' })
  @Get('combats/student/:studentId')
  findCombatsByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.boxingService.findCombatsByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Estatísticas de combate do aluno', description: 'Total de vitórias, derrotas e empates' })
  @ApiParam({ name: 'studentId' })
  @Get('combats/student/:studentId/stats')
  getCombatStats(@TenantId() tenantId: string, @Param('studentId') studentId: string): Promise<object> {
    return this.boxingService.getCombatStats(tenantId, studentId);
  }

  @ApiOperation({ summary: 'Atualizar vencimento do exame médico' })
  @ApiParam({ name: 'studentId' })
  @ApiResponse({ status: 200, description: 'Data de validade do exame atualizada' })
  @Patch('students/:studentId/medical-exam')
  updateMedicalExam(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Body() body: { expiryDate: string },
  ): Promise<object> {
    return this.boxingService.updateMedicalExam(tenantId, studentId, body.expiryDate);
  }
}
