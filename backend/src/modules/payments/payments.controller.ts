import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto, PaymentListResponseDto } from './dto/payment-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';
import { PaymentMethod, PaymentStatus } from '../../common/enums';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Registrar cobrança', description: 'Cria nova cobrança vinculada a uma matrícula' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Matrícula não encontrada' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePaymentDto): Promise<object> {
    return this.paymentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar cobranças', description: 'Lista paginada com filtros por status e matrícula' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Filtrar por status' })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod, description: 'Filtrar por método de pagamento' })
  @ApiQuery({ name: 'enrollmentId', required: false, type: String, description: 'Filtrar por matrícula' })
  @ApiResponse({ status: 200, type: PaymentListResponseDto })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto & { status?: string; enrollmentId?: string }): Promise<object> {
    return this.paymentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Cobranças em atraso', description: 'Lista cobranças PENDING com dueDate no passado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaymentListResponseDto })
  @Get('overdue')
  findOverdue(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.paymentsService.findOverdue(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar cobrança por ID' })
  @ApiParam({ name: 'id', description: 'UUID da cobrança' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.paymentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar cobrança', description: 'Atualiza status, pixCode ou boletoUrl' })
  @ApiParam({ name: 'id', description: 'UUID da cobrança' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePaymentDto): Promise<object> {
    return this.paymentsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Confirmar pagamento', description: 'Baixa manual: seta status=PAID e paidAt=agora' })
  @ApiParam({ name: 'id', description: 'UUID da cobrança' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @Patch(':id/confirm')
  confirm(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.paymentsService.confirmPayment(tenantId, id);
  }
}
