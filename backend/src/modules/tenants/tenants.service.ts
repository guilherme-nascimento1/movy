import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(tenantId: string): Promise<object> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Academia não encontrada');
    return { data: tenant };
  }

  async update(tenantId: string, dto: UpdateTenantDto): Promise<object> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Academia não encontrada');

    const { settings, ...rest } = dto;
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...rest,
        ...(settings !== undefined && { settings: settings as Prisma.InputJsonValue }),
      },
    });
    return { data: updated };
  }
}
