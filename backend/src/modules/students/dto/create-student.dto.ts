import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString, IsEnum } from 'class-validator';
import { StudentStatus } from '../../../common/enums';

export class CreateStudentDto {
  @ApiProperty({ example: 'Maria Oliveira', description: 'Nome completo do aluno' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional() @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ example: '11999999999', description: 'WhatsApp com DDD' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-08-20', description: 'Data de nascimento (ISO 8601)' })
  @IsOptional() @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({ example: 'Tem problema no joelho direito' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: StudentStatus, default: StudentStatus.ACTIVE })
  @IsOptional() @IsEnum(StudentStatus)
  status?: StudentStatus;
}
