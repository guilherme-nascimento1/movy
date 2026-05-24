import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan } from '../../../common/enums';

export class TenantDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CrossFit Alpha' }) name!: string;
  @ApiProperty({ example: 'crossfit-alpha' }) slug!: string;
  @ApiProperty({ enum: TenantPlan, example: TenantPlan.STARTER }) plan!: TenantPlan;
  @ApiProperty({ example: {} }) settings!: object;
  @ApiProperty({ example: true }) active!: boolean;
  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' }) trialEndsAt?: string;
  @ApiProperty({ example: '2025-01-01T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' }) updatedAt!: string;
}

export class TenantResponseDto {
  @ApiProperty({ type: TenantDto }) data!: TenantDto;
}
