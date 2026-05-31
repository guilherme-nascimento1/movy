import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCombatRecordDto } from './dto/boxing.dto';

@Injectable()
export class BoxingService {
  constructor(private prisma: PrismaService) {}

  async createCombatRecord(tenantId: string, dto: CreateCombatRecordDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const record = await this.prisma.combatRecord.create({
      data: { tenantId, ...dto, date: new Date(dto.date) },
    });
    return { data: record };
  }

  async findCombatsByStudent(tenantId: string, studentId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId, studentId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.combatRecord.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.combatRecord.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async getCombatStats(tenantId: string, studentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const records = await this.prisma.combatRecord.findMany({ where: { tenantId, studentId } });
    const wins = records.filter((r) => r.result === 'WIN').length;
    const losses = records.filter((r) => r.result === 'LOSS').length;
    const draws = records.filter((r) => r.result === 'DRAW').length;

    return { data: { studentId, studentName: student.name, wins, losses, draws, total: records.length } };
  }

  async updateMedicalExam(tenantId: string, studentId: string, expiryDate: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { medicalCertificateExpiry: new Date(expiryDate) },
    });
    return { data: { studentId, medicalCertificateExpiry: updated.medicalCertificateExpiry } };
  }
}
