import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CrossfitService } from './crossfit.service';
import { CreateWodDto, CreateWodResultDto, CreatePersonalRecordDto } from './dto/crossfit.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('crossfit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('crossfit')
export class CrossfitController {
  constructor(private readonly crossfitService: CrossfitService) {}

  @ApiOperation({ summary: 'Criar WOD', description: 'Um WOD por dia por tenant' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Já existe WOD para esta data' })
  @Post('wods')
  createWod(@TenantId() tenantId: string, @Body() dto: CreateWodDto): Promise<object> {
    return this.crossfitService.createWod(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar WODs', description: 'Lista WODs ordenados por data' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('wods')
  listWods(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.crossfitService.listWods(tenantId, query);
  }

  @ApiOperation({ summary: 'WOD por data', description: 'Retorna o WOD de uma data específica com ranking' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Data no formato YYYY-MM-DD' })
  @Get('wods/by-date')
  findWodByDate(@TenantId() tenantId: string, @Query('date') date: string): Promise<object> {
    return this.crossfitService.findWodByDate(tenantId, date);
  }

  @ApiOperation({ summary: 'Remover WOD' })
  @ApiParam({ name: 'id', description: 'UUID do WOD' })
  @Delete('wods/:id')
  deleteWod(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.crossfitService.deleteWod(tenantId, id);
  }

  @ApiOperation({ summary: 'Registrar resultado no WOD', description: 'Adiciona ou atualiza o resultado de um aluno no WOD' })
  @ApiParam({ name: 'wodId', description: 'UUID do WOD' })
  @Post('wods/:wodId/results')
  addResult(
    @TenantId() tenantId: string,
    @Param('wodId') wodId: string,
    @Body() dto: CreateWodResultDto,
  ): Promise<object> {
    return this.crossfitService.addResult(tenantId, wodId, dto);
  }

  @ApiOperation({ summary: 'Ranking do WOD', description: 'Ranking ordenado por performance (Rx antes de Scaled, depois por score)' })
  @ApiParam({ name: 'wodId', description: 'UUID do WOD' })
  @Get('wods/:wodId/ranking')
  getRanking(@TenantId() tenantId: string, @Param('wodId') wodId: string): Promise<object> {
    return this.crossfitService.getRanking(tenantId, wodId);
  }

  @ApiOperation({ summary: 'Registrar PR', description: 'Registra novo recorde pessoal de um aluno em um exercício' })
  @Post('prs')
  addPr(@TenantId() tenantId: string, @Body() dto: CreatePersonalRecordDto): Promise<object> {
    return this.crossfitService.addPr(tenantId, dto);
  }

  @ApiOperation({ summary: 'PRs de um aluno', description: 'Lista todos os recordes pessoais de um aluno' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @Get('prs/:studentId')
  getStudentPrs(@TenantId() tenantId: string, @Param('studentId') studentId: string): Promise<object> {
    return this.crossfitService.getStudentPrs(tenantId, studentId);
  }
}
