import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AiChatDto {
  @ApiProperty({ example: 'Quais alunos estão em risco de churn este mês?' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    type: [ChatHistoryItemDto],
    description: 'Histórico da conversa para manter contexto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}

export class WorkoutSuggestDto {
  @ApiProperty({ example: 'uuid-do-aluno' })
  @IsString() @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 'Hipertrofia', description: 'Objetivo do treino' })
  @IsString() @IsNotEmpty()
  goal!: string;

  @ApiProperty({ example: 'MUSCULACAO', description: 'Modalidade do treino' })
  @IsString() @IsNotEmpty()
  modality!: string;

  @ApiProperty({ example: 4, description: 'Dias disponíveis por semana' })
  availableDays!: number;

  @ApiPropertyOptional({ example: 'Joelho direito com lesão', description: 'Restrições físicas' })
  @IsOptional() @IsString()
  restrictions?: string;
}

export class GenerateMessageDto {
  @ApiProperty({
    enum: ['cobranca', 'ausencia', 'aniversario', 'reativacao'],
    description: 'Contexto da mensagem a ser gerada',
  })
  @IsString()
  @IsIn(['cobranca', 'ausencia', 'aniversario', 'reativacao'])
  context!: 'cobranca' | 'ausencia' | 'aniversario' | 'reativacao';

  @ApiPropertyOptional({
    example: 'uuid-do-aluno',
    description: 'ID do aluno para personalizar a mensagem',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    example: 'Olá, sua mensalidade venceu.',
    description: 'Mensagem existente para melhorar',
  })
  @IsOptional()
  @IsString()
  improve?: string;
}
