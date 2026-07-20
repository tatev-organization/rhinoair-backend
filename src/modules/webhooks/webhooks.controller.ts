import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks/st')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive ServiceTitan Job Webhook' })
  handleJobWebhook(@Body() payload: any, @Headers() headers: any) {
    this.logger.log(`Received ST Job Webhook: ${JSON.stringify(payload)}`);
    // Pass execution to service asynchronously to return 200 OK to ST immediately
    this.webhooksService.handleJobWebhook(payload).catch((err) => {
      this.logger.error('Error handling Job Webhook', err);
    });
    return { success: true };
  }

  @Public()
  @Post('invoices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive ServiceTitan Invoice Webhook' })
  handleInvoiceWebhook(@Body() payload: any, @Headers() headers: any) {
    this.logger.log(`Received ST Invoice Webhook: ${JSON.stringify(payload)}`);
    // Pass execution to service asynchronously
    this.webhooksService.handleInvoiceWebhook(payload).catch((err) => {
      this.logger.error('Error handling Invoice Webhook', err);
    });
    return { success: true };
  }
}
