import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { StudentStatus } from '../../../common/enums';

export class StudentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Maria', description: 'Busca por nome, CPF ou e-mail' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StudentStatus, description: 'Filtrar por status' })
  @IsOptional() @IsEnum(StudentStatus)
  status?: StudentStatus;
}
