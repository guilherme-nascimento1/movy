import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { TenantPlan } from '../../common/enums';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  private async assertProPlan(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId } });
    if (tenant?.plan !== TenantPlan.PRO) {
      throw new ForbiddenException('Multi-unidade disponível apenas no plano Pro');
    }
  }

  async create(tenantId: string, dto: CreateUnitDto): Promise<object> {
    await this.assertProPlan(tenantId);
    const unit = await this.prisma.unit.create({ data: { tenantId, ...dto } });
    return { data: unit };
  }

  async findAll(tenantId: string): Promise<object> {
    const units = await this.prisma.unit.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
    return { data: units };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const unit = await this.prisma.unit.findFirst({ where: { id, tenantId, active: true } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return { data: unit };
  }

  async update(tenantId: string, id: string, dto: UpdateUnitDto): Promise<object> {
    await this.findOne(tenantId, id);
    const unit = await this.prisma.unit.update({ where: { id }, data: dto });
    return { data: unit };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    await this.findOne(tenantId, id);
    await this.prisma.unit.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Unidade removida com sucesso' } };
  }
}
