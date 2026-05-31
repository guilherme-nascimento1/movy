import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StudioPersonalService } from './studio-personal.service';
import { CreateSessionPackageDto, ScheduleSessionDto, CompleteSessionDto } from './dto/studio-personal.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('studio-personal')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('studio-personal')
export class StudioPersonalController {
  constructor(private readonly studioPersonalService: StudioPersonalService) {}

  @ApiOperation({ summary: 'Criar pacote de sessões', description: 'Cria pacote de sessões com validade para um aluno/personal' })
  @ApiResponse({ status: 201, description: 'Pacote criado' })
  @Post('packages')
  createPackage(@TenantId() tenantId: string, @Body() dto: CreateSessionPackageDto): Promise<object> {
    return this.studioPersonalService.createPackage(tenantId, dto);
  }

  @ApiOperation({ summary: 'Pacotes de sessões do aluno' })
  @ApiParam({ name: 'studentId' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('packages/student/:studentId')
  findPackagesByStudent(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.studioPersonalService.findPackagesByStudent(tenantId, studentId, query);
  }

  @ApiOperation({ summary: 'Agendar sessão 1:1' })
  @ApiResponse({ status: 201, description: 'Sessão agendada' })
  @Post('sessions')
  scheduleSession(@TenantId() tenantId: string, @Body() dto: ScheduleSessionDto): Promise<object> {
    return this.studioPersonalService.scheduleSession(tenantId, dto);
  }

  @ApiOperation({ summary: 'Concluir sessão', description: 'Marca sessão como COMPLETED e incrementa usedSessions no pacote' })
  @ApiParam({ name: 'id', description: 'UUID da sessão' })
  @ApiResponse({ status: 200, description: 'Sessão concluída' })
  @Patch('sessions/:id/complete')
  completeSession(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ): Promise<object> {
    return this.studioPersonalService.completeSession(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Agenda do personal', description: 'Sessões do personal logado (passadas e futuras)' })
  @ApiParam({ name: 'personalId', description: 'userId do personal' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('sessions/personal/:personalId')
  findSessionsByPersonal(
    @TenantId() tenantId: string,
    @Param('personalId') personalId: string,
    @Query() query: PaginationDto,
  ): Promise<object> {
    return this.studioPersonalService.findSessionsByPersonal(tenantId, personalId, query);
  }
}
