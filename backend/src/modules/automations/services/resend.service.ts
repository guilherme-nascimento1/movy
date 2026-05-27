import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.fromAddress = this.config.get<string>('RESEND_FROM') ?? 'Movy <noreply@movy.com.br>';
  }

  async send(opts: SendEmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Resend não configurado — e-mail não enviado');
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ from: this.fromAddress, to: opts.to, subject: opts.subject, html: opts.html }),
      });

      if (!res.ok) {
        this.logger.error(`Resend erro ${res.status}: ${await res.text()}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Resend falhou: ${(err as Error).message}`);
      return false;
    }
  }
}
