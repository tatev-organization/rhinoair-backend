import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class AssignSTCustomerDto {
  @IsString()
  @IsNotEmpty()
  serviceTitanCustomerId: string;
}

export class UpdateProjectPhaseDto {
  @IsNumber()
  @Min(0)
  @Max(3)
  currentPhaseIndex: number;

  @IsString()
  @IsNotEmpty()
  currentPhase: string;

  @IsString()
  @IsNotEmpty()
  phaseClass: string;
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

  @Patch('partners/:companyId/tier')
  @ApiOperation({ summary: 'Update a partner tier' })
  updatePartnerTier(
    @Param('companyId') companyId: string,
    @Body('tier') tier: number,
  ) {
    return this.adminService.updatePartnerTier(companyId, tier);
  }

  @Get('partners/:companyId/quotes')
  @ApiOperation({ summary: 'Get all quotes for a specific partner' })
  getPartnerQuotes(@Param('companyId') companyId: string) {
    return this.adminService.getPartnerQuotes(companyId);
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

  @Get('projects')
  @ApiOperation({
    summary: 'Get all projects across all partners (Admin Only)',
  })
  getAllProjects() {
    return this.adminService.getAllProjects();
  }

  @Patch('projects/:id/phase')
  @ApiOperation({
    summary: 'Update the phase/status of a project (Admin Only)',
  })
  updateProjectPhase(
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectPhaseDto,
  ) {
    return this.adminService.updateProjectPhase(projectId, dto);
  }

  @Get('projects/:id')
  @ApiOperation({
    summary: 'Get a single project with phases and tasks (Admin Only)',
  })
  getProjectById(@Param('id') projectId: string) {
    return this.adminService.getProjectById(projectId);
  }

  @Patch('projects/:id/tasks/:taskId/status')
  @ApiOperation({
    summary: 'Update the status of a specific task (Admin Only)',
  })
  updateTaskStatus(
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body('status') status: any,
  ) {
    return this.adminService.updateTaskStatus(projectId, taskId, status);
  }
}
