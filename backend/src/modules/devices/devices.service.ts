import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async register(tenantId: string, userId: string, dto: RegisterDeviceDto): Promise<object> {
    const device = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { tenantId, userId, token: dto.token, app: dto.app },
      update: { tenantId, userId, app: dto.app },
    });
    return { data: { id: device.id, app: device.app, registeredAt: device.createdAt } };
  }
}
