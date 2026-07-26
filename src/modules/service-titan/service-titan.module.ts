import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceTitanService } from './service-titan.service';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [ServiceTitanService],
  exports: [ServiceTitanService],
})
export class ServiceTitanModule {}
