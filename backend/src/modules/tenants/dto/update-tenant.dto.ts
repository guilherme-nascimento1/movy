import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsUrl, Matches } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'CrossFit Alpha' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '11999999999', description: 'Telefone de contato com DDD' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@academia.com.br' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-99', description: 'CNPJ formatado ou apenas números' })
  @IsOptional() @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123 – Sala 2' })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'UF com 2 letras' })
  @IsOptional() @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve ser a UF com 2 letras maiúsculas (ex: SP)' })
  state?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional() @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'https://storage.movy.com.br/logos/abc.png' })
  @IsOptional() @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://academia.com.br' })
  @IsOptional() @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: '@crossfitalpha', description: 'Handle do Instagram sem https' })
  @IsOptional() @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: '11999999999', description: 'Número do WhatsApp de atendimento com DDD' })
  @IsOptional() @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'Seg–Sex 06h–22h | Sáb 08h–14h | Dom 08h–12h' })
  @IsOptional() @IsString()
  businessHours?: string;

  @ApiPropertyOptional({ description: 'Preferências avançadas em JSON (modalidades, integrações, etc.)' })
  @IsOptional()
  settings?: Record<string, unknown>;
}
