import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'CrossFit Alpha', description: 'Nome da academia' })
  @IsString() @IsNotEmpty()
  tenantName!: string;

  @ApiProperty({ example: 'crossfit-alpha', description: 'Slug único da academia (letras minúsculas, hífens)' })
  @IsString() @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
  tenantSlug!: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do responsável' })
  @IsString() @IsNotEmpty()
  ownerName!: string;

  @ApiProperty({ example: 'joao@crossfitalpha.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'Senha@123', description: 'Mínimo 8 caracteres' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password!: string;
}
