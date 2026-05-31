import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, IsNumber } from 'class-validator';

export class CreateCombatRecordDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString() @IsNotEmpty()
  studentId: string;

  @ApiPropertyOptional({ example: 'João Adversário' })
  @IsOptional() @IsString()
  opponentName?: string;

  @ApiProperty({ example: 'WIN', description: 'WIN, LOSS, DRAW' })
  @IsString() @IsIn(['WIN', 'LOSS', 'DRAW'])
  result: string;

  @ApiPropertyOptional({ example: 'Copa Brasil de Muay Thai' })
  @IsOptional() @IsString()
  event?: string;

  @ApiProperty({ example: '2025-06-15', description: 'Data do combate (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 70.5, description: 'Peso no momento do combate (kg)' })
  @IsOptional() @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 'Vitória por pontos na terceira etapa.' })
  @IsOptional() @IsString()
  notes?: string;
}
