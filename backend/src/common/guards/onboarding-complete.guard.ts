import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingCompleteGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { tenantId?: string } }>();
    const tenantId = request.user?.tenantId;
    if (!tenantId) return true;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { onboardingComplete: true },
    });

    if (!tenant?.onboardingComplete) {
      throw new HttpException(
        {
          data: null,
          error: {
            code: 'ONBOARDING_REQUIRED',
            message: 'Complete o cadastro da sua academia para continuar.',
          },
        },
        HttpStatus.PRECONDITION_REQUIRED,
      );
    }

    return true;
  }
}
