import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateAsanaDto } from './dto/yoga.dto';

@Injectable()
export class YogaService {
  constructor(private prisma: PrismaService) {}

  async createAsana(tenantId: string, dto: CreateAsanaDto): Promise<object> {
    const asana = await this.prisma.asanaLibrary.create({ data: { tenantId, ...dto } });
    return { data: asana };
  }

  async findAllAsanas(tenantId: string, query: PaginationDto & { category?: string; level?: string }): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(query.category && { category: query.category }),
      ...(query.level && { level: query.level }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.asanaLibrary.findMany({ where, skip, take: limit, orderBy: { namePt: 'asc' } }),
      this.prisma.asanaLibrary.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOneAsana(tenantId: string, id: string): Promise<object> {
    const asana = await this.prisma.asanaLibrary.findFirst({ where: { id, tenantId } });
    if (!asana) throw new NotFoundException('Asana não encontrado');
    return { data: asana };
  }

  async updateAsana(tenantId: string, id: string, dto: Partial<CreateAsanaDto>): Promise<object> {
    const asana = await this.prisma.asanaLibrary.findFirst({ where: { id, tenantId } });
    if (!asana) throw new NotFoundException('Asana não encontrado');
    const updated = await this.prisma.asanaLibrary.update({ where: { id }, data: dto });
    return { data: updated };
  }

  async removeAsana(tenantId: string, id: string): Promise<object> {
    const asana = await this.prisma.asanaLibrary.findFirst({ where: { id, tenantId } });
    if (!asana) throw new NotFoundException('Asana não encontrado');
    await this.prisma.asanaLibrary.delete({ where: { id } });
    return { data: { message: 'Asana removido com sucesso' } };
  }
}
