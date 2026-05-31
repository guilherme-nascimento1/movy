import {
  Injectable,
  Logger,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TenantPlan,
  StudentStatus,
  EnrollmentStatus,
  PaymentStatus,
} from '../../common/enums';
import { AiChatDto, GenerateMessageDto, WorkoutSuggestDto } from './dto/ai.dto';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const RATE_LIMITS: Record<TenantPlan, number> = {
  [TenantPlan.STARTER]: 0,
  [TenantPlan.BUSINESS]: 50,
  [TenantPlan.PRO]: 200,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly redis: Redis;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
      timeout: 30_000,
    });
    this.redis = new Redis(
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      { lazyConnect: true },
    );
  }

  // ─── CHURN RISK ────────────────────────────────────────────

  async getChurnRisk(tenantId: string): Promise<object> {
    const now = new Date();

    const students = await this.prisma.student.findMany({
      where: { tenantId, status: StudentStatus.ACTIVE },
      orderBy: { churnRiskScore: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        photoUrl: true,
        churnRiskScore: true,
        checkins: { orderBy: { checkedAt: 'desc' }, take: 1, select: { checkedAt: true } },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          orderBy: { endDate: 'asc' },
          take: 1,
          select: {
            endDate: true,
            payments: {
              where: { status: PaymentStatus.PENDING, dueDate: { lt: now } },
              orderBy: { dueDate: 'asc' },
              take: 1,
              select: { dueDate: true },
            },
          },
        },
      },
    });

    return {
      data: students.map((s) => {
        const lastCheckin = s.checkins[0]?.checkedAt ?? null;
        const overduePayment = s.enrollments[0]?.payments[0];
        const daysOverdue = overduePayment
          ? Math.floor((now.getTime() - overduePayment.dueDate.getTime()) / MS_PER_DAY)
          : 0;

        return {
          id: s.id,
          name: s.name,
          avatarUrl: s.photoUrl,
          lastCheckin,
          daysOverdue,
          planExpiresAt: s.enrollments[0]?.endDate ?? null,
          churnRiskScore: s.churnRiskScore,
        };
      }),
    };
  }

  // Chamado pelo cron diário em AutomationsScheduler
  async calculateAllChurnRisks(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { active: true },
      select: { id: true },
    });

    for (const { id } of tenants) {
      try {
        await this.calculateChurnRisksForTenant(id);
      } catch (err: unknown) {
        this.logger.error(`Erro ao calcular churn para tenant ${id}: ${(err as Error).message}`);
      }
    }
  }

  private async calculateChurnRisksForTenant(tenantId: string): Promise<void> {
    const now = new Date();

    const students = await this.prisma.student.findMany({
      where: { tenantId, status: StudentStatus.ACTIVE },
      select: {
        id: true,
        checkins: { orderBy: { checkedAt: 'desc' }, take: 1, select: { checkedAt: true } },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          orderBy: { endDate: 'asc' },
          take: 1,
          select: {
            endDate: true,
            payments: {
              where: { status: PaymentStatus.PENDING, dueDate: { lt: now } },
              orderBy: { dueDate: 'asc' },
              take: 1,
              select: { dueDate: true },
            },
          },
        },
      },
    });

    const updates: Promise<unknown>[] = [];
    const alertCreates: Promise<unknown>[] = [];

    for (const student of students) {
      const lastCheckin = student.checkins[0]?.checkedAt;
      const daysWithoutCheckin = lastCheckin
        ? Math.floor((now.getTime() - lastCheckin.getTime()) / MS_PER_DAY)
        : 30;

      const overduePayment = student.enrollments[0]?.payments[0];
      const daysOverdue = overduePayment
        ? Math.floor((now.getTime() - overduePayment.dueDate.getTime()) / MS_PER_DAY)
        : 0;

      const activeEnrollment = student.enrollments[0];
      const daysUntilExpiry = activeEnrollment
        ? Math.max(0, Math.floor((activeEnrollment.endDate.getTime() - now.getTime()) / MS_PER_DAY))
        : 0;

      // Peso: 40% check-in, 35% inadimplência, 25% vencimento
      const checkinScore = (Math.min(daysWithoutCheckin, 30) / 30) * 40;
      const overdueScore = (Math.min(daysOverdue, 30) / 30) * 35;
      const expiryScore = (Math.max(0, 30 - Math.min(daysUntilExpiry, 30)) / 30) * 25;
      const churnRiskScore = Math.round(checkinScore + overdueScore + expiryScore);

      updates.push(
        this.prisma.student.update({
          where: { id: student.id },
          data: { churnRiskScore, churnRiskUpdatedAt: now },
        }),
      );

      if (churnRiskScore > 80) {
        alertCreates.push(
          this.prisma.churnAlert.create({
            data: { tenantId, studentId: student.id, score: churnRiskScore },
          }),
        );
      }
    }

    await Promise.all([...updates, ...alertCreates]);
    this.logger.log(`[Churn] tenant ${tenantId}: ${students.length} alunos atualizados`);
  }

  // ─── CHAT ──────────────────────────────────────────────────

  async chat(tenantId: string, dto: AiChatDto): Promise<object> {
    await this.enforceRateLimit(tenantId);

    const [kpis, atRisk, overdueList] = await Promise.all([
      this.buildKpiContext(tenantId),
      this.buildAtRiskContext(tenantId),
      this.buildOverdueContext(tenantId),
    ]);

    const systemPrompt = `Você é o assistente de IA do Movy, um SaaS de gestão de academias.
Responda sempre em português brasileiro. Use apenas os dados do contexto abaixo, nunca invente números.

DADOS DA ACADEMIA (${new Date().toLocaleDateString('pt-BR')}):
${JSON.stringify(kpis, null, 2)}

TOP ALUNOS EM RISCO DE CHURN:
${JSON.stringify(atRisk, null, 2)}

INADIMPLENTES:
${JSON.stringify(overdueList, null, 2)}

Seja conciso, direto e foque em ações práticas para o gestor.`;

    const messages: Anthropic.MessageParam[] = [
      ...(dto.history?.map((h) => ({ role: h.role, content: h.content })) ?? []),
      { role: 'user', content: dto.message },
    ];

    try {
      const response = await this.anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      await this.logUsage(tenantId, 'chat', tokensUsed);

      return { data: { reply, contextUsed: ['kpis', 'churn_risk', 'inadimplentes'] } };
    } catch (err: unknown) {
      this.logger.error(`Erro na Claude API (chat): ${(err as Error).message}`);
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }
  }

  // ─── INSIGHTS MENSAIS ──────────────────────────────────────

  async getMonthlyInsights(tenantId: string): Promise<object> {
    await this.enforceRateLimit(tenantId);

    const now = new Date();
    const cacheKey = `ai:insights:${tenantId}:${now.getFullYear()}-${now.getMonth() + 1}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return { data: { insights: JSON.parse(cached) as string[], generatedAt: null } };
      }
    } catch {
      // Redis indisponível — prossegue sem cache
    }

    const kpis = await this.buildKpiContext(tenantId);

    const prompt = `Analise os dados abaixo de uma academia brasileira e retorne exatamente 3 a 5 insights em português.
Cada insight deve ser uma frase curta com métrica específica quando disponível. Retorne apenas os insights, um por linha, sem numeração.

DADOS DO MÊS:
${JSON.stringify(kpis, null, 2)}`;

    try {
      const response = await this.anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const insights = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 5);
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      try {
        await this.redis.setex(cacheKey, 21_600, JSON.stringify(insights));
      } catch {
        // Redis indisponível — continua sem cache
      }

      await this.logUsage(tenantId, 'insights', tokensUsed);

      return { data: { insights, generatedAt: now } };
    } catch (err: unknown) {
      this.logger.error(`Erro na Claude API (insights): ${(err as Error).message}`);
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }
  }

  // ─── GERADOR DE MENSAGENS ──────────────────────────────────

  async generateMessage(tenantId: string, dto: GenerateMessageDto): Promise<object> {
    await this.enforceRateLimit(tenantId);

    let studentContext = '';

    if (dto.studentId) {
      const now = new Date();
      const student = await this.prisma.student.findFirst({
        where: { id: dto.studentId, tenantId },
        select: {
          name: true,
          enrollments: {
            where: { status: EnrollmentStatus.ACTIVE },
            take: 1,
            select: {
              endDate: true,
              plan: { select: { name: true, price: true } },
              payments: {
                where: { status: PaymentStatus.PENDING, dueDate: { lt: now } },
                orderBy: { dueDate: 'asc' },
                take: 1,
                select: { dueDate: true, amount: true },
              },
            },
          },
        },
      });

      if (student) {
        const enrollment = student.enrollments[0];
        const overduePayment = enrollment?.payments[0];
        const daysOverdue = overduePayment
          ? Math.floor((now.getTime() - overduePayment.dueDate.getTime()) / MS_PER_DAY)
          : 0;

        studentContext = `\n\nDados do aluno:
Nome: ${student.name}
Plano: ${enrollment?.plan.name ?? 'não informado'} — R$ ${enrollment?.plan.price ?? '0'}
Dias em atraso: ${daysOverdue}
Valor em atraso: R$ ${overduePayment?.amount ?? '0'}`;
      }
    }

    const contextLabels: Record<string, string> = {
      cobranca: 'cobrança de mensalidade em atraso',
      ausencia: 'ausência prolongada do aluno',
      aniversario: 'parabéns de aniversário',
      reativacao: 'reativação de aluno inativo',
    };

    const prompt = dto.improve
      ? `Melhore esta mensagem de WhatsApp para academia:\n"${dto.improve}"\n\nContexto: ${contextLabels[dto.context]}${studentContext}`
      : `Crie uma mensagem de WhatsApp para academia.\nContexto: ${contextLabels[dto.context]}${studentContext}

Regras:
- Tom amigável e profissional
- Máximo 3 parágrafos curtos
- Use emojis moderadamente
- Use {nome} onde o nome do aluno deve aparecer
- Para cobrança, use {valor} e {dias_atraso} como variáveis`;

    try {
      const response = await this.anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const message = response.content[0].type === 'text' ? response.content[0].text : '';
      const variables = [...new Set(message.match(/\{[a-z_]+\}/g) ?? [])];
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      await this.logUsage(tenantId, 'messages', tokensUsed);

      return { data: { message, variables } };
    } catch (err: unknown) {
      this.logger.error(`Erro na Claude API (messages): ${(err as Error).message}`);
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }
  }

  // ─── SUGESTÃO DE TREINO ────────────────────────────────────

  async suggestWorkout(tenantId: string, dto: WorkoutSuggestDto): Promise<object> {
    await this.enforceRateLimit(tenantId);

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
      select: {
        name: true,
        physicalEvals: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
          select: { weight: true, height: true, bodyFat: true, objectives: true },
        },
        workouts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { name: true, items: { include: { exercise: { select: { name: true, category: true } } } } },
        },
      },
    });

    if (!student) {
      return { data: null, error: { code: 'STUDENT_NOT_FOUND', message: 'Aluno não encontrado' } };
    }

    const eval_ = student.physicalEvals[0];
    const lastWorkout = student.workouts[0];

    const prompt = `Você é um personal trainer especialista. Crie uma ficha de treino personalizada em português.

DADOS DO ALUNO:
Nome: ${student.name}
Objetivo: ${dto.goal}
Modalidade: ${dto.modality}
Dias disponíveis por semana: ${dto.availableDays}
${dto.restrictions ? `Restrições: ${dto.restrictions}` : ''}
${eval_ ? `Peso: ${eval_.weight}kg | Gordura corporal: ${eval_.bodyFat}%` : ''}
${lastWorkout ? `Último treino: ${lastWorkout.name} com ${lastWorkout.items.length} exercícios` : 'Nenhum treino anterior'}

Responda APENAS com JSON válido neste formato:
{
  "workout": {
    "name": "Nome da ficha",
    "notes": "Observações gerais",
    "exercises": [
      { "name": "Nome do exercício", "sets": 3, "reps": "12", "restSecs": 60, "notes": "Dica técnica" }
    ]
  },
  "rationale": "Explicação breve de por que este treino foi escolhido"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as { workout: unknown; rationale: string }) : { workout: null, rationale: '' };
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      await this.logUsage(tenantId, 'workout_suggest', tokensUsed);

      return { data: parsed };
    } catch (err: unknown) {
      this.logger.error(`Erro na Claude API (workout suggest): ${(err as Error).message}`);
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }
  }

  // ─── HELPERS PRIVADOS ──────────────────────────────────────

  private async enforceRateLimit(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    const plan = (tenant?.plan as TenantPlan) ?? TenantPlan.STARTER;

    if (plan === TenantPlan.STARTER) {
      throw new ForbiddenException(
        'Funcionalidade de IA disponível apenas nos planos Business e Pro',
      );
    }

    const limit = RATE_LIMITS[plan];
    const date = new Date().toISOString().split('T')[0];
    const key = `ai:ratelimit:${tenantId}:${date}`;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, 86_400);
      if (count > limit) {
        throw new ForbiddenException(
          `Limite diário de ${limit} requisições de IA atingido. Tente novamente amanhã.`,
        );
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      // Redis indisponível — permite a requisição mas loga
      this.logger.warn(`Redis indisponível para rate limit: ${(err as Error).message}`);
    }
  }

  private async buildKpiContext(tenantId: string): Promise<object> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [activeStudents, newStudents, revenueNow, revenuePrev, overdueCount, overdueAmount] =
      await this.prisma.$transaction([
        this.prisma.student.count({ where: { tenantId, status: StudentStatus.ACTIVE } }),
        this.prisma.student.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
        this.prisma.payment.aggregate({
          where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            tenantId,
            status: PaymentStatus.PAID,
            paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.count({
          where: { tenantId, status: PaymentStatus.PENDING, dueDate: { lt: now } },
        }),
        this.prisma.payment.aggregate({
          where: { tenantId, status: PaymentStatus.PENDING, dueDate: { lt: now } },
          _sum: { amount: true },
        }),
      ]);

    const revNow = Number(revenueNow._sum.amount ?? 0);
    const revPrev = Number(revenuePrev._sum.amount ?? 0);
    const revenueGrowth = revPrev > 0 ? Math.round(((revNow - revPrev) / revPrev) * 1000) / 10 : 0;

    return {
      activeStudents,
      newStudentsThisMonth: newStudents,
      revenueThisMonth: revNow,
      revenueLastMonth: revPrev,
      revenueGrowthPercent: revenueGrowth,
      overdueCount,
      overdueAmount: Number(overdueAmount._sum.amount ?? 0),
    };
  }

  private async buildAtRiskContext(tenantId: string): Promise<object[]> {
    const students = await this.prisma.student.findMany({
      where: { tenantId, status: StudentStatus.ACTIVE, churnRiskScore: { gt: 40 } },
      orderBy: { churnRiskScore: 'desc' },
      take: 5,
      select: { name: true, churnRiskScore: true },
    });
    return students;
  }

  private async buildOverdueContext(tenantId: string): Promise<object[]> {
    const now = new Date();
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, status: PaymentStatus.PENDING, dueDate: { lt: now } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      select: {
        dueDate: true,
        amount: true,
        enrollment: { select: { student: { select: { name: true } } } },
      },
    });

    return payments.map((p) => ({
      student: p.enrollment.student.name,
      dueDate: p.dueDate,
      amount: Number(p.amount),
      daysOverdue: Math.floor((now.getTime() - p.dueDate.getTime()) / MS_PER_DAY),
    }));
  }

  private async logUsage(tenantId: string, endpoint: string, tokensUsed: number): Promise<void> {
    try {
      await this.prisma.aiUsageLog.create({ data: { tenantId, endpoint, tokensUsed } });
    } catch (err: unknown) {
      this.logger.error(`Erro ao salvar ai_usage_log: ${(err as Error).message}`);
    }
  }
}
