import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto, CreateExerciseDto } from './dto/workout.dto';
import { WorkoutResponseDto, WorkoutListResponseDto, ExerciseListResponseDto } from './dto/workout-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId, CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';

@ApiTags('workouts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @ApiOperation({ summary: 'Mídia do exercício', description: 'Retorna gifUrl, videoUrl e thumbnailUrl do exercício (hospedados no Cloudflare R2)' })
  @ApiParam({ name: 'id', description: 'UUID do exercício' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { gifUrl: { type: 'string', nullable: true }, videoUrl: { type: 'string', nullable: true }, thumbnailUrl: { type: 'string', nullable: true } } } } } })
  @ApiResponse({ status: 404, description: 'Exercício não encontrado' })
  @Get('exercises/:id/media')
  getExerciseMedia(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.workoutsService.getExerciseMedia(tenantId, id);
  }

  @ApiOperation({ summary: 'Criar exercício', description: 'Adiciona exercício à biblioteca do tenant' })
  @ApiResponse({ status: 201, schema: { properties: { data: { description: 'Exercício criado' } } } })
  @Post('exercises')
  createExercise(@TenantId() tenantId: string, @Body() dto: CreateExerciseDto): Promise<object> {
    return this.workoutsService.createExercise(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar exercícios', description: 'Biblioteca de exercícios do tenant com filtro por grupo muscular' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 50 para facilitar seleção' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Ex: Peito, Costas, Pernas, Core' })
  @ApiResponse({ status: 200, type: ExerciseListResponseDto })
  @Get('exercises')
  findAllExercises(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { category?: string },
  ): Promise<object> {
    return this.workoutsService.findAllExercises(tenantId, query);
  }

  @ApiOperation({ summary: 'Criar ficha de treino', description: 'Cria ficha de treino para um aluno com lista de exercícios' })
  @ApiResponse({ status: 201, type: WorkoutResponseDto })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @Post()
  createWorkout(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWorkoutDto,
  ): Promise<object> {
    return this.workoutsService.createWorkout(tenantId, user.sub, dto);
  }

  @ApiOperation({ summary: 'Fichas de treino de um aluno', description: 'Lista todas as fichas do aluno, paginadas e ordenadas por mais recente' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: WorkoutListResponseDto })
  @Get('student/:studentId')
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.workoutsService.findByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Buscar ficha de treino por ID', description: 'Retorna ficha completa com todos os exercícios e dados do aluno' })
  @ApiParam({ name: 'id', description: 'UUID da ficha' })
  @ApiResponse({ status: 200, type: WorkoutResponseDto })
  @ApiResponse({ status: 404, description: 'Treino não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.workoutsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Remover ficha de treino' })
  @ApiParam({ name: 'id', description: 'UUID da ficha' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { message: { type: 'string', example: 'Treino removido com sucesso' } } } } } })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.workoutsService.remove(tenantId, id);
  }
}
