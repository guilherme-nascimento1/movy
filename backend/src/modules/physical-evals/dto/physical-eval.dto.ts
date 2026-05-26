import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsPositive,
  IsObject,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export const EVAL_PROTOCOLS = ['POLLOCK_3', 'POLLOCK_7', 'JACKSON_POLLOCK', 'DURNIN_WOMERSLEY'] as const;

export class CreatePhysicalEvalDto {
  @ApiProperty({ example: 'uuid-do-aluno', description: 'UUID do aluno' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiPropertyOptional({ example: '2025-06-01T10:00:00Z', description: 'Data da avaliação (default: agora)' })
  @IsOptional()
  @IsDateString()
  evaluatedAt?: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:00:00Z', description: 'Data da próxima avaliação agendada' })
  @IsOptional()
  @IsDateString()
  nextEvalAt?: string;

  // Anamnese
  @ApiPropertyOptional({ example: 'Perda de gordura e ganho de massa', description: 'Objetivos do aluno' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({
    example: { diabetes: false, hypertension: true, surgeries: 'Apendicite 2018' },
    description: 'Histórico de saúde (objeto livre)',
  })
  @IsOptional()
  @IsObject()
  healthHistory?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false },
    description: 'Respostas do PAR-Q (7 perguntas)',
  })
  @IsOptional()
  @IsObject()
  parqAnswers?: Record<string, unknown>;

  // Protocolo
  @ApiPropertyOptional({ enum: EVAL_PROTOCOLS, example: 'POLLOCK_3', description: 'Protocolo usado para cálculo de dobras' })
  @IsOptional()
  @IsIn(EVAL_PROTOCOLS)
  protocol?: string;

  // Composição corporal
  @ApiPropertyOptional({ example: 75.5, description: 'Peso em kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ example: 175.0, description: 'Altura em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  @ApiPropertyOptional({ example: 18.5, description: 'Percentual de gordura corporal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(80)
  bodyFat?: number;

  @ApiPropertyOptional({ example: 61.6, description: 'Massa magra em kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  leanMass?: number;

  // Circunferências (cm)
  @ApiPropertyOptional({ example: 82.5, description: 'Cintura em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  waist?: number;

  @ApiPropertyOptional({ example: 98.0, description: 'Quadril em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  hip?: number;

  @ApiPropertyOptional({ example: 95.0, description: 'Tórax em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  chest?: number;

  @ApiPropertyOptional({ example: 85.0, description: 'Abdômen em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  abdomen?: number;

  @ApiPropertyOptional({ example: 58.0, description: 'Coxa em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  thigh?: number;

  @ApiPropertyOptional({ example: 35.0, description: 'Braço em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  arm?: number;

  @ApiPropertyOptional({ example: 38.0, description: 'Panturrilha em cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  calf?: number;

  // Dobras cutâneas (mm)
  @ApiPropertyOptional({ example: 12.5, description: 'Dobra peitoral (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldChest?: number;

  @ApiPropertyOptional({ example: 18.0, description: 'Dobra abdominal (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldAbdomen?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Dobra da coxa (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldThigh?: number;

  @ApiPropertyOptional({ example: 14.0, description: 'Dobra do tríceps (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldTricep?: number;

  @ApiPropertyOptional({ example: 11.0, description: 'Dobra subescapular (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldSubscapular?: number;

  @ApiPropertyOptional({ example: 16.5, description: 'Dobra suprailíaca (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldSuprailiac?: number;

  @ApiPropertyOptional({ example: 13.0, description: 'Dobra axilar média (mm)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  skinfoldAxillary?: number;

  // Sinais vitais
  @ApiPropertyOptional({ example: '120/80', description: 'Pressão arterial (sistólica/diastólica)' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 68, description: 'Frequência cardíaca de repouso (bpm)' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(220)
  @Type(() => Number)
  restingHR?: number;

  @ApiPropertyOptional({ example: 'Aluno bem disposto, sem queixas' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: ['https://r2.movy.app/photos/eval-front.jpg'],
    description: 'URLs das fotos posturais (array de strings)',
  })
  @IsOptional()
  photos?: string[];
}

export class UpdatePhysicalEvalDto extends CreatePhysicalEvalDto {
  studentId: string = undefined as unknown as string;
}
