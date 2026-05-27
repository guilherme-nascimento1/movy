import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelGenerator {
  private applyHeader(ws: ExcelJS.Worksheet, columns: { header: string; key: string; width: number }[]): void {
    ws.columns = columns;
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5CFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;
  }

  async financialReport(
    tenantName: string,
    payments: { studentName: string; planName: string; amount: number; status: string; dueDate: Date; paidAt?: Date | null }[],
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Movy';
    const ws = wb.addWorksheet('Financeiro');

    this.applyHeader(ws, [
      { header: 'Aluno', key: 'student', width: 30 },
      { header: 'Plano', key: 'plan', width: 20 },
      { header: 'Valor (R$)', key: 'amount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Vencimento', key: 'dueDate', width: 14 },
      { header: 'Pago em', key: 'paidAt', width: 14 },
    ]);

    for (const p of payments) {
      ws.addRow({
        student: p.studentName,
        plan: p.planName,
        amount: Number(p.amount),
        status: this.translateStatus(p.status),
        dueDate: p.dueDate.toLocaleDateString('pt-BR'),
        paidAt: p.paidAt ? p.paidAt.toLocaleDateString('pt-BR') : '-',
      });
    }

    ws.getColumn('amount').numFmt = '#,##0.00';

    const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
    const totalOverdue = payments.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + Number(p.amount), 0);

    ws.addRow([]);
    const totalRow = ws.addRow(['', 'TOTAL PAGO', totalPaid, '', '', '']);
    totalRow.font = { bold: true };
    const overdueRow = ws.addRow(['', 'TOTAL VENCIDO', totalOverdue, '', '', '']);
    overdueRow.font = { bold: true, color: { argb: 'FFCC0000' } };

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async studentsReport(
    students: { name: string; email?: string | null; phone?: string | null; status: string; planName?: string; enrollmentEnd?: Date | null; createdAt: Date }[],
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Alunos');

    this.applyHeader(ws, [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'E-mail', key: 'email', width: 28 },
      { header: 'WhatsApp', key: 'phone', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Plano', key: 'plan', width: 20 },
      { header: 'Venc. Matrícula', key: 'enrollmentEnd', width: 16 },
      { header: 'Desde', key: 'createdAt', width: 12 },
    ]);

    for (const s of students) {
      ws.addRow({
        name: s.name,
        email: s.email ?? '-',
        phone: s.phone ?? '-',
        status: this.translateStatus(s.status),
        plan: s.planName ?? '-',
        enrollmentEnd: s.enrollmentEnd ? s.enrollmentEnd.toLocaleDateString('pt-BR') : '-',
        createdAt: s.createdAt.toLocaleDateString('pt-BR'),
      });
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async overdueReport(
    rows: { studentName: string; phone?: string | null; planName: string; amount: number; dueDate: Date; daysOverdue: number }[],
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inadimplência');

    this.applyHeader(ws, [
      { header: 'Aluno', key: 'student', width: 30 },
      { header: 'WhatsApp', key: 'phone', width: 16 },
      { header: 'Plano', key: 'plan', width: 20 },
      { header: 'Valor (R$)', key: 'amount', width: 14 },
      { header: 'Venceu em', key: 'dueDate', width: 14 },
      { header: 'Dias Vencido', key: 'daysOverdue', width: 14 },
    ]);

    rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
    for (const r of rows) {
      const row = ws.addRow({
        student: r.studentName,
        phone: r.phone ?? '-',
        plan: r.planName,
        amount: Number(r.amount),
        dueDate: r.dueDate.toLocaleDateString('pt-BR'),
        daysOverdue: r.daysOverdue,
      });
      if (r.daysOverdue > 30) row.font = { color: { argb: 'FFCC0000' } };
    }

    ws.getColumn('amount').numFmt = '#,##0.00';

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  private translateStatus(s: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Ativo', INACTIVE: 'Inativo', SUSPENDED: 'Suspenso',
      PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Vencido', CANCELLED: 'Cancelado', REFUNDED: 'Estornado',
    };
    return map[s] ?? s;
  }
}
