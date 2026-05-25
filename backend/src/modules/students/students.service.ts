import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStudentDto): Promise<object> {
    if (dto.cpf) {
      const cpfExists = await this.prisma.student.findFirst({ where: { tenantId, cpf: dto.cpf } });
      if (cpfExists) throw new ConflictException('CPF já cadastrado nesta academia');
    }

    const student = await this.prisma.student.create({
      data: { tenantId, ...dto, birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined },
    });
    return { data: student };
  }

  async findAll(tenantId: string, query: StudentQueryDto): Promise<object> {
    const { page = 1, limit = 20, search } = query;
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    const status = validStatuses.includes(query.status as string) ? query.status : undefined;
    const skip = (page - 1) * (Number(limit) || 20);
    const take = Math.min(Number(limit) || 20, 100);

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.student.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
      include: {
        enrollments: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return { data: student };
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto): Promise<object> {
    await this.findOne(tenantId, id);
    const student = await this.prisma.student.update({
      where: { id },
      data: { ...dto, birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined },
    });
    return { data: student };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    await this.findOne(tenantId, id);
    await this.prisma.student.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { data: { message: 'Aluno inativado com sucesso' } };
  }
}
