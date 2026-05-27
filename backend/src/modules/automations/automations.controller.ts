import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('automations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @ApiOperation({ summary: 'Status das filas BullMQ', description: 'Retorna contadores de jobs em espera, ativos e com falha' })
  @ApiResponse({ status: 200, schema: { properties: { data: { properties: { payments: {}, notifications: {} } } } } })
  @Get('queue-stats')
  getQueueStats(): Promise<object> {
    return this.automationsService.getQueueStats();
  }

  @ApiOperation({ summary: '[Admin] Marcar pagamentos vencidos', description: 'Dispara manualmente o job de marcação de OVERDUE' })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { queued: { type: 'number' } } } } } })
  @Post('trigger/mark-overdue')
  triggerMarkOverdue(): Promise<object> {
    return this.automationsService.runMarkOverdue().then((r) => ({ data: r }));
  }

  @ApiOperation({ summary: '[Admin] Régua de cobrança', description: 'Dispara manualmente as mensagens de cobrança (D-7, D-3, D0, D+3, D+7, D+15, D+30)' })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { queued: { type: 'number' } } } } } })
  @Post('trigger/payment-dunning')
  triggerPaymentDunning(): Promise<object> {
    return this.automationsService.runPaymentDunning().then((r) => ({ data: r }));
  }

  @ApiOperation({ summary: '[Admin] Alertas de vencimento de plano', description: 'Dispara alertas D-7 e D-3 para matrículas próximas do vencimento' })
  @Post('trigger/enrollment-expiry')
  triggerEnrollmentExpiry(): Promise<object> {
    return this.automationsService.runEnrollmentExpiryAlerts().then((r) => ({ data: r }));
  }

  @ApiOperation({ summary: '[Admin] Mensagens de aniversário', description: 'Dispara mensagens para alunos que fazem aniversário hoje' })
  @Post('trigger/birthdays')
  triggerBirthdays(): Promise<object> {
    return this.automationsService.runBirthdayGreetings().then((r) => ({ data: r }));
  }

  @ApiOperation({ summary: '[Admin] Alertas de ausência', description: 'Dispara alertas para alunos ausentes há 3, 7 ou 15 dias' })
  @Post('trigger/absence-alerts')
  triggerAbsenceAlerts(): Promise<object> {
    return this.automationsService.runAbsenceAlerts().then((r) => ({ data: r }));
  }
}
