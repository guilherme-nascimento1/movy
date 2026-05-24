import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class ExerciseDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'Supino Reto' }) name!: string;
  @ApiPropertyOptional({ example: 'Peito' }) category?: string;
  @ApiPropertyOptional({ example: 'https://youtube.com/...' }) videoUrl?: string;
  @ApiPropertyOptional({ example: 'Deite no banco...' }) description?: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
}

export class ExerciseListResponseDto {
  @ApiProperty({ type: [ExerciseDto] }) data!: ExerciseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class WorkoutItemDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) workoutId!: string;
  @ApiProperty({ example: 'uuid' }) exerciseId!: string;
  @ApiProperty({ example: 3 }) sets!: number;
  @ApiProperty({ example: '12-15' }) reps!: string;
  @ApiPropertyOptional({ example: 60 }) restSecs?: number;
  @ApiPropertyOptional({ example: 'Manter coluna neutra' }) notes?: string;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ type: ExerciseDto }) exercise?: ExerciseDto;
}

export class WorkoutDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'uuid' }) studentId!: string;
  @ApiProperty({ example: 'uuid', description: 'userId do professor que criou' }) createdBy!: string;
  @ApiProperty({ example: 'Treino A — Peito e Tríceps' }) name!: string;
  @ApiPropertyOptional({ example: 'Foco em hipertrofia, descanso 60s' }) notes?: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ type: [WorkoutItemDto] }) items!: WorkoutItemDto[];
}

export class WorkoutResponseDto {
  @ApiProperty({ type: WorkoutDto }) data!: WorkoutDto;
}

export class WorkoutListResponseDto {
  @ApiProperty({ type: [WorkoutDto] }) data!: WorkoutDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
