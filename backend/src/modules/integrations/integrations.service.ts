import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async handleWellhub(payload: unknown, signature: string): Promise<object> {
    this.logger.log(`Wellhub webhook recebido: sig=${signature}`);
    const body = payload as { event?: string; user?: { document?: string }; gymId?: string; checkinAt?: string };

    if (body.event !== 'checkin') return { received: true };

    await this.registerExternalCheckin('WELLHUB', body.user?.document, body.checkinAt);
    return { received: true };
  }

  async handleTotalPass(payload: unknown, token: string): Promise<object> {
    this.logger.log(`TotalPass webhook recebido: token=${token?.slice(0, 8)}...`);
    const body = payload as { type?: string; cpf?: string; timestamp?: string };

    if (body.type !== 'CHECK_IN') return { received: true };

    await this.registerExternalCheckin('TOTALPASS', body.cpf, body.timestamp);
    return { received: true };
  }

  async handleTurnstile(payload: unknown): Promise<object> {
    const body = payload as { tenantId?: string; cpf?: string; event?: string; timestamp?: string; deviceId?: string };
    this.logger.log(`Catraca: tenant=${body.tenantId}, event=${body.event}`);

    if (!body.tenantId || body.event !== 'ACCESS_GRANTED') return { received: true };

    const student = body.cpf
      ? await this.prisma.student.findFirst({ where: { tenantId: body.tenantId, cpf: body.cpf } })
      : null;

    this.logger.log(student ? `Acesso: ${student.name}` : 'Aluno não encontrado para CPF recebido');
    return { received: true, studentFound: !!student };
  }

  private async registerExternalCheckin(source: string, cpf?: string, timestamp?: string): Promise<void> {
    if (!cpf) return;

    const cleanCpf = cpf.replace(/\D/g, '');
    const student = await this.prisma.student.findFirst({ where: { cpf: cleanCpf } });

    if (!student) {
      this.logger.warn(`${source}: aluno não encontrado para CPF ${cleanCpf}`);
      return;
    }

    this.logger.log(`${source} check-in: ${student.name} (${student.tenantId})`);
  }
}
