import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateNpsDto {
  @ApiProperty({ example: 9, description: 'Score NPS de 0 a 10', minimum: 0, maximum: 10 })
  @IsInt() @Min(0) @Max(10)
  score!: number;

  @ApiPropertyOptional({ example: 'Ótimo atendimento!', description: 'Comentário opcional' })
  @IsOptional() @IsString()
  comment?: string;

  @ApiProperty({ example: 'satisfaction', description: '"satisfaction" (D+30 da matrícula) ou "exit" (D+3 do cancelamento)', enum: ['satisfaction', 'exit'] })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'uuid-do-aluno', description: 'UUID do aluno (se aplicável)' })
  @IsOptional() @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'uuid-do-lead', description: 'UUID do lead (se aplicável)' })
  @IsOptional() @IsString()
  leadId?: string;
}

export class NpsReportDto {
  @ApiProperty({ example: 7.4 })
  averageScore!: number;

  @ApiProperty({ example: 65 })
  npsScore!: number;

  @ApiProperty({ example: { promoters: 60, passives: 20, detractors: 20 } })
  distribution!: { promoters: number; passives: number; detractors: number };

  @ApiProperty({ type: 'array' })
  recentComments!: { score: number; comment: string | null; createdAt: Date }[];
}
