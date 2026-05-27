import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn, Min, Max } from 'class-validator';

export const BELT_COLORS = ['WHITE', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'PURPLE', 'BROWN', 'BLACK', 'RED_BLACK', 'RED_WHITE', 'RED'] as const;

export class GraduateStudentDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ enum: BELT_COLORS, example: 'BLUE' })
  @IsIn(BELT_COLORS)
  belt!: string;

  @ApiPropertyOptional({ example: 2, description: 'Graus/listras na faixa (0-4)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  stripes?: number;

  @ApiProperty({ example: 'Jiu-Jitsu', description: 'Modalidade: Jiu-Jitsu, Judô, Karatê, Muay Thai, etc.' })
  @IsString()
  @IsNotEmpty()
  modality!: string;

  @ApiPropertyOptional({ example: 'Excelente técnica na guarda' })
  @IsOptional()
  @IsString()
  notes?: string;
}
