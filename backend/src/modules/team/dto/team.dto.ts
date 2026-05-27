import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsIn, IsDateString, IsNumber, IsPositive } from 'class-validator';

export const TEAM_ROLES = ['OWNER', 'ADMIN', 'STAFF', 'INSTRUCTOR'] as const;

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'uuid-do-usuario', description: 'ID do User já criado no sistema de auth' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'Carlos Oliveira' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'carlos@academia.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: TEAM_ROLES, example: 'INSTRUCTOR' })
  @IsIn(TEAM_ROLES)
  role!: string;

  @ApiPropertyOptional({ example: 'Musculação e CrossFit', description: 'Especialidade do membro' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: 'Instrutor com 5 anos de experiência' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://r2.movy.app/team/carlos.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ example: 'Carlos Oliveira' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TEAM_ROLES })
  @IsOptional()
  @IsIn(TEAM_ROLES)
  role?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
}

export class CreateGoalDto {
  @ApiProperty({ example: 'Matricular 20 alunos novos no mês' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 20, description: 'Valor meta' })
  @IsNumber()
  @IsPositive()
  targetValue!: number;

  @ApiProperty({ example: 'alunos', description: 'Unidade: alunos, R$, aulas' })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty({ example: '2025-06-30', description: 'Prazo para atingir a meta' })
  @IsDateString()
  dueDate!: string;
}

export class UpdateGoalProgressDto {
  @ApiProperty({ example: 12, description: 'Valor atual atingido' })
  @IsNumber()
  currentValue!: number;
}
