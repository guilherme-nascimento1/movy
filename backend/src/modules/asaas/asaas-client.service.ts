import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AsaasCustomer {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasCharge {
  customer: string; // Asaas customer ID
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // nossa ID interna (paymentId)
}

export interface AsaasSubscription {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

@Injectable()
export class AsaasClientService {
  private readonly logger = new Logger(AsaasClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3';
    this.apiKey = this.config.get<string>('ASAAS_API_KEY') ?? '';
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) throw new InternalServerErrorException('Asaas não configurado');

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', access_token: this.apiKey },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await res.json()) as T & { errors?: { description: string }[] };

    if (!res.ok) {
      const msg = (data as { errors?: { description: string }[] }).errors?.[0]?.description ?? 'Erro Asaas';
      this.logger.error(`Asaas ${method} ${path} → ${res.status}: ${msg}`);
      throw new InternalServerErrorException(`Asaas: ${msg}`);
    }

    return data;
  }

  async createCustomer(data: AsaasCustomer): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', '/customers', data);
  }

  async findCustomerByCpf(cpfCnpj: string): Promise<{ data: { id: string }[] }> {
    return this.request<{ data: { id: string }[] }>('GET', `/customers?cpfCnpj=${cpfCnpj}`);
  }

  async createCharge(data: AsaasCharge): Promise<{ id: string; invoiceUrl?: string; bankSlipUrl?: string; pixQrCode?: { payload: string } }> {
    return this.request('POST', '/payments', data);
  }

  async getPixQrCode(chargeId: string): Promise<{ payload: string; expirationDate: string }> {
    return this.request('GET', `/payments/${chargeId}/pixQrCode`);
  }

  async createSubscription(data: AsaasSubscription): Promise<{ id: string }> {
    return this.request('POST', '/subscriptions', data);
  }

  async cancelCharge(chargeId: string): Promise<void> {
    await this.request('DELETE', `/payments/${chargeId}`);
  }

  async refundCharge(chargeId: string): Promise<void> {
    await this.request('POST', `/payments/${chargeId}/refund`);
  }
}
