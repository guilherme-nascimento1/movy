import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { LeadStage } from './lead.dto';

export class LeadDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'Maria Oliveira' }) name!: string;
  @ApiPropertyOptional({ example: '11999999999' }) phone?: string;
  @ApiPropertyOptional({ example: 'maria@email.com' }) email?: string;
  @ApiPropertyOptional({ example: 'instagram' }) source?: string;
  @ApiProperty({ enum: LeadStage, example: LeadStage.NEW }) stage!: LeadStage;
  @ApiPropertyOptional({ example: 'Interessada em pilates' }) notes?: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) updatedAt!: string;
}

export class LeadResponseDto {
  @ApiProperty({ type: LeadDto }) data!: LeadDto;
}

export class LeadListResponseDto {
  @ApiProperty({ type: [LeadDto] }) data!: LeadDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class LeadFunnelItemDto {
  @ApiProperty({ enum: LeadStage }) stage!: LeadStage;
  @ApiProperty({ example: 12 }) count!: number;
}

export class LeadFunnelResponseDto {
  @ApiProperty({ type: [LeadFunnelItemDto] }) data!: LeadFunnelItemDto[];
}
