import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignSTCustomerDto {
  @IsString()
  @IsNotEmpty()
  serviceTitanCustomerId: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('partners')
  @ApiOperation({
    summary: 'Get all partners and their ST mappings (Admin Only)',
  })
  getPartners() {
    return this.adminService.getPartners();
  }

  @Get('st-customers')
  @ApiOperation({
    summary: 'Get all customers from ServiceTitan',
  })
  getSTCustomers() {
    return this.adminService.getSTCustomers();
  }

  @Get('partners/:companyId')
  @ApiOperation({
    summary: 'Get a single partner profile with ST Customer details',
  })
  getPartnerById(@Param('companyId') companyId: string) {
    return this.adminService.getPartnerById(companyId);
  }

  @Post('partners/:companyId/st-customers')
  @ApiOperation({ summary: 'Assign a ServiceTitan Customer ID to a Partner' })
  assignSTCustomer(
    @Param('companyId') companyId: string,
    @Body() dto: AssignSTCustomerDto,
  ) {
    return this.adminService.assignSTCustomer(
      companyId,
      dto.serviceTitanCustomerId,
    );
  }

  @Delete('partners/:companyId/st-customers/:stCustomerId')
  @ApiOperation({
    summary: 'Remove a ServiceTitan Customer ID mapping from a Partner',
  })
  removeSTCustomer(
    @Param('companyId') companyId: string,
    @Param('stCustomerId') stCustomerId: string,
  ) {
    return this.adminService.removeSTCustomer(companyId, stCustomerId);
  }
}
