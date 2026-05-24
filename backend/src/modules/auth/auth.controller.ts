import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar nova academia', description: 'Cria tenant + usuário OWNER e retorna tokens JWT' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Slug já em uso' })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login', description: 'Autentica com email e senha, retorna tokens JWT' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, schema: { properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário + tenant' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<object> {
    return this.authService.me(user.sub);
  }

  @ApiOperation({ summary: 'Logout (client-side)' })
  @ApiResponse({ status: 200, description: 'Logout realizado' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(): { data: { message: string } } {
    return { data: { message: 'Logout realizado com sucesso' } };
  }
}
