import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto, CreateExerciseDto } from './dto/workout.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId, CurrentUser } from '../../common/decorators';

@ApiTags('workouts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @ApiOperation({ summary: 'Criar exercício na biblioteca', description: 'Adiciona exercício à biblioteca do tenant' })
  @ApiResponse({ status: 201, description: 'Exercício criado' })
  @Post('exercises')
  createExercise(@TenantId() tenantId: string, @Body() dto: CreateExerciseDto): Promise<object> {
    return this.workoutsService.createExercise(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar exercícios', description: 'Biblioteca de exercícios do tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrar por grupo muscular' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @Get('exercises')
  findAllExercises(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { category?: string },
  ): Promise<object> {
    return this.workoutsService.findAllExercises(tenantId, query);
  }

  @ApiOperation({ summary: 'Criar ficha de treino', description: 'Cria ficha de treino para um aluno' })
  @ApiResponse({ status: 201, description: 'Ficha criada' })
  @Post()
  createWorkout(
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateWorkoutDto,
  ): Promise<object> {
    return this.workoutsService.createWorkout(tenantId, user.sub, dto);
  }

  @ApiOperation({ summary: 'Fichas de treino de um aluno' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Fichas retornadas com sucesso' })
  @Get('student/:studentId')
  findByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.workoutsService.findByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Buscar ficha de treino por ID' })
  @ApiParam({ name: 'id', description: 'UUID da ficha' })
  @ApiResponse({ status: 200, description: 'Ficha retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Treino não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.workoutsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Remover ficha de treino' })
  @ApiParam({ name: 'id', description: 'UUID da ficha' })
  @ApiResponse({ status: 200, description: 'Ficha removida' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.workoutsService.remove(tenantId, id);
  }
}
