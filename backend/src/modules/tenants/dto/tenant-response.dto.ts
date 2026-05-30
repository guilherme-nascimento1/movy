import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan } from '../../../common/enums';

export class TenantDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CrossFit Alpha' }) name!: string;
  @ApiProperty({ example: 'crossfit-alpha' }) slug!: string;
  @ApiProperty({ enum: TenantPlan, example: TenantPlan.STARTER }) plan!: TenantPlan;
  @ApiProperty({ example: {} }) settings!: object;
  @ApiProperty({ example: true }) active!: boolean;
  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' }) trialEndsAt?: string;
  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) updatedAt!: string;

  // Dados da academia
  @ApiPropertyOptional({ example: '11999999999' }) phone?: string;
  @ApiPropertyOptional({ example: 'contato@academia.com.br' }) email?: string;
  @ApiPropertyOptional({ example: '12.345.678/0001-99' }) cnpj?: string;
  @ApiPropertyOptional({ example: 'Rua das Flores, 123' }) address?: string;
  @ApiPropertyOptional({ example: 'São Paulo' }) city?: string;
  @ApiPropertyOptional({ example: 'SP' }) state?: string;
  @ApiPropertyOptional({ example: '01310-100' }) zipCode?: string;
  @ApiPropertyOptional({ example: 'https://storage.movy.com.br/logos/abc.png' }) logoUrl?: string;
  @ApiPropertyOptional({ example: 'https://academia.com.br' }) website?: string;
  @ApiPropertyOptional({ example: '@crossfitalpha' }) instagram?: string;
  @ApiPropertyOptional({ example: '11999999999' }) whatsappNumber?: string;
  @ApiPropertyOptional({ example: 'Seg–Sex 06h–22h | Sáb 08h–14h' }) businessHours?: string;
}

export class TenantResponseDto {
  @ApiProperty({ type: TenantDto }) data!: TenantDto;
}
