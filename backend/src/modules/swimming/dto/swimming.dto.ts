import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateMedicalCertificateDto {
  @ApiProperty({ example: '2026-06-01', description: 'Data de vencimento do atestado médico (ISO 8601)' })
  @IsDateString()
  expiryDate: string;
}
