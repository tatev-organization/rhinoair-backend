import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import {
  CurrentUser,
  JwtUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote' })
  @ApiResponse({ status: 201, description: 'Quote created successfully.' })
  create(@Body() createQuoteDto: CreateQuoteDto, @CurrentUser() user: JwtUser) {
    return this.quotesService.create(createQuoteDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes for the current partner' })
  @ApiResponse({ status: 200, description: 'List of quotes.' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.quotesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote details.' })
  @ApiResponse({ status: 404, description: 'Quote not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.quotesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quote' })
  @ApiResponse({ status: 200, description: 'Quote updated.' })
  update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.quotesService.update(id, updateQuoteDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quote' })
  @ApiResponse({ status: 200, description: 'Quote deleted.' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.quotesService.remove(id, user);
  }
}
