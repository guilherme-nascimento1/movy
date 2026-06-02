import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export enum LeadStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  DEMO = 'DEMO',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Maria Oliveira', description: 'Nome do lead' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '11999999999', description: 'WhatsApp com DDD' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'instagram', description: 'Origem: instagram, google, indicação, etc.' })
  @IsOptional() @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: LeadStage, example: LeadStage.NEW })
  @IsOptional() @IsEnum(LeadStage)
  stage?: LeadStage;

  @ApiPropertyOptional({ example: 'Interessada em pilates, pode fechar semana que vem' })
  @IsOptional() @IsString()
  notes?: string;

  // v4.4 — UTM Tracking
  @ApiPropertyOptional({ example: 'instagram', description: 'UTM source da campanha' })
  @IsOptional() @IsString()
  utmSource?: string;

  @ApiPropertyOptional({ example: 'paid', description: 'UTM medium' })
  @IsOptional() @IsString()
  utmMedium?: string;

  @ApiPropertyOptional({ example: 'junho-crossfit', description: 'UTM campaign' })
  @IsOptional() @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({ example: 'banner-vermelho', description: 'UTM content' })
  @IsOptional() @IsString()
  utmContent?: string;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

export class AssignLeadDto {
  @ApiProperty({ example: 'uuid-do-usuario', description: 'userId do responsável pelo lead' })
  @IsString() @IsNotEmpty()
  assignedTo!: string;
}

export class TrialLeadDto {
  @ApiProperty({ example: '2025-07-10T10:00:00Z', description: 'Data e hora da aula experimental' })
  @IsDateString()
  trialClassAt!: string;

  @ApiPropertyOptional({ example: true, description: 'Se o lead compareceu à aula experimental' })
  @IsOptional() @IsBoolean()
  attended?: boolean;
}
