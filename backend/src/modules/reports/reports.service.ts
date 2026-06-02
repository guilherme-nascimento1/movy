import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelGenerator } from './generators/excel.generator';
import { PaymentStatus } from '../../common/enums';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private excel: ExcelGenerator,
  ) {}

  async financialSummary(tenantId: string, filters: ReportFilters): Promise<object> {
    const where = this.buildDateWhere(tenantId, 'dueDate', filters);

    const payments = await this.prisma.payment.findMany({
      where,
      include: { enrollment: { include: { student: true, plan: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    const paid = payments.filter((p) => p.status === PaymentStatus.PAID).reduce((s, p) => s + Number(p.amount), 0);
    const overdue = payments.filter((p) => p.status === PaymentStatus.OVERDUE).reduce((s, p) => s + Number(p.amount), 0);
    const pending = payments.filter((p) => p.status === PaymentStatus.PENDING).reduce((s, p) => s + Number(p.amount), 0);

    const byStatus = {
      paid: payments.filter((p) => p.status === PaymentStatus.PAID).length,
      pending: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
      overdue: payments.filter((p) => p.status === PaymentStatus.OVERDUE).length,
    };

    return { data: { total, paid, overdue, pending, byStatus, count: payments.length } };
  }

  async retentionReport(tenantId: string): Promise<object> {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }) };
    }).reverse();

    const series = await Promise.all(
      months.map(async (m) => {
        const start = new Date(m.year, m.month - 1, 1);
        const end = new Date(m.year, m.month, 0, 23, 59, 59);

        const [active, newEnrollments, cancelled] = await Promise.all([
          this.prisma.enrollment.count({ where: { tenantId, status: 'ACTIVE', startDate: { lte: end }, endDate: { gte: start } } }),
          this.prisma.enrollment.count({ where: { tenantId, createdAt: { gte: start, lte: end } } }),
          this.prisma.enrollment.count({ where: { tenantId, status: { in: ['CANCELLED', 'EXPIRED'] }, updatedAt: { gte: start, lte: end } } }),
        ]);

        return { label: m.label, active, new: newEnrollments, cancelled };
      }),
    );

    return { data: series };
  }

  async exportFinancialExcel(tenantId: string, filters: ReportFilters): Promise<Buffer> {
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId } });
    const payments = await this.prisma.payment.findMany({
      where: this.buildDateWhere(tenantId, 'dueDate', filters),
      include: { enrollment: { include: { student: true, plan: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return this.excel.financialReport(
      tenant?.name ?? 'Academia',
      payments.map((p) => ({
        studentName: p.enrollment.student.name,
        planName: p.enrollment.plan.name,
        amount: Number(p.amount),
        status: p.status,
        dueDate: p.dueDate,
        paidAt: p.paidAt,
      })),
    );
  }

  async exportStudentsExcel(tenantId: string): Promise<Buffer> {
    const students = await this.prisma.student.findMany({
      where: { tenantId },
      include: { enrollments: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { name: 'asc' },
    });

    return this.excel.studentsReport(
      students.map((s) => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        status: s.status,
        planName: s.enrollments[0]?.plan.name,
        enrollmentEnd: s.enrollments[0]?.endDate,
        createdAt: s.createdAt,
      })),
    );
  }

  async exportOverdueExcel(tenantId: string): Promise<Buffer> {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, status: PaymentStatus.OVERDUE },
      include: { enrollment: { include: { student: true, plan: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const today = new Date();
    return this.excel.overdueReport(
      payments.map((p) => ({
        studentName: p.enrollment.student.name,
        phone: p.enrollment.student.phone,
        planName: p.enrollment.plan.name,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        daysOverdue: Math.floor((today.getTime() - p.dueDate.getTime()) / 86400000),
      })),
    );
  }

  // ── 4.9 — Aquisição ──────────────────────────────────────
  async acquisitionReport(tenantId: string, period: string): Promise<object> {
    const { start, end } = this.periodRange(period);

    const [totalLeads, convertedLeads, leads] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: start, lte: end } } }),
      this.prisma.lead.count({ where: { tenantId, stage: 'WON', createdAt: { gte: start, lte: end } } }),
      this.prisma.lead.findMany({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        select: { stage: true, utmSource: true, stageEnteredAt: true, createdAt: true },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Agrupamento por canal UTM
    const channelMap = new Map<string, { leads: number; converted: number }>();
    for (const lead of leads) {
      const channel = lead.utmSource ?? 'direto';
      if (!channelMap.has(channel)) channelMap.set(channel, { leads: 0, converted: 0 });
      const c = channelMap.get(channel)!;
      c.leads++;
      if (lead.stage === 'WON') c.converted++;
    }

    const byChannel = Array.from(channelMap.entries()).map(([utmSource, data]) => ({
      utmSource,
      leads: data.leads,
      converted: data.converted,
      conversionRate: data.leads > 0 ? Math.round((data.converted / data.leads) * 100) : 0,
    }));

    // Funil por estágio
    const stageMap = new Map<string, number>();
    for (const lead of leads) stageMap.set(lead.stage, (stageMap.get(lead.stage) ?? 0) + 1);

    const funnelStages = Array.from(stageMap.entries()).map(([stage, count]) => ({ stage, count }));

    // Tempo médio para conversão
    const convertedWithTime = leads.filter((l) => l.stage === 'WON');
    const avgTimeToConversion = convertedWithTime.length > 0
      ? Math.round(convertedWithTime.reduce((s, l) => s + (l.stageEnteredAt.getTime() - l.createdAt.getTime()), 0) / convertedWithTime.length / 86400000)
      : 0;

    return { data: { totalLeads, convertedLeads, conversionRate, byChannel, funnelStages, avgTimeToConversion } };
  }

  // ── 4.9 — Vendas / MRR ───────────────────────────────────
  async salesReport(tenantId: string, period: string): Promise<object> {
    const { start, end } = this.periodRange(period);

    const payments = await this.prisma.payment.findMany({
      where: { tenantId, status: 'PAID', paidAt: { gte: start, lte: end } },
      include: { enrollment: true },
    });

    const reactivations = await this.prisma.student.count({
      where: { tenantId, status: 'ACTIVE', updatedAt: { gte: start, lte: end }, cancellationReason: { not: null } },
    });

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

    // Separar receita nova vs recorrente (nova = enrollment criado no período)
    const newEnrollmentIds = (await this.prisma.enrollment.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      select: { id: true },
    })).map((e) => e.id);

    const newMrr = payments.filter((p) => newEnrollmentIds.includes(p.enrollmentId)).reduce((s, p) => s + Number(p.amount), 0);
    const recurringMrr = totalPaid - newMrr;

    // Projeção: média dos últimos 3 meses
    const threeMonthsAgo = new Date(start);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const historicPaid = await this.prisma.payment.aggregate({
      where: { tenantId, status: 'PAID', paidAt: { gte: threeMonthsAgo, lte: start } },
      _sum: { amount: true },
    });
    const projectedMrr = Number(historicPaid._sum.amount ?? 0) / 3;

    const trialConversions = await this.prisma.lead.count({
      where: { tenantId, stage: 'WON', trialClassAt: { not: null }, updatedAt: { gte: start, lte: end } },
    });
    const trialsScheduled = await this.prisma.lead.count({
      where: { tenantId, trialClassAt: { not: null, gte: start, lte: end } },
    });
    const trialConversionRate = trialsScheduled > 0 ? Math.round((trialConversions / trialsScheduled) * 100) : 0;

    return {
      data: {
        newMrr: Math.round(newMrr * 100) / 100,
        recurringMrr: Math.round(recurringMrr * 100) / 100,
        reactivationMrr: 0,
        totalMrr: Math.round(totalPaid * 100) / 100,
        projectedMrr: Math.round(projectedMrr * 100) / 100,
        trialConversionRate,
        reactivations,
      },
    };
  }

  // ── 4.6 — NPS report ─────────────────────────────────────
  async npsReport(tenantId: string): Promise<object> {
    const responses = await this.prisma.npsResponse.findMany({
      where: { tenantId },
      select: { score: true, comment: true, type: true, createdAt: true },
    });

    if (responses.length === 0) {
      return { data: { averageScore: 0, npsScore: 0, total: 0, distribution: { promoters: 0, passives: 0, detractors: 0 }, recentComments: [] } };
    }

    const total = responses.length;
    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score <= 6).length;
    const averageScore = responses.reduce((s, r) => s + r.score, 0) / total;
    const npsScore = Math.round(((promoters - detractors) / total) * 100);

    const recentComments = responses
      .filter((r) => r.comment)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      data: {
        averageScore: Math.round(averageScore * 10) / 10,
        npsScore,
        total,
        distribution: {
          promoters: Math.round((promoters / total) * 100),
          passives: Math.round((passives / total) * 100),
          detractors: Math.round((detractors / total) * 100),
        },
        recentComments,
      },
    };
  }

  private periodRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    let start: Date;

    if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
    } else if (period === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      // month (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }

  private buildDateWhere(tenantId: string, field: string, filters: ReportFilters): object {
    return {
      tenantId,
      ...(filters.startDate || filters.endDate
        ? {
            [field]: {
              ...(filters.startDate && { gte: new Date(filters.startDate) }),
              ...(filters.endDate && { lte: new Date(filters.endDate) }),
            },
          }
        : {}),
    };
  }
}
