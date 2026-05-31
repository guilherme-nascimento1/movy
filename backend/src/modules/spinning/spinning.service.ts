import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateEquipmentDto, UpdateEquipmentStatusDto } from './dto/spinning.dto';

@Injectable()
export class SpinningService {
  constructor(private prisma: PrismaService) {}

  async createEquipment(tenantId: string, dto: CreateEquipmentDto): Promise<object> {
    const equipment = await this.prisma.equipment.create({
      data: { tenantId, ...dto, ...(dto.lastMaintenanceAt && { lastMaintenanceAt: new Date(dto.lastMaintenanceAt) }) },
    });
    return { data: equipment };
  }

  async findAllEquipment(tenantId: string, query: PaginationDto & { type?: string; status?: string }): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.equipment.findMany({ where, skip, take: limit, orderBy: { identifier: 'asc' } }),
      this.prisma.equipment.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateEquipmentStatusDto): Promise<object> {
    const equipment = await this.prisma.equipment.findFirst({ where: { id, tenantId } });
    if (!equipment) throw new NotFoundException('Equipamento não encontrado');
    const updated = await this.prisma.equipment.update({ where: { id }, data: dto });
    return { data: updated };
  }

  async registerMaintenance(tenantId: string, id: string, notes?: string): Promise<object> {
    const equipment = await this.prisma.equipment.findFirst({ where: { id, tenantId } });
    if (!equipment) throw new NotFoundException('Equipamento não encontrado');
    const updated = await this.prisma.equipment.update({
      where: { id },
      data: { lastMaintenanceAt: new Date(), status: 'ACTIVE', ...(notes && { notes }) },
    });
    return { data: updated };
  }
}
