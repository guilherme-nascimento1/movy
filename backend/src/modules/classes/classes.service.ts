import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto, CreateScheduleDto } from './dto/create-class.dto';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClassDto): Promise<object> {
    const cls = await this.prisma.class.create({ data: { tenantId, ...dto } });
    return { data: cls };
  }

  async findAll(tenantId: string, query: PaginationDto): Promise<object> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where: { tenantId, active: true }, skip, take: limit,
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.class.count({ where: { tenantId, active: true } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const cls = await this.prisma.class.findFirst({
      where: { id, tenantId },
      include: { schedules: { where: { date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 10 } },
    });
    if (!cls) throw new NotFoundException('Aula não encontrada');
    return { data: cls };
  }

  async update(tenantId: string, id: string, dto: Partial<CreateClassDto> & { active?: boolean }): Promise<object> {
    await this.findOne(tenantId, id);
    const cls = await this.prisma.class.update({ where: { id }, data: dto });
    return { data: cls };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    await this.findOne(tenantId, id);
    await this.prisma.class.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Aula desativada com sucesso' } };
  }

  async createSchedule(tenantId: string, classId: string, dto: CreateScheduleDto): Promise<object> {
    const cls = await this.prisma.class.findFirst({ where: { id: classId, tenantId } });
    if (!cls) throw new NotFoundException('Aula não encontrada');

    const date = new Date(dto.date);
    const existing = await this.prisma.classSchedule.findFirst({ where: { classId, date } });
    if (existing) throw new BadRequestException('Já existe uma programação para essa data');

    const schedule = await this.prisma.classSchedule.create({ data: { classId, date } });
    return { data: schedule };
  }

  async getSchedules(tenantId: string, query: { date?: string; classId?: string } & PaginationDto): Promise<object> {
    const { page = 1, limit = 20, date, classId } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.classSchedule.findMany({
        where: {
          class: { tenantId },
          ...(classId && { classId }),
          ...(date && { date: new Date(date) }),
        },
        skip, take: limit,
        include: { class: true, checkins: { include: { student: true } } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.classSchedule.count({
        where: { class: { tenantId }, ...(classId && { classId }), ...(date && { date: new Date(date) }) },
      }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }
}
