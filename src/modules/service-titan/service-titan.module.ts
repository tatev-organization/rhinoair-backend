import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceTitanService } from './service-titan.service';

@Module({
  imports: [HttpModule],
  providers: [ServiceTitanService],
  exports: [ServiceTitanService],
})
export class ServiceTitanModule {}
