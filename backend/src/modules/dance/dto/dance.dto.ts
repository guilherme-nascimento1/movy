import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateDanceEventDto {
  @ApiProperty({ example: 'Festival de Dança 2025' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Ballet', description: 'Estilo de dança do evento' })
  @IsOptional() @IsString()
  danceStyle?: string;

  @ApiProperty({ example: '2025-08-10', description: 'Data do evento (ISO 8601)' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'Teatro Municipal' })
  @IsOptional() @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Apresentação de fim de ano' })
  @IsOptional() @IsString()
  notes?: string;
}
