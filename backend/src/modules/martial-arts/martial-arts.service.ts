import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GraduateStudentDto } from './dto/martial-arts.dto';
import { BeltColor } from '@prisma/client';

@Injectable()
export class MartialArtsService {
  constructor(private prisma: PrismaService) {}

  async graduate(tenantId: string, graduatedBy: string, dto: GraduateStudentDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const graduation = await this.prisma.beltGraduation.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        belt: dto.belt as BeltColor,
        stripes: dto.stripes ?? 0,
        modality: dto.modality,
        notes: dto.notes,
        graduatedBy,
        graduatedAt: new Date(),
      },
      include: { student: { select: { id: true, name: true } } },
    });

    return { data: graduation };
  }

  async getHistory(tenantId: string, studentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const history = await this.prisma.beltGraduation.findMany({
      where: { tenantId, studentId },
      orderBy: { graduatedAt: 'desc' },
    });

    return { data: history };
  }

  async getCurrentBelt(tenantId: string, studentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const latest = await this.prisma.beltGraduation.findFirst({
      where: { tenantId, studentId },
      orderBy: { graduatedAt: 'desc' },
    });

    return { data: latest };
  }

  async listByModality(tenantId: string, modality: string): Promise<object> {
    const graduations = await this.prisma.beltGraduation.findMany({
      where: { tenantId, modality },
      distinct: ['studentId'],
      orderBy: [{ belt: 'desc' }, { stripes: 'desc' }],
      include: { student: { select: { id: true, name: true, photoUrl: true } } },
    });

    return { data: graduations };
  }
}
