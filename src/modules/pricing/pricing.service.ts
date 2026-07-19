import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.pricingConfig.findUnique({
      where: { id: 'default_pricing' },
    });

    if (!config) {
      throw new NotFoundException('Pricing configuration not found');
    }

    return config.data;
  }

  async updateConfig(data: any) {
    const config = await this.prisma.pricingConfig.upsert({
      where: { id: 'default_pricing' },
      update: { data },
      create: { id: 'default_pricing', data },
    });

    return config.data;
  }
}
