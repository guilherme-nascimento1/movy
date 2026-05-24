import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentStatus, EnrollmentStatus, PaymentStatus } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(tenantId: string): Promise<object> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      activeStudents,
      lastMonthStudents,
      activeEnrollments,
      newEnrollmentsThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      overduePayments,
      overdueAmount,
    ] = await this.prisma.$transaction([
      this.prisma.student.count({ where: { tenantId, status: StudentStatus.ACTIVE } }),
      this.prisma.student.count({ where: { tenantId, status: StudentStatus.ACTIVE, createdAt: { lt: startOfMonth } } }),
      this.prisma.enrollment.count({ where: { tenantId, status: EnrollmentStatus.ACTIVE } }),
      this.prisma.enrollment.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: { tenantId, status: PaymentStatus.PENDING, dueDate: { lt: now } } }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: PaymentStatus.PENDING, dueDate: { lt: now } },
        _sum: { amount: true },
      }),
    ]);

    const revenueNow = Number(revenueThisMonth._sum.amount ?? 0);
    const revenuePrev = Number(revenueLastMonth._sum.amount ?? 0);
    const revenueGrowth = revenuePrev > 0 ? ((revenueNow - revenuePrev) / revenuePrev) * 100 : 0;
    const studentGrowth = lastMonthStudents > 0
      ? ((activeStudents - lastMonthStudents) / lastMonthStudents) * 100 : 0;
    const defaultRate = activeEnrollments > 0 ? (overduePayments / activeEnrollments) * 100 : 0;

    return {
      data: {
        activeStudents,
        studentGrowthPercent: Math.round(studentGrowth * 10) / 10,
        activeEnrollments,
        newEnrollmentsThisMonth,
        revenueThisMonth: revenueNow,
        revenueGrowthPercent: Math.round(revenueGrowth * 10) / 10,
        overdueCount: overduePayments,
        overdueAmount: Number(overdueAmount._sum.amount ?? 0),
        defaultRatePercent: Math.round(defaultRate * 10) / 10,
      },
    };
  }

  async getRevenueChart(tenantId: string): Promise<object> {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('pt-BR', { month: 'short' }) };
    });

    const data = await Promise.all(
      months.map(async ({ year, month, label }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const result = await this.prisma.payment.aggregate({
          where: { tenantId, status: PaymentStatus.PAID, paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        });
        return { month: label, revenue: Number(result._sum.amount ?? 0) };
      }),
    );

    return { data };
  }
}
