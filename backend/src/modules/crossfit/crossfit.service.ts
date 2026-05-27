import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateWodDto, CreateWodResultDto, CreatePersonalRecordDto } from './dto/crossfit.dto';

@Injectable()
export class CrossfitService {
  constructor(private prisma: PrismaService) {}

  // ── WODs ───────────────────────────────────────────────
  async createWod(tenantId: string, dto: CreateWodDto): Promise<object> {
    const existing = await this.prisma.wod.findFirst({ where: { tenantId, date: new Date(dto.date) } });
    if (existing) throw new ConflictException('Já existe um WOD para esta data');

    const wod = await this.prisma.wod.create({
      data: { tenantId, ...dto, date: new Date(dto.date) },
    });
    return { data: wod };
  }

  async findWodByDate(tenantId: string, date: string): Promise<object> {
    const wod = await this.prisma.wod.findFirst({
      where: { tenantId, date: new Date(date), active: true },
      include: { results: { include: { student: { select: { id: true, name: true } } }, orderBy: [{ rx: 'desc' }, { score: 'asc' }] } },
    });
    if (!wod) throw new NotFoundException('WOD não encontrado para esta data');
    return { data: wod };
  }

  async listWods(tenantId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.wod.findMany({
        where: { tenantId, active: true },
        skip, take: limit,
        include: { _count: { select: { results: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.wod.count({ where: { tenantId, active: true } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async deleteWod(tenantId: string, id: string): Promise<object> {
    const wod = await this.prisma.wod.findFirst({ where: { id, tenantId } });
    if (!wod) throw new NotFoundException('WOD não encontrado');
    await this.prisma.wod.update({ where: { id }, data: { active: false } });
    return { data: { message: 'WOD removido com sucesso' } };
  }

  // ── Results + Ranking ───────────────────────────────────
  async addResult(tenantId: string, wodId: string, dto: CreateWodResultDto): Promise<object> {
    const wod = await this.prisma.wod.findFirst({ where: { id: wodId, tenantId } });
    if (!wod) throw new NotFoundException('WOD não encontrado');

    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const existing = await this.prisma.wodResult.findFirst({ where: { wodId, studentId: dto.studentId } });
    if (existing) {
      const updated = await this.prisma.wodResult.update({ where: { id: existing.id }, data: dto });
      return { data: updated };
    }

    const result = await this.prisma.wodResult.create({
      data: { tenantId, wodId, ...dto, completedAt: new Date() },
    });
    return { data: result };
  }

  async getRanking(tenantId: string, wodId: string): Promise<object> {
    const results = await this.prisma.wodResult.findMany({
      where: { tenantId, wodId },
      include: { student: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: [{ rx: 'desc' }, { score: 'asc' }],
    });

    const ranked = results.map((r, i) => ({ position: i + 1, ...r }));
    return { data: ranked };
  }

  // ── Personal Records ────────────────────────────────────
  async addPr(tenantId: string, dto: CreatePersonalRecordDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const exercise = await this.prisma.exercise.findFirst({ where: { id: dto.exerciseId, tenantId } });
    if (!exercise) throw new NotFoundException('Exercício não encontrado');

    const pr = await this.prisma.personalRecord.create({
      data: { tenantId, ...dto, achievedAt: new Date() },
      include: { exercise: { select: { name: true, category: true } } },
    });
    return { data: pr };
  }

  async getStudentPrs(tenantId: string, studentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const prs = await this.prisma.personalRecord.findMany({
      where: { tenantId, studentId },
      include: { exercise: { select: { name: true, category: true } } },
      orderBy: { achievedAt: 'desc' },
    });
    return { data: prs };
  }
}
