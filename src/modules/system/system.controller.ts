import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('System')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'The setting has been successfully created.' })
  create(@Body() createSystemDto: CreateSystemDto) {
    return this.systemService.create(createSystemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Return all settings.' })
  findAll() {
    return this.systemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a system setting by id' })
  @ApiResponse({ status: 200, description: 'Return the setting.' })
  findOne(@Param('id') id: string) {
    return this.systemService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiResponse({ status: 200, description: 'The setting has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateSystemDto: UpdateSystemDto) {
    return this.systemService.update(id, updateSystemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a system setting' })
  @ApiResponse({ status: 200, description: 'The setting has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.systemService.remove(id);
  }
}
