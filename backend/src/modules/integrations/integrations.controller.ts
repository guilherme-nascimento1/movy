import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import type { Request } from 'express';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @ApiOperation({
    summary: 'Webhook Wellhub (Gympass)',
    description: 'Recebe check-ins de usuários Wellhub. Configure em: Wellhub Partner Portal → Webhooks',
  })
  @ApiResponse({ status: 200 })
  @Post('webhooks/wellhub')
  wellhubWebhook(@Req() req: Request, @Headers('x-wellhub-signature') signature: string): Promise<object> {
    return this.integrationsService.handleWellhub(req.body as unknown, signature);
  }

  @ApiOperation({
    summary: 'Webhook TotalPass',
    description: 'Recebe check-ins de usuários TotalPass. Configure em: TotalPass Partner → Integrações',
  })
  @ApiResponse({ status: 200 })
  @Post('webhooks/totalpass')
  totalpassWebhook(@Req() req: Request, @Headers('x-totalpass-token') token: string): Promise<object> {
    return this.integrationsService.handleTotalPass(req.body as unknown, token);
  }

  @ApiOperation({
    summary: 'Webhook Catraca',
    description: 'Recebe eventos de acesso de catracas integradas (entrada/saída)',
  })
  @ApiResponse({ status: 200 })
  @Post('webhooks/turnstile')
  turnstileWebhook(@Req() req: Request): Promise<object> {
    return this.integrationsService.handleTurnstile(req.body as unknown);
  }
}
