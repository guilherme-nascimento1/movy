import { ApiProperty } from '@nestjs/swagger';
import { UserRole, TenantPlan } from '../../../common/enums';

export class AuthUserDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'João Silva' }) name!: string;
  @ApiProperty({ example: 'joao@email.com' }) email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty({ example: 'uuid' }) tenantId!: string;
}

export class AuthTenantDto {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CrossFit Alpha' }) name!: string;
  @ApiProperty({ example: 'crossfit-alpha' }) slug!: string;
  @ApiProperty({ enum: TenantPlan }) plan!: TenantPlan;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGc...' }) accessToken!: string;
  @ApiProperty({ example: 'eyJhbGc...' }) refreshToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
  @ApiProperty({ type: AuthTenantDto }) tenant!: AuthTenantDto;
}
