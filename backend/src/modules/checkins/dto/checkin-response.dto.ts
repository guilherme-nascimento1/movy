import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentDto } from '../../students/dto/student-response.dto';

export class CheckinDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) classScheduleId!: string;
  @ApiProperty({ example: 'uuid' }) studentId!: string;
  @ApiProperty({ example: '2025-01-13T07:05:00.000Z' }) checkedAt!: string;
  @ApiPropertyOptional({ type: StudentDto }) student?: StudentDto;
}

export class CheckinListResponseDto {
  @ApiProperty({ type: [CheckinDto] }) data!: CheckinDto[];
}

export class CheckinResponseDto {
  @ApiProperty({ type: CheckinDto }) data!: CheckinDto;
}
