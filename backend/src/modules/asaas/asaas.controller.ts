import { Controller, Post, Body, UseGuards, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AsaasService } from './asaas.service';
import { GenerateChargeDto, CreateSubscriptionDto } from './dto/asaas.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';
import type { Request } from 'express';

@ApiTags('asaas')
@Controller('asaas')
export class AsaasController {
  constructor(private readonly asaasService: AsaasService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gerar cobrança PIX ou Boleto', description: 'Cria a cobrança no Asaas e retorna o pixCode (copia e cola) ou boletoUrl' })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { pixCode: { type: 'string' }, boletoUrl: { type: 'string' } } } } } })
  @ApiResponse({ status: 400, description: 'Aluno sem CPF ou pagamento já quitado' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @Post('charges')
  generateCharge(@TenantId() tenantId: string, @Body() dto: GenerateChargeDto): Promise<object> {
    return this.asaasService.generateCharge(tenantId, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar assinatura recorrente', description: 'Cria cobrança recorrente mensal via PIX ou boleto para uma matrícula' })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { subscriptionId: { type: 'string' } } } } } })
  @Post('subscriptions')
  createSubscription(@TenantId() tenantId: string, @Body() dto: CreateSubscriptionDto): Promise<object> {
    return this.asaasService.createSubscription(tenantId, dto);
  }

  @ApiOperation({
    summary: 'Webhook Asaas',
    description: 'Endpoint público para receber eventos do Asaas. Configure em: Asaas → Configurações → Webhooks → URL deste endpoint',
  })
  @ApiResponse({ status: 200 })
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Headers('asaas-access-token') token: string): Promise<{ received: boolean }> {
    await this.asaasService.handleWebhook(req.body);
    return { received: true };
  }
}
