import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { EnrollmentStatus } from '../../../common/enums';
import { StudentDto } from '../../students/dto/student-response.dto';
import { PlanDto } from '../../plans/dto/plan-response.dto';

export class EnrollmentDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'uuid' }) studentId!: string;
  @ApiProperty({ example: 'uuid' }) planId!: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) startDate!: string;
  @ApiProperty({ example: '2025-01-31T00:00:00.000Z' }) endDate!: string;
  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.ACTIVE }) status!: EnrollmentStatus;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) updatedAt!: string;
  @ApiPropertyOptional({ type: StudentDto }) student?: StudentDto;
  @ApiPropertyOptional({ type: PlanDto }) plan?: PlanDto;
}

export class EnrollmentResponseDto {
  @ApiProperty({ type: EnrollmentDto }) data!: EnrollmentDto;
}

export class EnrollmentListResponseDto {
  @ApiProperty({ type: [EnrollmentDto] }) data!: EnrollmentDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
