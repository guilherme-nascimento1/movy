import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendPushDto {
  @ApiProperty({ isArray: true, example: ['ExponentPushToken[xxx]'], description: 'Lista de Expo Push Tokens' })
  @IsArray()
  @IsString({ each: true })
  expoPushTokens: string[];

  @ApiProperty({ example: 'Mensalidade vencida', description: 'Título da notificação' })
  @IsString() @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Sua mensalidade de março está em atraso.' })
  @IsString() @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: { screen: 'Payments' }, description: 'Dados extras para deep link no app' })
  @IsOptional()
  data?: Record<string, unknown>;
}
