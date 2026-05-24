import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';

export class PaymentDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'uuid' }) enrollmentId!: string;
  @ApiProperty({ example: 149.90 }) amount!: number;
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX }) method!: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING }) status!: PaymentStatus;
  @ApiProperty({ example: '2025-01-10T00:00:00.000Z' }) dueDate!: string;
  @ApiPropertyOptional({ example: '2025-01-08T14:30:00.000Z' }) paidAt?: string;
  @ApiPropertyOptional({ example: 'asaas-charge-id' }) externalId?: string;
  @ApiPropertyOptional({ example: '00020126580014br.gov.bcb.pix...' }) pixCode?: string;
  @ApiPropertyOptional({ example: 'https://asaas.com/boleto/...' }) boletoUrl?: string;
  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' }) updatedAt!: string;
}

export class PaymentWithEnrollmentDto extends PaymentDto {
  @ApiPropertyOptional({
    example: { student: { name: 'Maria Oliveira' }, plan: { name: 'Plano Mensal' } },
  })
  enrollment?: object;
}

export class PaymentResponseDto {
  @ApiProperty({ type: PaymentWithEnrollmentDto }) data!: PaymentWithEnrollmentDto;
}

export class PaymentListResponseDto {
  @ApiProperty({ type: [PaymentWithEnrollmentDto] }) data!: PaymentWithEnrollmentDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
