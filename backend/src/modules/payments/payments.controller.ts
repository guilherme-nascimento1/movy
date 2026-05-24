import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Registrar cobrança' })
  @ApiResponse({ status: 201, description: 'Cobrança registrada' })
  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePaymentDto): Promise<object> {
    return this.paymentsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Listar cobranças' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'enrollmentId', required: false })
  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: PaginationDto & { status?: string; enrollmentId?: string }): Promise<object> {
    return this.paymentsService.findAll(tenantId, query);
  }

  @ApiOperation({ summary: 'Listar cobranças em atraso' })
  @Get('overdue')
  findOverdue(@TenantId() tenantId: string, @Query() query: PaginationDto): Promise<object> {
    return this.paymentsService.findOverdue(tenantId, query);
  }

  @ApiOperation({ summary: 'Buscar cobrança por ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.paymentsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Atualizar cobrança' })
  @ApiParam({ name: 'id' })
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePaymentDto): Promise<object> {
    return this.paymentsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Confirmar pagamento (baixa manual)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Pagamento confirmado' })
  @Patch(':id/confirm')
  confirm(@TenantId() tenantId: string, @Param('id') id: string): Promise<object> {
    return this.paymentsService.confirmPayment(tenantId, id);
  }
}
