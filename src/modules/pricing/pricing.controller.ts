import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('config')
  async getConfig() {
    // Both Admin and Partner can view pricing config to run the calculator
    return this.pricingService.getConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Put('config')
  async updateConfig(@Body() data: any) {
    // Only Admin can update pricing
    return this.pricingService.updateConfig(data);
  }
}
