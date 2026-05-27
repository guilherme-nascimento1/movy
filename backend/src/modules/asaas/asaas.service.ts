import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasClientService } from './asaas-client.service';
import { GenerateChargeDto, CreateSubscriptionDto } from './dto/asaas.dto';
import { PaymentStatus } from '../../common/enums';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(
    private prisma: PrismaService,
    private asaas: AsaasClientService,
  ) {}

  async generateCharge(tenantId: string, dto: GenerateChargeDto): Promise<object> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, tenantId },
      include: { enrollment: { include: { student: true, plan: true } } },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === PaymentStatus.PAID) throw new BadRequestException('Pagamento já quitado');
    if (!payment.enrollment.student.cpf) throw new BadRequestException('Aluno sem CPF cadastrado — necessário para gerar cobrança');

    const asaasCustomerId = await this.getOrCreateCustomer(payment.enrollment.student);

    const charge = await this.asaas.createCharge({
      customer: asaasCustomerId,
      billingType: dto.billingType,
      value: Number(payment.amount),
      dueDate: payment.dueDate.toISOString().split('T')[0],
      description: `Plano ${payment.enrollment.plan.name} — Movy`,
      externalReference: payment.id,
    });

    let pixCode: string | undefined;
    let boletoUrl: string | undefined;

    if (dto.billingType === 'PIX') {
      const qr = await this.asaas.getPixQrCode(charge.id);
      pixCode = qr.payload;
    } else {
      boletoUrl = charge.bankSlipUrl ?? charge.invoiceUrl;
    }

    const updated = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: { externalId: charge.id, pixCode, boletoUrl },
    });

    return { data: updated };
  }

  async createSubscription(tenantId: string, dto: CreateSubscriptionDto): Promise<object> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, tenantId },
      include: { student: true, plan: true },
    });

    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    if (!enrollment.student.cpf) throw new BadRequestException('Aluno sem CPF cadastrado');

    const asaasCustomerId = await this.getOrCreateCustomer(enrollment.student);

    const subscription = await this.asaas.createSubscription({
      customer: asaasCustomerId,
      billingType: dto.billingType,
      value: Number(enrollment.plan.price),
      nextDueDate: enrollment.startDate.toISOString().split('T')[0],
      cycle: dto.cycle ?? 'MONTHLY',
      description: `Assinatura ${enrollment.plan.name} — Movy`,
      externalReference: enrollment.id,
    });

    this.logger.log(`Assinatura Asaas criada: ${subscription.id} para matrícula ${enrollment.id}`);
    return { data: { subscriptionId: subscription.id, enrollmentId: enrollment.id } };
  }

  async handleWebhook(payload: unknown): Promise<void> {
    const wh = payload as { event: string; payment?: { id: string; status: string; externalReference?: string; paymentDate?: string; value?: number } };

    if (!wh.event || !wh.payment) return;

    const { event, payment } = wh;
    this.logger.log(`Webhook Asaas: ${event} → externalRef=${payment.externalReference}`);

    const internalPaymentId = payment.externalReference;
    if (!internalPaymentId) return;

    const statusMap: Record<string, PaymentStatus> = {
      PAYMENT_RECEIVED: PaymentStatus.PAID,
      PAYMENT_CONFIRMED: PaymentStatus.PAID,
      PAYMENT_OVERDUE: PaymentStatus.OVERDUE,
      PAYMENT_REFUNDED: PaymentStatus.REFUNDED,
      PAYMENT_DELETED: PaymentStatus.CANCELLED,
      PAYMENT_CANCELLED: PaymentStatus.CANCELLED,
    };

    const newStatus = statusMap[event];
    if (!newStatus) return;

    await this.prisma.payment.updateMany({
      where: { id: internalPaymentId },
      data: {
        status: newStatus,
        ...(newStatus === PaymentStatus.PAID && {
          paidAt: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        }),
      },
    });

    this.logger.log(`Pagamento ${internalPaymentId} atualizado para ${newStatus}`);
  }

  private async getOrCreateCustomer(student: { id: string; name: string; cpf?: string | null; email?: string | null; phone?: string | null }): Promise<string> {
    if (!student.cpf) throw new BadRequestException('CPF do aluno é obrigatório para o Asaas');

    const existing = await this.asaas.findCustomerByCpf(student.cpf);
    if (existing.data.length > 0) return existing.data[0].id;

    const created = await this.asaas.createCustomer({
      name: student.name,
      cpfCnpj: student.cpf.replace(/\D/g, ''),
      email: student.email ?? undefined,
      mobilePhone: student.phone?.replace(/\D/g, '') ?? undefined,
    });

    return created.id;
  }
}
