import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class PhysicalEvalDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'uuid' }) studentId!: string;
  @ApiProperty({ example: '2025-06-01T10:00:00.000Z' }) evaluatedAt!: string;
  @ApiPropertyOptional({ example: '2025-09-01T10:00:00.000Z' }) nextEvalAt?: string;
  @ApiPropertyOptional({ example: 'uuid-do-avaliador' }) evaluatedBy?: string;

  // Anamnese
  @ApiPropertyOptional({ example: 'Perda de gordura e ganho de massa' }) objectives?: string;
  @ApiPropertyOptional({ example: { diabetes: false, hypertension: true } }) healthHistory?: Record<string, unknown>;
  @ApiPropertyOptional({ example: { q1: false, q2: false } }) parqAnswers?: Record<string, unknown>;

  // Protocolo
  @ApiPropertyOptional({ example: 'POLLOCK_3' }) protocol?: string;

  // Composição corporal
  @ApiPropertyOptional({ example: 75.5 }) weight?: number;
  @ApiPropertyOptional({ example: 175.0 }) height?: number;
  @ApiPropertyOptional({ example: 24.7 }) bmi?: number;
  @ApiPropertyOptional({ example: 18.5 }) bodyFat?: number;
  @ApiPropertyOptional({ example: 61.6 }) leanMass?: number;

  // Circunferências
  @ApiPropertyOptional({ example: 82.5 }) waist?: number;
  @ApiPropertyOptional({ example: 98.0 }) hip?: number;
  @ApiPropertyOptional({ example: 95.0 }) chest?: number;
  @ApiPropertyOptional({ example: 85.0 }) abdomen?: number;
  @ApiPropertyOptional({ example: 58.0 }) thigh?: number;
  @ApiPropertyOptional({ example: 35.0 }) arm?: number;
  @ApiPropertyOptional({ example: 38.0 }) calf?: number;

  // Dobras cutâneas
  @ApiPropertyOptional({ example: 12.5 }) skinfoldChest?: number;
  @ApiPropertyOptional({ example: 18.0 }) skinfoldAbdomen?: number;
  @ApiPropertyOptional({ example: 15.0 }) skinfoldThigh?: number;
  @ApiPropertyOptional({ example: 14.0 }) skinfoldTricep?: number;
  @ApiPropertyOptional({ example: 11.0 }) skinfoldSubscapular?: number;
  @ApiPropertyOptional({ example: 16.5 }) skinfoldSuprailiac?: number;
  @ApiPropertyOptional({ example: 13.0 }) skinfoldAxillary?: number;

  // Sinais vitais
  @ApiPropertyOptional({ example: '120/80' }) bloodPressure?: string;
  @ApiPropertyOptional({ example: 68 }) restingHR?: number;

  @ApiPropertyOptional({ example: 'Aluno bem disposto' }) notes?: string;
  @ApiPropertyOptional({ example: ['https://r2.movy.app/photos/eval-front.jpg'] }) photos?: string[];
}

export class PhysicalEvalResponseDto {
  @ApiProperty({ type: PhysicalEvalDto }) data!: PhysicalEvalDto;
}

export class PhysicalEvalListResponseDto {
  @ApiProperty({ type: [PhysicalEvalDto] }) data!: PhysicalEvalDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class EvolutionPointDto {
  @ApiProperty({ example: '2025-01-15' }) date!: string;
  @ApiPropertyOptional({ example: 75.5 }) weight?: number;
  @ApiPropertyOptional({ example: 18.5 }) bodyFat?: number;
  @ApiPropertyOptional({ example: 61.6 }) leanMass?: number;
  @ApiPropertyOptional({ example: 24.7 }) bmi?: number;
  @ApiPropertyOptional({ example: 82.5 }) waist?: number;
  @ApiPropertyOptional({ example: 98.0 }) hip?: number;
}

export class EvolutionResponseDto {
  @ApiProperty({ type: [EvolutionPointDto], description: 'Série temporal para gráficos de evolução' })
  data!: EvolutionPointDto[];
}
