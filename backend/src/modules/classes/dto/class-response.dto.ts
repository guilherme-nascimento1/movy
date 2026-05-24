import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class ClassDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'CrossFit 7h' }) name!: string;
  @ApiPropertyOptional({ example: 'uuid' }) instructorId?: string;
  @ApiProperty({ example: 1, description: '0=Dom, 1=Seg, ..., 6=Sáb' }) weekday!: number;
  @ApiProperty({ example: '07:00' }) startTime!: string;
  @ApiProperty({ example: '08:00' }) endTime!: string;
  @ApiProperty({ example: 20 }) capacity!: number;
  @ApiProperty({ example: true }) active!: boolean;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
}

export class ClassResponseDto {
  @ApiProperty({ type: ClassDto }) data!: ClassDto;
}

export class ClassListResponseDto {
  @ApiProperty({ type: [ClassDto] }) data!: ClassDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class ScheduleDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) classId!: string;
  @ApiProperty({ example: '2025-01-13T00:00:00.000Z' }) date!: string;
  @ApiProperty({ example: 'SCHEDULED', enum: ['SCHEDULED', 'DONE', 'CANCELLED'] }) status!: string;
  @ApiProperty({ example: '2025-01-10T10:00:00.000Z' }) createdAt!: string;
  @ApiPropertyOptional({ type: ClassDto }) class?: ClassDto;
  @ApiProperty({ example: 12, description: 'Número de check-ins realizados' }) checkinCount!: number;
}

export class ScheduleListResponseDto {
  @ApiProperty({ type: [ScheduleDto] }) data!: ScheduleDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
