import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/decorators';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const slugExists = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (slugExists) throw new ConflictException('Este slug já está em uso');

    const tenant = await this.prisma.tenant.create({
      data: { name: dto.tenantName, slug: dto.tenantSlug },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.ownerName,
        email: dto.email,
        passwordHash,
        role: 'OWNER',
      },
    });

    return this.buildAuthResponse(user, tenant);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, active: true },
      include: { tenant: true },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

    if (!user.tenant.active) throw new UnauthorizedException('Academia inativa. Entre em contato com o suporte');

    return this.buildAuthResponse(user, user.tenant);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, active: true },
      });
      if (!user) throw new UnauthorizedException('Token inválido');

      const accessToken = this.signAccessToken({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async me(userId: string): Promise<object> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, active: true },
      include: { tenant: true },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return { data: user };
  }

  private buildAuthResponse(
    user: { id: string; email: string; name: string; role: string; tenantId: string },
    tenant: { id: string; name: string; slug: string; plan: string },
  ): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role as never, tenantId: user.tenantId },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan as never },
    };
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private signRefreshToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }
}
