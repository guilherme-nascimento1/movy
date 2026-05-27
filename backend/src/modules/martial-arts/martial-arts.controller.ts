import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MartialArtsService } from './martial-arts.service';
import { GraduateStudentDto } from './dto/martial-arts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId, CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';

@ApiTags('martial-arts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('martial-arts')
export class MartialArtsController {
  constructor(private readonly martialArtsService: MartialArtsService) {}

  @ApiOperation({ summary: 'Graduar aluno', description: 'Registra graduação de faixa/belt para um aluno' })
  @ApiResponse({ status: 201 })
  @Post('graduate')
  graduate(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GraduateStudentDto,
  ): Promise<object> {
    return this.martialArtsService.graduate(tenantId, user.sub, dto);
  }

  @ApiOperation({ summary: 'Faixa atual do aluno' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @Get('students/:studentId/belt')
  getCurrentBelt(@TenantId() tenantId: string, @Param('studentId') studentId: string): Promise<object> {
    return this.martialArtsService.getCurrentBelt(tenantId, studentId);
  }

  @ApiOperation({ summary: 'Histórico de graduações do aluno' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @Get('students/:studentId/history')
  getHistory(@TenantId() tenantId: string, @Param('studentId') studentId: string): Promise<object> {
    return this.martialArtsService.getHistory(tenantId, studentId);
  }

  @ApiOperation({ summary: 'Listar alunos por modalidade e faixa', description: 'Retorna alunos ordenados por faixa mais alta' })
  @ApiQuery({ name: 'modality', required: true, type: String, description: 'Ex: Jiu-Jitsu, Judô, Karatê' })
  @Get('by-modality')
  listByModality(@TenantId() tenantId: string, @Query('modality') modality: string): Promise<object> {
    return this.martialArtsService.listByModality(tenantId, modality);
  }
}
