import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePlanDto): Promise<object> {
    const plan = await this.prisma.academyPlan.create({ data: { tenantId, ...dto } });
    return { data: plan };
  }

  async findAll(tenantId: string, query: PaginationDto): Promise<object> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.academyPlan.findMany({
        where: { tenantId, active: true },
        skip, take: limit, orderBy: { name: 'asc' },
      }),
      this.prisma.academyPlan.count({ where: { tenantId, active: true } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const plan = await this.prisma.academyPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return { data: plan };
  }

  async update(tenantId: string, id: string, dto: UpdatePlanDto): Promise<object> {
    await this.findOne(tenantId, id);
    const plan = await this.prisma.academyPlan.update({ where: { id }, data: dto });
    return { data: plan };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    await this.findOne(tenantId, id);
    await this.prisma.academyPlan.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Plano desativado com sucesso' } };
  }
}
