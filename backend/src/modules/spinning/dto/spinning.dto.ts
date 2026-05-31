import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'BIKE', description: 'Tipo: BIKE, REFORMER, CADILLAC, CHAIR, BARREL' })
  @IsString() @IsNotEmpty()
  @IsIn(['BIKE', 'REFORMER', 'CADILLAC', 'CHAIR', 'BARREL'])
  type: string;

  @ApiProperty({ example: 'Bike 01', description: 'Identificador do equipamento' })
  @IsString() @IsNotEmpty()
  identifier: string;

  @ApiPropertyOptional({ example: '2025-03-01', description: 'Data da última manutenção' })
  @IsOptional() @IsDateString()
  lastMaintenanceAt?: string;

  @ApiPropertyOptional({ example: 'Correia trocada' })
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateEquipmentStatusDto {
  @ApiProperty({ example: 'MAINTENANCE', description: 'ACTIVE, MAINTENANCE, RETIRED' })
  @IsString()
  @IsIn(['ACTIVE', 'MAINTENANCE', 'RETIRED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}
