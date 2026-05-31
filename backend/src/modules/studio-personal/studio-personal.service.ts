import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateSessionPackageDto,
  ScheduleSessionDto,
  CompleteSessionDto,
} from './dto/studio-personal.dto';

@Injectable()
export class StudioPersonalService {
  constructor(private prisma: PrismaService) {}

  // ─── PACOTES ─────────────────────────────────────────────

  async createPackage(tenantId: string, dto: CreateSessionPackageDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const pkg = await this.prisma.sessionPackage.create({
      data: {
        tenantId,
        ...dto,
        price: dto.price,
        ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
      },
    });
    return { data: pkg };
  }

  async findPackagesByStudent(tenantId: string, studentId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId, studentId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.sessionPackage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.sessionPackage.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  // ─── SESSÕES ─────────────────────────────────────────────

  async scheduleSession(tenantId: string, dto: ScheduleSessionDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    if (dto.packageId) {
      const pkg = await this.prisma.sessionPackage.findFirst({
        where: { id: dto.packageId, tenantId, status: 'ACTIVE' },
      });
      if (!pkg) throw new NotFoundException('Pacote não encontrado ou inativo');
      if (pkg.usedSessions >= pkg.totalSessions) {
        throw new BadRequestException('Pacote de sessões esgotado');
      }
    }

    const session = await this.prisma.personalSession.create({
      data: {
        tenantId,
        personalId: dto.personalId,
        studentId: dto.studentId,
        packageId: dto.packageId ?? null,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
      },
    });
    return { data: session };
  }

  async completeSession(tenantId: string, sessionId: string, dto: CompleteSessionDto): Promise<object> {
    const session = await this.prisma.personalSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.status === 'COMPLETED') throw new BadRequestException('Sessão já concluída');

    const [updatedSession] = await this.prisma.$transaction([
      this.prisma.personalSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', completedAt: new Date(), notes: dto.notes },
      }),
      ...(session.packageId
        ? [
            this.prisma.sessionPackage.update({
              where: { id: session.packageId },
              data: { usedSessions: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    return { data: updatedSession };
  }

  async findSessionsByPersonal(tenantId: string, personalId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId, personalId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.personalSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: { student: { select: { id: true, name: true, photoUrl: true } } },
      }),
      this.prisma.personalSession.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }
}
