import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class GenerateChargeDto {
  @ApiProperty({ example: 'uuid-do-pagamento', description: 'ID do pagamento interno' })
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @ApiProperty({ enum: ['PIX', 'BOLETO'], example: 'PIX', description: 'Método de cobrança' })
  @IsIn(['PIX', 'BOLETO'])
  billingType!: 'PIX' | 'BOLETO';
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-da-matricula' })
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  @ApiProperty({ enum: ['PIX', 'BOLETO'], example: 'BOLETO' })
  @IsIn(['PIX', 'BOLETO'])
  billingType!: 'PIX' | 'BOLETO';

  @ApiPropertyOptional({ enum: ['MONTHLY', 'WEEKLY', 'YEARLY'], example: 'MONTHLY', description: 'Ciclo de cobrança' })
  @IsOptional()
  @IsIn(['MONTHLY', 'WEEKLY', 'YEARLY'])
  cycle?: 'MONTHLY' | 'WEEKLY' | 'YEARLY' = 'MONTHLY';
}

export class AsaasWebhookDto {
  @ApiProperty({ example: 'PAYMENT_RECEIVED' })
  event!: string;

  @ApiProperty()
  payment!: {
    id: string;
    status: string;
    externalReference: string;
    value: number;
    paymentDate?: string;
  };
}
