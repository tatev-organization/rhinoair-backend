import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactUsService } from './contact-us.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Contact Us')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Send a contact inquiry' })
  @ApiResponse({ status: 201, description: 'The inquiry has been successfully sent.' })
  create(@Body() createContactUsDto: CreateContactUsDto) {
    return this.contactUsService.create(createContactUsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contact inquiries' })
  @ApiResponse({ status: 200, description: 'Return all inquiries.' })
  findAll() {
    return this.contactUsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact inquiry by id' })
  @ApiResponse({ status: 200, description: 'Return the inquiry.' })
  findOne(@Param('id') id: string) {
    return this.contactUsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact inquiry' })
  @ApiResponse({ status: 200, description: 'The inquiry has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateContactUsDto: UpdateContactUsDto) {
    return this.contactUsService.update(id, updateContactUsDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact inquiry' })
  @ApiResponse({ status: 200, description: 'The inquiry has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.contactUsService.remove(id);
  }
}
