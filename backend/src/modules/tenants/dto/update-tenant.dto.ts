import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'CrossFit Alpha Pro' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '{"whatsapp":"11999999999","address":"Rua das Flores, 123"}' })
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  active?: boolean;
}
