import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId, CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../../common/decorators';

@ApiTags('devices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @ApiOperation({
    summary: 'Registrar Expo Push Token',
    description: 'Chamado pelos apps mobile ao logar. Upsert pelo token — atualiza se já existir.',
  })
  @ApiResponse({ status: 201, schema: { properties: { data: { properties: { id: { type: 'string' }, app: { type: 'string' }, registeredAt: { type: 'string' } } } } } })
  @Post('register')
  register(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceDto,
  ): Promise<object> {
    return this.devicesService.register(tenantId, user.sub, dto);
  }
}
