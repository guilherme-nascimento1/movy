import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, scheduleId: string, studentId: string): Promise<object> {
    const schedule = await this.prisma.classSchedule.findFirst({
      where: { id: scheduleId, class: { tenantId } },
      include: { class: true, checkins: true },
    });
    if (!schedule) throw new NotFoundException('Programação de aula não encontrada');

    if (schedule.checkins.length >= schedule.class.capacity) {
      throw new BadRequestException('Capacidade máxima da aula atingida');
    }

    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const existing = await this.prisma.classCheckin.findUnique({
      where: { classScheduleId_studentId: { classScheduleId: scheduleId, studentId } },
    });
    if (existing) throw new ConflictException('Aluno já fez check-in nesta aula');

    const checkin = await this.prisma.classCheckin.create({
      data: { classScheduleId: scheduleId, studentId },
      include: { student: true, schedule: { include: { class: true } } },
    });

    return { data: checkin };
  }

  async findBySchedule(tenantId: string, scheduleId: string): Promise<object> {
    const schedule = await this.prisma.classSchedule.findFirst({
      where: { id: scheduleId, class: { tenantId } },
    });
    if (!schedule) throw new NotFoundException('Programação não encontrada');

    const checkins = await this.prisma.classCheckin.findMany({
      where: { classScheduleId: scheduleId },
      include: { student: true },
      orderBy: { checkedAt: 'asc' },
    });

    return { data: checkins };
  }

  async findByStudent(tenantId: string, studentId: string, query: PaginationDto): Promise<object> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const [data, total] = await this.prisma.$transaction([
      this.prisma.classCheckin.findMany({
        where: { studentId, schedule: { class: { tenantId } } },
        skip, take: limit,
        include: { schedule: { include: { class: true } } },
        orderBy: { checkedAt: 'desc' },
      }),
      this.prisma.classCheckin.count({ where: { studentId, schedule: { class: { tenantId } } } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async remove(tenantId: string, checkinId: string): Promise<object> {
    const checkin = await this.prisma.classCheckin.findFirst({
      where: { id: checkinId, schedule: { class: { tenantId } } },
    });
    if (!checkin) throw new NotFoundException('Check-in não encontrado');

    await this.prisma.classCheckin.delete({ where: { id: checkinId } });
    return { data: { message: 'Check-in removido com sucesso' } };
  }
}
