import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreatePlanDto } from './create-plan.dto';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  active?: boolean;
}
