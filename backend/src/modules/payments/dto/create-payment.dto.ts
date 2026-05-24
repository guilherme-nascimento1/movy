import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID da matrícula' })
  @IsString() @IsNotEmpty()
  enrollmentId!: string;

  @ApiProperty({ example: 149.90 })
  @Type(() => Number)
  @IsNumber() @IsPositive()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.PIX })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: '2025-01-10', description: 'Data de vencimento' })
  @IsDateString()
  dueDate!: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional() @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2025-01-08', description: 'Data do pagamento efetivo' })
  @IsOptional() @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ example: 'copia-e-cola PIX' })
  @IsOptional() @IsString()
  pixCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  boletoUrl?: string;
}
