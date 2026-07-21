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
import { ProjectsService } from '../projects/projects.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceTitanService: ServiceTitanService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto, user: JwtUser) {
    const quoteNumber = `RA-${Math.floor(100000 + Math.random() * 900000)}`;

    const { stCustomerId, ...quoteData } = createQuoteDto;

    const quote = await this.prisma.quote.create({
      data: {
        ...quoteData,
        quoteNumber,
        companyId: user.companyId!,
      },
    });

    // Run ServiceTitan Sync asynchronously to not block the quote creation response
    this.syncQuoteToServiceTitan(quote, createQuoteDto, user).catch((err) => {
      this.logger.error(`Failed to sync quote ${quoteNumber} to ST`, err);
    });

    return quote;
  }

  private async syncQuoteToServiceTitan(
    quote: any,
    createQuoteDto: CreateQuoteDto,
    user: JwtUser,
  ) {
    this.logger.log(`Starting ST sync for Quote ${quote.quoteNumber}...`);

    const companyId = user.companyId!;

    // 1. Fetch Company details
    const company = await this.prisma.company.findUnique({
      where: { companyId },
      include: { stCustomers: true },
    });

    if (!company) {
      throw new Error(`Company not found for id ${companyId}`);
    }

    // 2. Get ST Customer
    if (company.stCustomers.length === 0) {
      throw new Error(
        'Sync failed: No ServiceTitan Customer ID is mapped to this partner. An admin must assign it first.',
      );
    }

    let stCustomerId: number;
    if (createQuoteDto.stCustomerId) {
      const selected = company.stCustomers.find(
        (c) => c.serviceTitanCustomerId === createQuoteDto.stCustomerId,
      );
      if (!selected) {
        throw new Error(
          `Sync failed: Selected ST Customer ID ${createQuoteDto.stCustomerId} is not mapped to this company.`,
        );
      }
      stCustomerId = Number(selected.serviceTitanCustomerId);
    } else {
      stCustomerId = Number(company.stCustomers[0].serviceTitanCustomerId);
    }

    let locationId: number | null = null;
    let projectId: number | null = null;

    // Check if Quote belongs to an existing Project
    if (createQuoteDto.projectId) {
      const existingProject = await this.prisma.project.findUnique({
        where: { projectId: createQuoteDto.projectId },
      });
      if (existingProject && existingProject.serviceTitanProjectId) {
        projectId = Number(existingProject.serviceTitanProjectId);
        this.logger.log(
          `Using existing ST Project ${projectId} for Quote ${quote.quoteNumber}`,
        );
      }
    }

    if (!projectId) {
      // 3. Create ST Location for this project address
      const address =
        createQuoteDto.projectAddress || 'Unknown Project Address';
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
      locationId = await this.serviceTitanService.createLocation(
        stCustomerId,
        street,
        city,
        state,
        zip,
      );

      // 4. Create ST Project
      this.logger.log(`Creating ST Project for Location ${locationId}`);
      const projectName = `Quote ${quote.quoteNumber}`;
      const projectSummary = `Scope: ${createQuoteDto.scope || 'N/A'}\nTier: ${createQuoteDto.tierLabel || 'N/A'}`;

      projectId = await this.serviceTitanService.createProject(
        stCustomerId,
        locationId,
        projectName,
        projectSummary,
      );
    }

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

    // 7. Sync projects to ensure the newly created ST Project is visible instantly
    this.logger.log(
      `Triggering project sync for company ${quote.companyId} to fetch new ST Project`,
    );
    this.projectsService
      .syncProjectsForCompany(quote.companyId)
      .catch((err) => {
        this.logger.error('Error syncing projects after quote creation', err);
      });
  }

  async findAll(user: JwtUser) {
    return this.prisma.quote.findMany({
      where: { companyId: user.companyId! },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: JwtUser) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId: id },
      include: { project: true },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.companyId !== user.companyId) {
      throw new UnauthorizedException('You do not have access to this quote');
    }

    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto, user: JwtUser) {
    const existingQuote = await this.findOne(id, user);
    
    // 1. Update in Local DB
    const updatedQuote = await this.prisma.quote.update({
      where: { quoteId: id },
      data: updateQuoteDto,
    });

    // 2. Sync to ServiceTitan if stEstimateId exists
    if (existingQuote.stEstimateId && updateQuoteDto.total !== undefined && updateQuoteDto.scope !== undefined) {
      try {
        await this.serviceTitanService.updateEstimate(
          existingQuote.stEstimateId,
          `Scope: ${updateQuoteDto.scope}\nTier: ${updateQuoteDto.tierLabel}\nQuote ID: ${existingQuote.quoteNumber}`,
          updateQuoteDto.total,
        );
        this.logger.log(`Successfully updated Estimate ${existingQuote.stEstimateId} in ST!`);
      } catch (err) {
        this.logger.error(`Failed to update Estimate ${existingQuote.stEstimateId} in ST. It might be sold or locked.`, err);
      }
    }

    return updatedQuote;
  }

  async remove(id: string, user: JwtUser) {
    await this.findOne(id, user);
    return this.prisma.quote.delete({
      where: { quoteId: id },
    });
  }
}
