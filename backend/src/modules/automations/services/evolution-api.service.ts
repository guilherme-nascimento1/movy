import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('EVOLUTION_API_URL') ?? '';
    this.apiKey = this.config.get<string>('EVOLUTION_API_KEY') ?? '';
    this.instanceName = this.config.get<string>('EVOLUTION_INSTANCE') ?? 'movy';
  }

  async sendText(phone: string, message: string): Promise<boolean> {
    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn('Evolution API não configurada — mensagem não enviada');
      return false;
    }

    const number = this.normalizePhone(phone);
    if (!number) {
      this.logger.warn(`Telefone inválido: ${phone}`);
      return false;
    }

    try {
      const res = await fetch(`${this.baseUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
        body: JSON.stringify({ number, text: message }),
      });

      if (!res.ok) {
        this.logger.error(`Evolution API erro ${res.status}: ${await res.text()}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Evolution API falhou: ${(err as Error).message}`);
      return false;
    }
  }

  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) return `55${digits}@s.whatsapp.net`;
    if (digits.length === 13 && digits.startsWith('55')) return `${digits}@s.whatsapp.net`;
    return null;
  }
}
