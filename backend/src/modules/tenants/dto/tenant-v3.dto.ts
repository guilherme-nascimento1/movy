import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsHexColor,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { BusinessModality } from '../../../common/enums';

export class OnboardingDto {
  @ApiProperty({ example: 'CrossFit Vila Madalena', description: 'Nome comercial da academia' })
  @IsString() @IsNotEmpty()
  businessName: string;

  @ApiProperty({ enum: BusinessModality, isArray: true, example: ['CROSSFIT'], description: 'Modalidades da academia (1 a N)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(BusinessModality, { each: true })
  modalities: BusinessModality[];

  @ApiPropertyOptional({ example: 'Atleta', description: 'Como chamar alunos na interface' })
  @IsOptional() @IsString()
  termForStudent?: string;

  @ApiPropertyOptional({ example: 'WOD', description: 'Como chamar aulas/treinos na interface' })
  @IsOptional() @IsString()
  termForClass?: string;

  @ApiPropertyOptional({ example: 'Coach', description: 'Como chamar instrutores na interface' })
  @IsOptional() @IsString()
  termForInstructor?: string;

  @ApiPropertyOptional({ example: '#6366F1', description: 'Cor primária em hexadecimal' })
  @IsOptional() @IsHexColor()
  primaryColor?: string;
}

export class UpdateModalitiesDto {
  @ApiProperty({ enum: BusinessModality, isArray: true, example: ['CROSSFIT', 'MUSCULACAO'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsEnum(BusinessModality, { each: true })
  modalities: BusinessModality[];
}

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({ example: 'Atleta' })
  @IsOptional() @IsString()
  termForStudent?: string;

  @ApiPropertyOptional({ example: 'WOD' })
  @IsOptional() @IsString()
  termForClass?: string;

  @ApiPropertyOptional({ example: 'Coach' })
  @IsOptional() @IsString()
  termForInstructor?: string;

  @ApiPropertyOptional({ example: '#6366F1' })
  @IsOptional() @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: ['alunos-ativos', 'receita', 'inadimplentes'], isArray: true })
  @IsOptional() @IsArray() @IsString({ each: true })
  dashboardModules?: string[];
}

export class TenantSettingsResponseDto {
  @ApiProperty({ example: 'uuid' }) id: string;
  @ApiProperty({ example: 'Atleta' }) termForStudent: string;
  @ApiProperty({ example: 'WOD' }) termForClass: string;
  @ApiProperty({ example: 'Coach' }) termForInstructor: string;
  @ApiProperty({ example: '#6366F1' }) primaryColor: string;
  @ApiProperty({ isArray: true, example: ['alunos-ativos', 'receita'] }) dashboardModules: string[];
}

export class TenantWithSettingsResponseDto {
  @ApiProperty({ example: 'uuid' }) id: string;
  @ApiProperty({ example: 'CrossFit Vila Madalena' }) name: string;
  @ApiProperty({ enum: BusinessModality, isArray: true }) modalities: BusinessModality[];
  @ApiProperty({ example: false }) onboardingComplete: boolean;
  @ApiProperty({ type: TenantSettingsResponseDto, nullable: true }) settings: TenantSettingsResponseDto | null;
  @ApiProperty({ isArray: true, example: ['dashboard', 'crossfit', 'checkins'] }) modulesEnabled: string[];
}

export class OnboardingCompleteResponseDto {
  @ApiProperty({ example: true }) onboardingComplete: boolean;
  @ApiProperty({ isArray: true }) modulesEnabled: string[];
}
