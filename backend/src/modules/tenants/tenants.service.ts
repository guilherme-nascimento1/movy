import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { OnboardingDto, UpdateModalitiesDto, UpdateTenantSettingsDto } from './dto/tenant-v3.dto';
import { TenantModuleResolverService } from './tenant-module-resolver.service';
import { BusinessModality, UserRole } from '../../common/enums';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private moduleResolver: TenantModuleResolverService,
  ) {}

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

  // ─── ONBOARDING ──────────────────────────────────────────

  async completeOnboarding(tenantId: string, userId: string, dto: OnboardingDto): Promise<object> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Academia não encontrada');

    const [updatedTenant] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: dto.businessName,
          modalities: dto.modalities,
          onboardingComplete: true,
        },
      }),
      this.prisma.tenantSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          termForStudent: dto.termForStudent ?? 'Aluno',
          termForClass: dto.termForClass ?? 'Aula',
          termForInstructor: dto.termForInstructor ?? 'Professor',
          primaryColor: dto.primaryColor ?? '#6366F1',
        },
        update: {
          ...(dto.termForStudent && { termForStudent: dto.termForStudent }),
          ...(dto.termForClass && { termForClass: dto.termForClass }),
          ...(dto.termForInstructor && { termForInstructor: dto.termForInstructor }),
          ...(dto.primaryColor && { primaryColor: dto.primaryColor }),
        },
      }),
      this.prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId,
          action: 'ONBOARDING_COMPLETE',
          before: null,
          after: { modalities: dto.modalities, businessName: dto.businessName },
        },
      }),
    ]);

    const modulesEnabled = this.moduleResolver.resolve(dto.modalities as BusinessModality[]);
    return { data: { onboardingComplete: true, modulesEnabled, tenant: updatedTenant } };
  }

  // ─── MODALIDADES ─────────────────────────────────────────

  async updateModalities(tenantId: string, userId: string, role: UserRole, dto: UpdateModalitiesDto): Promise<object> {
    if (role !== UserRole.OWNER) {
      throw new ForbiddenException('Apenas o proprietário pode alterar as modalidades');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { modalities: true },
    });
    if (!tenant) throw new NotFoundException('Academia não encontrada');

    const [updated] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { modalities: dto.modalities },
      }),
      this.prisma.tenantAuditLog.create({
        data: {
          tenantId,
          userId,
          action: 'MODALITIES_UPDATED',
          before: { modalities: tenant.modalities },
          after: { modalities: dto.modalities },
        },
      }),
    ]);

    const modulesEnabled = this.moduleResolver.resolve(dto.modalities as BusinessModality[]);
    return { data: { modalities: updated.modalities, modulesEnabled } };
  }

  // ─── SETTINGS ────────────────────────────────────────────

  async getSettings(tenantId: string): Promise<object> {
    const [tenant, settings] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { modalities: true, onboardingComplete: true },
      }),
      this.prisma.tenantSettings.findUnique({ where: { tenantId } }),
    ]);
    if (!tenant) throw new NotFoundException('Academia não encontrada');

    const modulesEnabled = this.moduleResolver.resolve((tenant.modalities ?? []) as BusinessModality[]);
    return { data: { ...tenant, settings, modulesEnabled } };
  }

  async updateSettings(tenantId: string, role: UserRole, dto: UpdateTenantSettingsDto): Promise<object> {
    if (role !== UserRole.OWNER) {
      throw new ForbiddenException('Apenas o proprietário pode alterar as configurações');
    }

    const settings = await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: dto,
    });
    return { data: settings };
  }

  // ─── MODULES ─────────────────────────────────────────────

  async getModules(tenantId: string): Promise<object> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { modalities: true },
    });
    if (!tenant) throw new NotFoundException('Academia não encontrada');

    const modulesEnabled = this.moduleResolver.resolve((tenant.modalities ?? []) as BusinessModality[]);
    return { data: { modulesEnabled } };
  }
}
