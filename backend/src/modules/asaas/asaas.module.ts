import { Module } from '@nestjs/common';
import { AsaasController } from './asaas.controller';
import { AsaasService } from './asaas.service';
import { AsaasClientService } from './asaas-client.service';

@Module({
  controllers: [AsaasController],
  providers: [AsaasService, AsaasClientService],
  exports: [AsaasClientService],
})
export class AsaasModule {}
