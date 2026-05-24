import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plano Mensal', description: 'Nome do plano' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 149.90, description: 'Preço em reais' })
  @Type(() => Number)
  @IsNumber() @IsPositive()
  price!: number;

  @ApiProperty({ example: 30, description: 'Duração em dias' })
  @Type(() => Number)
  @IsInt() @Min(1)
  durationDays!: number;

  @ApiPropertyOptional({ example: 'Acesso ilimitado às aulas' })
  @IsOptional() @IsString()
  description?: string;
}
