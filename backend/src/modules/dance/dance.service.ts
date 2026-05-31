import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateDanceEventDto } from './dto/dance.dto';

@Injectable()
export class DanceService {
  constructor(private prisma: PrismaService) {}

  async createEvent(tenantId: string, dto: CreateDanceEventDto): Promise<object> {
    const event = await this.prisma.danceEvent.create({
      data: { tenantId, ...dto, date: new Date(dto.date) },
    });
    return { data: event };
  }

  async findAllEvents(tenantId: string, query: PaginationDto & { danceStyle?: string }): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId, active: true, ...(query.danceStyle && { danceStyle: query.danceStyle }) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.danceEvent.findMany({ where, skip, take: limit, orderBy: { date: 'asc' } }),
      this.prisma.danceEvent.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const event = await this.prisma.danceEvent.findFirst({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return { data: event };
  }

  async update(tenantId: string, id: string, dto: Partial<CreateDanceEventDto>): Promise<object> {
    const event = await this.prisma.danceEvent.findFirst({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    const updated = await this.prisma.danceEvent.update({
      where: { id },
      data: { ...dto, ...(dto.date && { date: new Date(dto.date) }) },
    });
    return { data: updated };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    const event = await this.prisma.danceEvent.findFirst({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    await this.prisma.danceEvent.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Evento removido com sucesso' } };
  }
}
