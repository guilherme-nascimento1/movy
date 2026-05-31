import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SwimmingService {
  constructor(private prisma: PrismaService) {}

  async updateMedicalCertificate(tenantId: string, studentId: string, expiryDate: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { medicalCertificateExpiry: new Date(expiryDate) },
    });
    return { data: { studentId, medicalCertificateExpiry: updated.medicalCertificateExpiry } };
  }

  async findExpiringCertificates(tenantId: string, query: PaginationDto & { daysAhead?: string }): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const daysAhead = Number(query.daysAhead) || 30;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysAhead);

    const where = {
      tenantId,
      medicalCertificateExpiry: { lte: threshold },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { medicalCertificateExpiry: 'asc' },
        select: { id: true, name: true, phone: true, email: true, medicalCertificateExpiry: true },
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }
}
