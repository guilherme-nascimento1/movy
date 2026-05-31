import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantModuleResolverService } from './tenant-module-resolver.service';

@Module({
  providers: [TenantsService, TenantModuleResolverService],
  controllers: [TenantsController],
  exports: [TenantModuleResolverService],
})
export class TenantsModule {}
