import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsInt, Min } from 'class-validator';

export class CreateSessionPackageDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString() @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 'uuid-do-personal', description: 'userId do personal trainer' })
  @IsString() @IsNotEmpty()
  personalId: string;

  @ApiProperty({ example: 10, description: 'Total de sessões no pacote' })
  @IsInt() @Min(1)
  totalSessions: number;

  @ApiProperty({ example: 1500.0, description: 'Valor total do pacote (R$)' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Data de validade do pacote' })
  @IsOptional() @IsDateString()
  validUntil?: string;
}

export class ScheduleSessionDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString() @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 'uuid-do-personal', description: 'userId do personal' })
  @IsString() @IsNotEmpty()
  personalId: string;

  @ApiPropertyOptional({ example: 'uuid-do-pacote' })
  @IsOptional() @IsString()
  packageId?: string;

  @ApiProperty({ example: '2025-06-20T09:00:00Z', description: 'Data e hora da sessão (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'Foco em HIIT nessa sessão' })
  @IsOptional() @IsString()
  notes?: string;
}

export class CompleteSessionDto {
  @ApiPropertyOptional({ example: 'Ótima evolução na agachamento' })
  @IsOptional() @IsString()
  notes?: string;
}
