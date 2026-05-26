import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PhysicalEvalsService } from './physical-evals.service';
import { CreatePhysicalEvalDto, UpdatePhysicalEvalDto } from './dto/physical-eval.dto';
import {
  PhysicalEvalResponseDto,
  PhysicalEvalListResponseDto,
  EvolutionResponseDto,
} from './dto/physical-eval-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId, CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';

@ApiTags('physical-evals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('physical-evals')
export class PhysicalEvalsController {
  constructor(private readonly physicalEvalsService: PhysicalEvalsService) {}

  @ApiOperation({
    summary: 'Registrar avaliação física',
    description: 'Cria nova avaliação física para um aluno. BMI e massa magra são calculados automaticamente se não informados.',
  })
  @ApiResponse({ status: 201, type: PhysicalEvalResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Post()
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePhysicalEvalDto,
  ): Promise<object> {
    return this.physicalEvalsService.create(tenantId, user.sub, dto);
  }

  @ApiOperation({
    summary: 'Avaliações físicas de um aluno',
    description: 'Lista todas as avaliações físicas do aluno, ordenadas da mais recente para a mais antiga',
  })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PhysicalEvalListResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Get('student/:studentId')
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.physicalEvalsService.findByStudent(tenantId, studentId, query);
  }

  @ApiOperation({
    summary: 'Evolução corporal do aluno',
    description: 'Retorna série temporal com peso, %gordura, massa magra e circunferências para gráficos de evolução (Recharts)',
  })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiResponse({ status: 200, type: EvolutionResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Get('student/:studentId/evolution')
  evolution(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
  ): Promise<object> {
    return this.physicalEvalsService.evolution(tenantId, studentId);
  }

  @ApiOperation({
    summary: 'Buscar avaliação física por ID',
    description: 'Retorna avaliação completa com dados do aluno',
  })
  @ApiParam({ name: 'id', description: 'UUID da avaliação' })
  @ApiResponse({ status: 200, type: PhysicalEvalResponseDto })
  @ApiResponse({ status: 404, description: 'Avaliação física não encontrada' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.physicalEvalsService.findOne(tenantId, id);
  }

  @ApiOperation({
    summary: 'Atualizar avaliação física',
    description: 'Atualiza campos parcialmente. BMI é recalculado se peso ou altura forem alterados.',
  })
  @ApiParam({ name: 'id', description: 'UUID da avaliação' })
  @ApiResponse({ status: 200, type: PhysicalEvalResponseDto })
  @ApiResponse({ status: 404, description: 'Avaliação física não encontrada' })
  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePhysicalEvalDto,
  ): Promise<object> {
    return this.physicalEvalsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remover avaliação física', description: 'Soft delete — a avaliação não é apagada do banco' })
  @ApiParam({ name: 'id', description: 'UUID da avaliação' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Avaliação removida com sucesso' } } } } } })
  @ApiResponse({ status: 404, description: 'Avaliação física não encontrada' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.physicalEvalsService.remove(tenantId, id);
  }
}
