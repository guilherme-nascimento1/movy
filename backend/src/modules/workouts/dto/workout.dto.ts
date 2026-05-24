import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkoutItemDto {
  @ApiProperty({ example: 'uuid-do-exercicio', description: 'UUID do exercício' })
  @IsString() @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty({ example: 3, description: 'Número de séries' })
  @IsInt() @Min(1)
  sets!: number;

  @ApiProperty({ example: '12-15', description: 'Repetições (número ou faixa)' })
  @IsString() @IsNotEmpty()
  reps!: string;

  @ApiPropertyOptional({ example: 60, description: 'Descanso em segundos' })
  @IsOptional() @IsInt()
  restSecs?: number;

  @ApiPropertyOptional({ example: 'Manter coluna neutra' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ example: 1, description: 'Ordem do exercício na ficha' })
  @IsInt() @Min(1)
  order!: number;
}

export class CreateWorkoutDto {
  @ApiProperty({ example: 'uuid-do-aluno', description: 'UUID do aluno' })
  @IsString() @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 'Treino A — Peito e Tríceps' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Foco em hipertrofia, descanso 60s' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateWorkoutItemDto], description: 'Exercícios da ficha' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutItemDto)
  items!: CreateWorkoutItemDto[];
}

export class CreateExerciseDto {
  @ApiProperty({ example: 'Supino Reto' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Peito' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/...' })
  @IsOptional() @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'Deite no banco, segure a barra na largura dos ombros...' })
  @IsOptional() @IsString()
  description?: string;
}
