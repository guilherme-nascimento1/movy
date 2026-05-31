import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateWorkoutDto, CreateExerciseDto } from './dto/workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async createExercise(tenantId: string, dto: CreateExerciseDto): Promise<object> {
    const exercise = await this.prisma.exercise.create({
      data: { tenantId, ...dto },
    });
    return { data: exercise };
  }

  async getExerciseMedia(tenantId: string, id: string): Promise<object> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, gifUrl: true, videoUrl: true, thumbnailUrl: true },
    });
    if (!exercise) throw new NotFoundException('Exercício não encontrado');
    return { data: exercise };
  }

  async findAllExercises(tenantId: string, query: PaginationDto & { category?: string }): Promise<object> {
    const { category } = query;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const where = { tenantId, ...(category && { category }) };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.exercise.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.exercise.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async createWorkout(tenantId: string, createdBy: string, dto: CreateWorkoutDto): Promise<object> {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const workout = await this.prisma.workout.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        createdBy,
        name: dto.name,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            exerciseId: item.exerciseId,
            sets: item.sets,
            reps: item.reps,
            restSecs: item.restSecs,
            notes: item.notes,
            order: item.order,
          })),
        },
      },
      include: { items: { include: { exercise: true }, orderBy: { order: 'asc' } } },
    });

    return { data: workout };
  }

  async findByStudent(tenantId: string, studentId: string, query: PaginationDto): Promise<object> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const student = await this.prisma.student.findFirst({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const [data, total] = await this.prisma.$transaction([
      this.prisma.workout.findMany({
        where: { tenantId, studentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      }),
      this.prisma.workout.count({ where: { tenantId, studentId } }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const workout = await this.prisma.workout.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { exercise: true }, orderBy: { order: 'asc' } },
        student: true,
      },
    });
    if (!workout) throw new NotFoundException('Treino não encontrado');
    return { data: workout };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    const workout = await this.prisma.workout.findFirst({ where: { id, tenantId } });
    if (!workout) throw new NotFoundException('Treino não encontrado');

    await this.prisma.workout.delete({ where: { id } });
    return { data: { message: 'Treino removido com sucesso' } };
  }
}
