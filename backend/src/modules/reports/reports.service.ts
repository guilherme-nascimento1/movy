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
