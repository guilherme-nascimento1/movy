import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Listar notificações', description: 'Retorna histórico paginado de notificações do tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SENT', 'FAILED'] })
  @ApiQuery({ name: 'channel', required: false, enum: ['WHATSAPP', 'EMAIL', 'PUSH'] })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { status?: string; channel?: string },
  ): Promise<object> {
    return this.notificationsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Estatísticas de notificações', description: 'Total de notificações por status' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  @Get('stats')
  getStats(@TenantId() tenantId: string): Promise<object> {
    return this.notificationsService.getStats(tenantId);
  }

  @ApiOperation({ summary: 'Enviar lembrete de pagamento', description: 'Cria notificação de lembrete de vencimento via WhatsApp' })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiParam({ name: 'paymentId', description: 'UUID do pagamento' })
  @ApiResponse({ status: 201, description: 'Notificação criada' })
  @Post('payment-reminder/:studentId/:paymentId')
  sendPaymentReminder(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Param('paymentId') paymentId: string,
  ): Promise<object> {
    return this.notificationsService.sendPaymentReminder(tenantId, studentId, paymentId);
  }
}
