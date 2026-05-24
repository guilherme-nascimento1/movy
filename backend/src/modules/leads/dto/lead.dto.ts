import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';
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
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}
