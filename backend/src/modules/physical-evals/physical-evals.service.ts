import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePhysicalEvalDto, UpdatePhysicalEvalDto } from './dto/physical-eval.dto';

@Injectable()
export class PhysicalEvalsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, evaluatedBy: string, dto: CreatePhysicalEvalDto): Promise<object> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const bmi = this.calcBmi(dto.weight, dto.height);

    const eval_ = await this.prisma.physicalEval.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        evaluatedBy,
        evaluatedAt: dto.evaluatedAt ? new Date(dto.evaluatedAt) : new Date(),
        nextEvalAt: dto.nextEvalAt ? new Date(dto.nextEvalAt) : undefined,
        objectives: dto.objectives,
        healthHistory: (dto.healthHistory as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        parqAnswers: (dto.parqAnswers as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        protocol: dto.protocol,
        weight: dto.weight,
        height: dto.height,
        bmi,
        bodyFat: dto.bodyFat,
        leanMass: dto.leanMass ?? this.calcLeanMass(dto.weight, dto.bodyFat),
        waist: dto.waist,
        hip: dto.hip,
        chest: dto.chest,
        abdomen: dto.abdomen,
        thigh: dto.thigh,
        arm: dto.arm,
        calf: dto.calf,
        skinfoldChest: dto.skinfoldChest,
        skinfoldAbdomen: dto.skinfoldAbdomen,
        skinfoldThigh: dto.skinfoldThigh,
        skinfoldTricep: dto.skinfoldTricep,
        skinfoldSubscapular: dto.skinfoldSubscapular,
        skinfoldSuprailiac: dto.skinfoldSuprailiac,
        skinfoldAxillary: dto.skinfoldAxillary,
        bloodPressure: dto.bloodPressure,
        restingHR: dto.restingHR,
        notes: dto.notes,
        photos: (dto.photos as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    return { data: eval_ };
  }

  async findByStudent(tenantId: string, studentId: string, query: PaginationDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.physicalEval.findMany({
        where: { tenantId, studentId, active: true },
        skip,
        take: limit,
        orderBy: { evaluatedAt: 'desc' },
      }),
      this.prisma.physicalEval.count({ where: { tenantId, studentId, active: true } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const eval_ = await this.prisma.physicalEval.findFirst({
      where: { id, tenantId, active: true },
      include: { student: { select: { id: true, name: true, birthdate: true } } },
    });
    if (!eval_) throw new NotFoundException('Avaliação física não encontrada');
    return { data: eval_ };
  }

  async update(tenantId: string, id: string, dto: UpdatePhysicalEvalDto): Promise<object> {
    const existing = await this.prisma.physicalEval.findFirst({ where: { id, tenantId, active: true } });
    if (!existing) throw new NotFoundException('Avaliação física não encontrada');

    const weight = dto.weight ?? Number(existing.weight);
    const height = dto.height ?? Number(existing.height);
    const bmi = this.calcBmi(weight, height);
    const bodyFat = dto.bodyFat ?? Number(existing.bodyFat);
    const leanMass = dto.leanMass ?? this.calcLeanMass(weight, bodyFat);

    const updated = await this.prisma.physicalEval.update({
      where: { id },
      data: {
        ...(dto.evaluatedAt && { evaluatedAt: new Date(dto.evaluatedAt) }),
        ...(dto.nextEvalAt !== undefined && { nextEvalAt: dto.nextEvalAt ? new Date(dto.nextEvalAt) : null }),
        ...(dto.objectives !== undefined && { objectives: dto.objectives }),
        ...(dto.healthHistory !== undefined && { healthHistory: dto.healthHistory as Prisma.InputJsonValue }),
        ...(dto.parqAnswers !== undefined && { parqAnswers: dto.parqAnswers as Prisma.InputJsonValue }),
        ...(dto.protocol !== undefined && { protocol: dto.protocol }),
        ...(dto.weight !== undefined && { weight: dto.weight, bmi }),
        ...(dto.height !== undefined && { height: dto.height, bmi }),
        ...(dto.bodyFat !== undefined && { bodyFat: dto.bodyFat }),
        ...(dto.leanMass !== undefined ? { leanMass: dto.leanMass } : leanMass !== null ? { leanMass } : {}),
        ...(dto.waist !== undefined && { waist: dto.waist }),
        ...(dto.hip !== undefined && { hip: dto.hip }),
        ...(dto.chest !== undefined && { chest: dto.chest }),
        ...(dto.abdomen !== undefined && { abdomen: dto.abdomen }),
        ...(dto.thigh !== undefined && { thigh: dto.thigh }),
        ...(dto.arm !== undefined && { arm: dto.arm }),
        ...(dto.calf !== undefined && { calf: dto.calf }),
        ...(dto.skinfoldChest !== undefined && { skinfoldChest: dto.skinfoldChest }),
        ...(dto.skinfoldAbdomen !== undefined && { skinfoldAbdomen: dto.skinfoldAbdomen }),
        ...(dto.skinfoldThigh !== undefined && { skinfoldThigh: dto.skinfoldThigh }),
        ...(dto.skinfoldTricep !== undefined && { skinfoldTricep: dto.skinfoldTricep }),
        ...(dto.skinfoldSubscapular !== undefined && { skinfoldSubscapular: dto.skinfoldSubscapular }),
        ...(dto.skinfoldSuprailiac !== undefined && { skinfoldSuprailiac: dto.skinfoldSuprailiac }),
        ...(dto.skinfoldAxillary !== undefined && { skinfoldAxillary: dto.skinfoldAxillary }),
        ...(dto.bloodPressure !== undefined && { bloodPressure: dto.bloodPressure }),
        ...(dto.restingHR !== undefined && { restingHR: dto.restingHR }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.photos !== undefined && { photos: dto.photos as Prisma.InputJsonValue }),
      },
    });

    return { data: updated };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    const existing = await this.prisma.physicalEval.findFirst({ where: { id, tenantId, active: true } });
    if (!existing) throw new NotFoundException('Avaliação física não encontrada');

    await this.prisma.physicalEval.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Avaliação removida com sucesso' } };
  }

  async evolution(tenantId: string, studentId: string): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const evals = await this.prisma.physicalEval.findMany({
      where: { tenantId, studentId, active: true },
      orderBy: { evaluatedAt: 'asc' },
      select: {
        evaluatedAt: true,
        weight: true,
        bodyFat: true,
        leanMass: true,
        bmi: true,
        waist: true,
        hip: true,
        chest: true,
        abdomen: true,
        thigh: true,
        arm: true,
        calf: true,
      },
    });

    const series = evals.map((e) => ({
      date: e.evaluatedAt.toISOString().split('T')[0],
      weight: e.weight ? Number(e.weight) : undefined,
      bodyFat: e.bodyFat ? Number(e.bodyFat) : undefined,
      leanMass: e.leanMass ? Number(e.leanMass) : undefined,
      bmi: e.bmi ? Number(e.bmi) : undefined,
      waist: e.waist ? Number(e.waist) : undefined,
      hip: e.hip ? Number(e.hip) : undefined,
      chest: e.chest ? Number(e.chest) : undefined,
      abdomen: e.abdomen ? Number(e.abdomen) : undefined,
      thigh: e.thigh ? Number(e.thigh) : undefined,
      arm: e.arm ? Number(e.arm) : undefined,
      calf: e.calf ? Number(e.calf) : undefined,
    }));

    return { data: series };
  }

  private calcBmi(weight?: number, height?: number): number | undefined {
    if (!weight || !height) return undefined;
    const heightM = height / 100;
    return Math.round((weight / (heightM * heightM)) * 100) / 100;
  }

  private calcLeanMass(weight?: number, bodyFat?: number): number | null {
    if (!weight || !bodyFat) return null;
    return Math.round(weight * (1 - bodyFat / 100) * 100) / 100;
  }
}
