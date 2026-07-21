import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceTitanModule } from '../service-titan/service-titan.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, ServiceTitanModule, ProjectsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
