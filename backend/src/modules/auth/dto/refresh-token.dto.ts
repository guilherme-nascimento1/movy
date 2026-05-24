import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtido no login' })
  @IsString() @IsNotEmpty()
  refreshToken!: string;
}
