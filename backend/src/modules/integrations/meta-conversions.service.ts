import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MetaUserData {
  em?: string;   // email (SHA-256)
  ph?: string;   // phone (SHA-256)
  fn?: string;   // first name (SHA-256)
}

@Injectable()
export class MetaConversionsService {
  private readonly logger = new Logger(MetaConversionsService.name);

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {}

  async sendPurchaseEvent(opts: {
    value: number;
    currency?: string;
    userEmail?: string | null;
    userPhone?: string | null;
    userName?: string | null;
    orderId?: string;
  }): Promise<void> {
    await this.sendEvent('Purchase', {
      value: opts.value,
      currency: opts.currency ?? 'BRL',
      order_id: opts.orderId,
    }, opts);
  }

  async sendLeadEvent(opts: {
    userEmail?: string | null;
    userPhone?: string | null;
    userName?: string | null;
    utmSource?: string | null;
    utmCampaign?: string | null;
  }): Promise<void> {
    await this.sendEvent('Lead', {}, opts);
  }

  private async sendEvent(
    eventName: string,
    customData: Record<string, unknown>,
    user: { userEmail?: string | null; userPhone?: string | null; userName?: string | null },
  ): Promise<void> {
    const pixelId = this.config.get<string>('META_PIXEL_ID');
    const accessToken = this.config.get<string>('META_ACCESS_TOKEN');

    if (!pixelId || !accessToken) {
      this.logger.debug('META_PIXEL_ID ou META_ACCESS_TOKEN não configurados — evento ignorado');
      return;
    }

    const userData: MetaUserData = {};
    if (user.userEmail) userData.em = await this.hash(user.userEmail.toLowerCase().trim());
    if (user.userPhone) userData.ph = await this.hash(user.userPhone.replace(/\D/g, ''));
    if (user.userName) userData.fn = await this.hash(user.userName.split(' ')[0].toLowerCase().trim());

    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: customData,
      }],
    };

    try {
      await firstValueFrom(
        this.http.post(
          `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
          payload,
        ),
      );
      this.logger.log(`Meta Conversions: evento ${eventName} enviado`);
    } catch (err) {
      this.logger.warn(`Meta Conversions: falha ao enviar ${eventName} — ${(err as Error).message}`);
    }
  }

  private async hash(value: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(value).digest('hex');
  }
}
