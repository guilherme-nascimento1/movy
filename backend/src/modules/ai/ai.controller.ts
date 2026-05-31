import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantId, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { AiService } from './ai.service';
import { AiChatDto, GenerateMessageDto, WorkoutSuggestDto } from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({
    summary: 'Top 10 alunos em risco de churn',
    description:
      'Retorna os 10 alunos com maior churnRiskScore (0–100). Score < 40 = baixo, 40–70 = médio, > 70 = alto.',
  })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 403, description: 'Disponível apenas nos planos Business e Pro' })
  @Get('churn-risk')
  getChurnRisk(@TenantId() tenantId: string) {
    return this.aiService.getChurnRisk(tenantId);
  }

  @ApiOperation({
    summary: 'Movy AI Chat — assistente contextualizado',
    description:
      'Chat com IA usando dados reais da academia (KPIs, inadimplentes, alunos em risco). ' +
      'Rate limit: 50 req/dia (Business), 200 req/dia (Pro).',
  })
  @ApiResponse({ status: 200, description: 'Resposta gerada com sucesso' })
  @ApiResponse({ status: 403, description: 'Plano não suportado ou limite diário atingido' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível' })
  @Post('chat')
  chat(@TenantId() tenantId: string, @Body() dto: AiChatDto) {
    return this.aiService.chat(tenantId, dto);
  }

  @ApiOperation({
    summary: 'Insights mensais gerados por IA',
    description:
      'Análise textual do mês com 3–5 insights sobre MRR, churn e operação. Cache Redis de 6h.',
  })
  @ApiResponse({ status: 200, description: 'Insights gerados com sucesso' })
  @ApiResponse({ status: 403, description: 'Plano não suportado ou limite diário atingido' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível' })
  @Post('insights/monthly')
  getMonthlyInsights(@TenantId() tenantId: string) {
    return this.aiService.getMonthlyInsights(tenantId);
  }

  @ApiOperation({
    summary: 'Sugestão de treino por IA',
    description: 'Sugere ficha de treino personalizada para o aluno com base no objetivo, modalidade e histórico. Usado pelo movy-personal.',
  })
  @ApiResponse({ status: 200, description: 'Sugestão gerada com sucesso' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível' })
  @Post('workout/suggest')
  suggestWorkout(@TenantId() tenantId: string, @Body() dto: WorkoutSuggestDto) {
    return this.aiService.suggestWorkout(tenantId, dto);
  }

  @ApiOperation({
    summary: 'Gerador de mensagens WhatsApp com IA',
    description:
      'Cria ou melhora templates de WhatsApp para cobrança, ausência, aniversário e reativação.',
  })
  @ApiResponse({ status: 200, description: 'Mensagem gerada com sucesso' })
  @ApiResponse({ status: 403, description: 'Plano não suportado ou limite diário atingido' })
  @ApiResponse({ status: 503, description: 'Serviço de IA temporariamente indisponível' })
  @Post('messages/generate')
  generateMessage(@TenantId() tenantId: string, @Body() dto: GenerateMessageDto) {
    return this.aiService.generateMessage(tenantId, dto);
  }
}
