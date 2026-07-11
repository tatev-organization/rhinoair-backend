import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceTitanService } from '../service-titan/service-titan.service';

export interface AuthPartner {
  companyId: string;
}

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceTitanService: ServiceTitanService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto, partner: AuthPartner) {
    const quoteNumber = `RA-${Math.floor(100000 + Math.random() * 900000)}`;

    const quote = await this.prisma.quote.create({
      data: {
        ...createQuoteDto,
        quoteNumber,
        companyId: partner.companyId,
      },
    });

    // Run ServiceTitan Sync asynchronously to not block the quote creation response
    this.syncQuoteToServiceTitan(
      quote,
      createQuoteDto,
      partner.companyId,
    ).catch((err) => {
      this.logger.error(`Failed to sync quote ${quoteNumber} to ST`, err);
    });

    return quote;
  }

  private async syncQuoteToServiceTitan(
    quote: any,
    createQuoteDto: CreateQuoteDto,
    companyId: string,
  ) {
    this.logger.log(`Starting ST sync for Quote ${quote.quoteNumber}...`);

    // 1. Fetch Company (Partner) details
    const company = await this.prisma.company.findUnique({
      where: { companyId },
    });

    if (!company) {
      throw new Error(`Company not found for id ${companyId}`);
    }

    let customerId = company.stCustomerId;

    // 2. Create ST Customer if it doesn't exist
    if (!customerId) {
      this.logger.log(`Creating ST Customer for ${company.name}`);
      const stCust = await this.serviceTitanService.createCustomer(
        company.name,
        company.email,
        company.phone || '0000000000',
        company.address || 'Unknown Address',
        '', // city
        '', // state
        '', // zip
      );
      if (stCust) {
        customerId = stCust.customerId;
        await this.prisma.company.update({
          where: { companyId },
          data: { stCustomerId: customerId },
        });
      }
    }

    if (!customerId) {
      throw new Error('Failed to create/find ST Customer');
    }

    // 3. Create ST Location for this project address
    const address = createQuoteDto.projectAddress || 'Unknown Project Address';

    let street = address;
    let city = 'Unknown';
    let state = 'CA';
    let zip = '00000';

    const parts = address.split(',').map((s) => s.trim());
    if (parts.length >= 3) {
      street = parts[0];
      city = parts[1];
      const stateZip = parts[2].split(' ').filter((s) => s);
      if (stateZip.length >= 2) {
        state = stateZip[0];
        zip = stateZip[1];
      } else if (stateZip.length === 1) {
        state = stateZip[0];
      }
    }

    this.logger.log(`Creating ST Location for address: ${address}`);
    const locationId = await this.serviceTitanService.createLocation(
      customerId,
      street,
      city,
      state,
      zip,
    );

    // 4. Create ST Project
    this.logger.log(`Creating ST Project for Location ${locationId}`);
    const projectName = `Quote ${quote.quoteNumber}`;
    const projectSummary = `Scope: ${createQuoteDto.scope || 'N/A'}\nTier: ${createQuoteDto.tierLabel || 'N/A'}`;

    const projectId = await this.serviceTitanService.createProject(
      customerId,
      locationId,
      projectName,
      projectSummary,
    );

    // 5. Create ST Estimate
    this.logger.log(`Creating ST Estimate for Project ${projectId}`);
    const estimateId = await this.serviceTitanService.createEstimate(
      projectId,
      `Scope: ${createQuoteDto.scope}\nTier: ${createQuoteDto.tierLabel}\nQuote ID: ${quote.quoteNumber}`,
      createQuoteDto.total,
    );

    // 6. Save ST IDs to DB
    await this.prisma.quote.update({
      where: { quoteId: quote.quoteId },
      data: {
        stLocationId: locationId,
        stProjectId: projectId,
        stEstimateId: estimateId,
      },
    });

    this.logger.log(`Successfully synced Quote ${quote.quoteNumber} to ST!`);
  }

  async findAll(partner: AuthPartner) {
    return this.prisma.quote.findMany({
      where: { companyId: partner.companyId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, partner: AuthPartner) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId: id },
      include: { project: true },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.companyId !== partner.companyId) {
      throw new UnauthorizedException('You do not have access to this quote');
    }

    return quote;
  }

  async update(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    partner: AuthPartner,
  ) {
    await this.findOne(id, partner);
    return this.prisma.quote.update({
      where: { quoteId: id },
      data: updateQuoteDto,
    });
  }

  async remove(id: string, partner: AuthPartner) {
    await this.findOne(id, partner);
    return this.prisma.quote.delete({
      where: { quoteId: id },
    });
  }
}
