import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { MetaConversionsService } from './meta-conversions.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, MetaConversionsService],
  exports: [MetaConversionsService],
})
export class IntegrationsModule {}
