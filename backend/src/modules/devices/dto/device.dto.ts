import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxx]', description: 'Expo Push Token do dispositivo' })
  @IsString() @IsNotEmpty()
  token: string;

  @ApiProperty({ enum: ['movy-alunos', 'movy-gestao'], example: 'movy-alunos', description: 'Aplicativo que está registrando o token' })
  @IsString()
  @IsIn(['movy-alunos', 'movy-gestao'])
  app: string;
}
