import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassDto {
  @ApiProperty({ example: 'CrossFit 7h', description: 'Nome da turma/aula' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'UUID do instrutor (User)' })
  @IsOptional() @IsString()
  instructorId?: string;

  @ApiProperty({ example: 1, description: 'Dia da semana: 0=Dom, 1=Seg, ..., 6=Sáb' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiProperty({ example: '07:00', description: 'Horário de início (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Formato inválido. Use HH:MM' })
  startTime!: string;

  @ApiProperty({ example: '08:00', description: 'Horário de fim (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Formato inválido. Use HH:MM' })
  endTime!: string;

  @ApiProperty({ example: 20, description: 'Capacidade máxima de alunos' })
  @Type(() => Number) @IsInt() @Min(1)
  capacity!: number;
}

export class CreateScheduleDto {
  @ApiProperty({ example: '2025-01-13', description: 'Data da aula (ISO 8601)' })
  @IsString() @IsNotEmpty()
  date!: string;
}
