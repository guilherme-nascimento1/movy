import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAsanaDto {
  @ApiProperty({ example: 'Cão Olhando para Baixo' })
  @IsString() @IsNotEmpty()
  namePt: string;

  @ApiPropertyOptional({ example: 'Adho Mukha Svanasana' })
  @IsOptional() @IsString()
  nameSanskrit?: string;

  @ApiPropertyOptional({ example: 'Standing', description: 'Standing, Seated, Supine, Balancing, Backbend, Twist, Inversion' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'BEGINNER', description: 'BEGINNER, INTERMEDIATE, ADVANCED' })
  @IsOptional() @IsString()
  level?: string;

  @ApiPropertyOptional({ example: 'Fortalece braços e alonga a coluna.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.movy.com.br/yoga/adho-mukha.gif' })
  @IsOptional() @IsString()
  gifUrl?: string;
}
