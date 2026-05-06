import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Business')
@ApiBearerAuth()
@Roles(Role.USER, Role.SUPER_ADMIN)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'The business has been successfully created.' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({ status: 200, description: 'Return all businesses.' })
  findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business by id' })
  @ApiResponse({ status: 200, description: 'Return the business.' })
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({ status: 200, description: 'The business has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 200, description: 'The business has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }
}
