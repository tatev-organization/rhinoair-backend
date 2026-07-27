import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { ServiceTitanService } from '../service-titan/service-titan.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stService: ServiceTitanService,
  ) {}

  async findAll(user: JwtUser) {
    return this.prisma.invoice.findMany({
      where: { companyId: user.companyId! },
      include: {
        project: {
          select: {
            address: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceDetails(invoiceId: string, user: JwtUser) {
    // Verify invoice belongs to the user's company
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        invoiceId,
      },
    });

    if (!invoice || invoice.companyId !== user.companyId) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.serviceTitanInvoiceId) {
      throw new NotFoundException('No ServiceTitan Invoice ID attached');
    }

    // Fetch live details from ST
    const stInvoice = await this.stService.getInvoiceDetails(invoice.serviceTitanInvoiceId);
    
    return {
      localInvoice: invoice,
      stDetails: stInvoice?.data || stInvoice,
    };
  }
}
