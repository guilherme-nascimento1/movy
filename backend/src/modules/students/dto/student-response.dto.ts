import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { StudentStatus } from '../../../common/enums';

export class StudentDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
  @ApiProperty({ example: 'Maria Oliveira' }) name!: string;
  @ApiPropertyOptional({ example: '123.456.789-00' }) cpf?: string;
  @ApiPropertyOptional({ example: 'maria@email.com' }) email?: string;
  @ApiPropertyOptional({ example: '11999999999' }) phone?: string;
  @ApiPropertyOptional({ example: 'https://r2.cloudflare.com/foto.jpg' }) photoUrl?: string;
  @ApiPropertyOptional({ example: '1995-08-20T00:00:00.000Z' }) birthdate?: string;
  @ApiProperty({ enum: StudentStatus, example: StudentStatus.ACTIVE }) status!: StudentStatus;
  @ApiPropertyOptional({ example: 'Tem problema no joelho direito' }) notes?: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) updatedAt!: string;
}

export class StudentResponseDto {
  @ApiProperty({ type: StudentDto }) data!: StudentDto;
}

export class StudentListResponseDto {
  @ApiProperty({ type: [StudentDto] }) data!: StudentDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
