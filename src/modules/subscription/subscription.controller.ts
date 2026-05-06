import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Subscription')
@ApiBearerAuth()
@Roles(Role.USER, Role.SUPER_ADMIN)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'The subscription has been successfully created.' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'Return all subscriptions.' })
  findAll() {
    return this.subscriptionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  @ApiResponse({ status: 200, description: 'Return the subscription.' })
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(id);
  }
}
