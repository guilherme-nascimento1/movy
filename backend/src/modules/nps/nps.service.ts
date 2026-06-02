import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNpsDto } from './dto/nps.dto';

@Injectable()
export class NpsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateNpsDto): Promise<object> {
    const response = await this.prisma.npsResponse.create({
      data: { tenantId, ...dto },
    });
    return { data: response };
  }

  async getReport(tenantId: string): Promise<object> {
    const responses = await this.prisma.npsResponse.findMany({
      where: { tenantId },
      select: { score: true, comment: true, createdAt: true },
    });

    if (responses.length === 0) {
      return { data: { averageScore: 0, npsScore: 0, distribution: { promoters: 0, passives: 0, detractors: 0 }, recentComments: [] } };
    }

    const total = responses.length;
    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score <= 6).length;

    const averageScore = responses.reduce((sum, r) => sum + r.score, 0) / total;
    const npsScore = Math.round(((promoters - detractors) / total) * 100);

    const recentComments = responses
      .filter((r) => r.comment)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      data: {
        averageScore: Math.round(averageScore * 10) / 10,
        npsScore,
        distribution: {
          promoters: Math.round((promoters / total) * 100),
          passives: Math.round((passives / total) * 100),
          detractors: Math.round((detractors / total) * 100),
        },
        recentComments,
      },
    };
  }
}
