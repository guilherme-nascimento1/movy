import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, CreateGoalDto, UpdateGoalProgressDto } from './dto/team.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('team')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @ApiOperation({ summary: 'Adicionar membro à equipe' })
  @ApiResponse({ status: 201 })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateTeamMemberDto): Promise<object> {
    return this.teamService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar equipe', description: 'Retorna membros ativos com metas pendentes' })
  @Get()
  findAll(@TenantId() tenantId: string): Promise<object> {
    return this.teamService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Perfil de um membro' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.teamService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar membro da equipe' })
  @ApiParam({ name: 'id' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTeamMemberDto): Promise<object> {
    return this.teamService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remover membro da equipe (soft delete)' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.teamService.remove(tenantId, id);
  }

  @ApiOperation({ summary: 'Criar meta para membro da equipe' })
  @ApiParam({ name: 'memberId' })
  @Post(':memberId/goals')
  createGoal(
    @TenantId() tenantId: string,
    @Param('memberId') memberId: string,
    @Body() dto: CreateGoalDto,
  ): Promise<object> {
    return this.teamService.createGoal(tenantId, memberId, dto);
  }

  @ApiOperation({ summary: 'Listar metas do membro' })
  @ApiParam({ name: 'memberId' })
  @Get(':memberId/goals')
  getMemberGoals(@TenantId() tenantId: string, @Param('memberId') memberId: string): Promise<object> {
    return this.teamService.getMemberGoals(tenantId, memberId);
  }

  @ApiOperation({ summary: 'Atualizar progresso de uma meta' })
  @ApiParam({ name: 'goalId' })
  @Patch('goals/:goalId/progress')
  updateGoalProgress(
    @TenantId() tenantId: string,
    @Param('goalId') goalId: string,
    @Body() dto: UpdateGoalProgressDto,
  ): Promise<object> {
    return this.teamService.updateGoalProgress(tenantId, goalId, dto);
  }
}
