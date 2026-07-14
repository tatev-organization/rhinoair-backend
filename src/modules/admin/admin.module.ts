import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceTitanModule } from '../service-titan/service-titan.module';

@Module({
  imports: [PrismaModule, ServiceTitanModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
