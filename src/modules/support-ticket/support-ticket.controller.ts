import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Support Ticket')
@ApiBearerAuth()
@Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('support-ticket')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'The ticket has been successfully created.' })
  create(@Body() createSupportTicketDto: CreateSupportTicketDto) {
    return this.supportTicketService.create(createSupportTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all support tickets' })
  @ApiResponse({ status: 200, description: 'Return all tickets.' })
  findAll() {
    return this.supportTicketService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a support ticket by id' })
  @ApiResponse({ status: 200, description: 'Return the ticket.' })
  findOne(@Param('id') id: string) {
    return this.supportTicketService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a support ticket' })
  @ApiResponse({ status: 200, description: 'The ticket has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateSupportTicketDto: UpdateSupportTicketDto) {
    return this.supportTicketService.update(id, updateSupportTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a support ticket' })
  @ApiResponse({ status: 200, description: 'The ticket has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.supportTicketService.remove(id);
  }
}
