import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { EnrollmentStatus } from '../../../common/enums';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'UUID do aluno' })
  @IsString() @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'UUID do plano' })
  @IsString() @IsNotEmpty()
  planId!: string;

  @ApiProperty({ example: '2025-01-01', description: 'Data de início (ISO 8601)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-01-31', description: 'Data de fim (calculada automaticamente se omitida)' })
  @IsOptional() @IsDateString()
  endDate?: string;
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsOptional() @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: '2025-02-28' })
  @IsOptional() @IsDateString()
  endDate?: string;
}
