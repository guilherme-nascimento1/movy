import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class PlanDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'Plano Mensal' }) name!: string;
  @ApiProperty({ example: 149.90 }) price!: number;
  @ApiProperty({ example: 30 }) durationDays!: number;
  @ApiPropertyOptional({ example: 'Acesso ilimitado às aulas' }) description?: string;
  @ApiProperty({ example: true }) active!: boolean;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
}

export class PlanResponseDto {
  @ApiProperty({ type: PlanDto }) data!: PlanDto;
}

export class PlanListResponseDto {
  @ApiProperty({ type: [PlanDto] }) data!: PlanDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
