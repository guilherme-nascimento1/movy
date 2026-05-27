import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unidade Centro', description: 'Nome da unidade/filial' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Rua das Palmeiras, 100 — São Paulo/SP' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUnitDto extends CreateUnitDto {}
