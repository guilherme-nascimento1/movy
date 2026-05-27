import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsIn, IsBoolean, IsNumber, IsPositive } from 'class-validator';

export const WOD_TYPES = ['FOR_TIME', 'AMRAP', 'EMOM', 'TABATA', 'STRENGTH', 'CUSTOM'] as const;
export const SCORE_TYPES = ['TIME', 'REPS', 'WEIGHT', 'ROUNDS'] as const;

export class CreateWodDto {
  @ApiProperty({ example: '2025-06-01', description: 'Data do WOD (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'WOD #142 — Heavy Day' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '5 Rounds: 10 Thrusters 40kg, 10 Pull-ups, 200m Run' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: WOD_TYPES, example: 'FOR_TIME' })
  @IsIn(WOD_TYPES)
  wodType!: string;

  @ApiPropertyOptional({ example: 1200, description: 'Time cap em segundos (opcional)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  timeCapSecs?: number;

  @ApiPropertyOptional({ example: 5, description: 'Número de rounds (para AMRAP/EMOM)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  rounds?: number;
}

export class CreateWodResultDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: '14:32', description: 'Score do aluno (tempo, reps, kg)' })
  @IsString()
  @IsNotEmpty()
  score!: string;

  @ApiProperty({ enum: SCORE_TYPES, example: 'TIME' })
  @IsIn(SCORE_TYPES)
  scoreType!: string;

  @ApiPropertyOptional({ example: true, description: 'Rx (true) ou Scaled (false)' })
  @IsOptional()
  @IsBoolean()
  rx?: boolean;

  @ApiPropertyOptional({ example: 'Subiu os pesos, ótimo desempenho!' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePersonalRecordDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 'uuid-do-exercicio' })
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty({ example: 120.5, description: 'Valor do PR' })
  @IsNumber()
  @IsPositive()
  value!: number;

  @ApiProperty({ example: 'kg', description: 'Unidade: kg, reps, seconds, meters' })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiPropertyOptional({ example: 'Novo recorde pessoal no Deadlift!' })
  @IsOptional()
  @IsString()
  notes?: string;
}
