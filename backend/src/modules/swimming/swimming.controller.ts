import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SwimmingService } from './swimming.service';
import { UpdateMedicalCertificateDto } from './dto/swimming.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators';

@ApiTags('swimming')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('swimming')
export class SwimmingController {
  constructor(private readonly swimmingService: SwimmingService) {}

  @ApiOperation({ summary: 'Atualizar atestado médico do aluno', description: 'Define a data de vencimento do atestado (Natação e Boxe)' })
  @ApiParam({ name: 'studentId' })
  @ApiResponse({ status: 200, description: 'Atestado atualizado' })
  @Patch('students/:studentId/medical-certificate')
  updateMedicalCertificate(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateMedicalCertificateDto,
  ): Promise<object> {
    return this.swimmingService.updateMedicalCertificate(tenantId, studentId, dto.expiryDate);
  }

  @ApiOperation({ summary: 'Alunos com atestado vencendo', description: 'Lista alunos cujo atestado médico vence nos próximos N dias (default: 30)' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number, description: 'Dias à frente para verificar (default: 30)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('students/expiring-certificates')
  findExpiringCertificates(
    @TenantId() tenantId: string,
    @Query() query: PaginationDto & { daysAhead?: string },
  ): Promise<object> {
    return this.swimmingService.findExpiringCertificates(tenantId, query);
  }
}
