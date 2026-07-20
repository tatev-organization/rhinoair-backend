import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices for the current partner' })
  @ApiResponse({ status: 200, description: 'Returns a list of invoices.' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.invoicesService.findAll(user);
  }
}
