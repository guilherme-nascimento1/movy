import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, CreateGoalDto, UpdateGoalProgressDto } from './dto/team.dto';
import { UserRole } from '../../common/enums';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  // ── Team Members ────────────────────────────────────────
  async create(tenantId: string, dto: CreateTeamMemberDto): Promise<object> {
    const existing = await this.prisma.teamMember.findFirst({ where: { tenantId, userId: dto.userId } });
    if (existing) throw new ConflictException('Usuário já é membro da equipe');

    const member = await this.prisma.teamMember.create({
      data: { tenantId, ...dto, role: dto.role as UserRole },
    });
    return { data: member };
  }

  async findAll(tenantId: string): Promise<object> {
    const members = await this.prisma.teamMember.findMany({
      where: { tenantId, active: true },
      include: { goals: { where: { achieved: false } } },
      orderBy: { name: 'asc' },
    });
    return { data: members };
  }

  async findOne(tenantId: string, id: string): Promise<object> {
    const member = await this.prisma.teamMember.findFirst({
      where: { id, tenantId, active: true },
      include: { goals: true },
    });
    if (!member) throw new NotFoundException('Membro da equipe não encontrado');
    return { data: member };
  }

  async update(tenantId: string, id: string, dto: UpdateTeamMemberDto): Promise<object> {
    await this.findOne(tenantId, id);
    const { role, ...rest } = dto;
    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: { ...rest, ...(role && { role: role as UserRole }) },
    });
    return { data: updated };
  }

  async remove(tenantId: string, id: string): Promise<object> {
    await this.findOne(tenantId, id);
    await this.prisma.teamMember.update({ where: { id }, data: { active: false } });
    return { data: { message: 'Membro removido da equipe' } };
  }

  // ── Goals ───────────────────────────────────────────────
  async createGoal(tenantId: string, memberId: string, dto: CreateGoalDto): Promise<object> {
    await this.findOne(tenantId, memberId);
    const goal = await this.prisma.teamGoal.create({
      data: { tenantId, memberId, ...dto, dueDate: new Date(dto.dueDate) },
    });
    return { data: goal };
  }

  async updateGoalProgress(tenantId: string, goalId: string, dto: UpdateGoalProgressDto): Promise<object> {
    const goal = await this.prisma.teamGoal.findFirst({ where: { id: goalId, tenantId } });
    if (!goal) throw new NotFoundException('Meta não encontrada');

    const achieved = dto.currentValue >= Number(goal.targetValue);
    const updated = await this.prisma.teamGoal.update({
      where: { id: goalId },
      data: { currentValue: dto.currentValue, achieved },
    });
    return { data: updated };
  }

  async getMemberGoals(tenantId: string, memberId: string): Promise<object> {
    await this.findOne(tenantId, memberId);
    const goals = await this.prisma.teamGoal.findMany({
      where: { tenantId, memberId },
      orderBy: { dueDate: 'asc' },
    });
    return { data: goals };
  }
}
