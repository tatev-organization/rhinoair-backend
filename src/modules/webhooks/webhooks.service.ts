import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * Triggers a sync for the company associated with this ST customer ID.
   */
  private async triggerSyncByCustomerId(stCustomerId: string) {
    if (!stCustomerId) {
      this.logger.warn('Webhook payload missing customerId. Cannot sync.');
      return;
    }

    const mapping = await this.prisma.companyServiceTitanCustomer.findFirst({
      where: { serviceTitanCustomerId: stCustomerId.toString() },
    });

    if (!mapping) {
      this.logger.warn(
        `No local company mapped to ST Customer ID: ${stCustomerId}`,
      );
      return;
    }

    this.logger.log(
      `Found mapped company ${mapping.companyId} for ST Customer ${stCustomerId}. Triggering sync...`,
    );

    // Trigger the existing project and invoice sync logic!
    await this.projectsService.syncProjectsForCompany(mapping.companyId);

    this.logger.log(
      `Successfully synced company ${mapping.companyId} via Webhook`,
    );
  }

  async handleJobWebhook(payload: any) {
    // In a real ST webhook, the customer ID might be at payload.customerId or payload.customer.id
    // Adjust this mapping based on the actual ST webhook structure once known.
    const stCustomerId =
      payload?.customerId || payload?.customer?.id || payload?.data?.customerId;
    await this.triggerSyncByCustomerId(stCustomerId);
  }

  async handleInvoiceWebhook(payload: any) {
    const stCustomerId =
      payload?.customerId || payload?.customer?.id || payload?.data?.customerId;
    await this.triggerSyncByCustomerId(stCustomerId);
  }
}
