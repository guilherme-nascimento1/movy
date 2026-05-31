import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SendPushDto } from './dto/push-notification.dto';
import { NotificationsService } from './notifications.service';
import { NotificationListResponseDto, NotificationStatsResponseDto } from './dto/notification-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';
import { NotifChannel, NotifStatus } from '../../common/enums';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Listar notificações', description: 'Histórico paginado de notificações enviadas ou pendentes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: NotifStatus, description: 'Filtrar por status' })
  @ApiQuery({ name: 'channel', required: false, enum: NotifChannel, description: 'Filtrar por canal' })
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { status?: string; channel?: string },
  ): Promise<object> {
    return this.notificationsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Estatísticas de notificações', description: 'Contagem total por status: enviadas, pendentes e com falha' })
  @ApiResponse({ status: 200, type: NotificationStatsResponseDto })
  @Get('stats')
  getStats(@TenantId() tenantId: string): Promise<object> {
    return this.notificationsService.getStats(tenantId);
  }

  @ApiOperation({
    summary: 'Enviar push notification',
    description: 'Disparo interno de push para apps mobile via Expo Push API. Registra em NotificationLog.',
  })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { sent: { type: 'number' }, total: { type: 'number' } } } } } })
  @Post('push')
  sendPush(
    @TenantId() tenantId: string,
    @Body() dto: SendPushDto,
  ): Promise<object> {
    return this.notificationsService.sendPush(tenantId, dto);
  }

  @ApiOperation({
    summary: 'Enviar lembrete de pagamento',
    description: 'Cria NotificationLog com status PENDING para envio via WhatsApp. O worker processa em background.',
  })
  @ApiParam({ name: 'studentId', description: 'UUID do aluno' })
  @ApiParam({ name: 'paymentId', description: 'UUID da cobrança' })
  @ApiResponse({ status: 201, schema: { properties: { data: { description: 'NotificationLog criado com status PENDING' } } } })
  @Post('payment-reminder/:studentId/:paymentId')
  sendPaymentReminder(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Param('paymentId') paymentId: string,
  ): Promise<object> {
    return this.notificationsService.sendPaymentReminder(tenantId, studentId, paymentId);
  }
}
