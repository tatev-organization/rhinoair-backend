import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceTitanService } from '../service-titan/service-titan.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stService: ServiceTitanService,
  ) {}

  async getSTCustomers() {
    return this.stService.getCustomers();
  }

  async getPartners() {
    return this.prisma.company.findMany({
      include: {
        stCustomers: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            projects: true,
            quotes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPartnerById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId },
      include: {
        stCustomers: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            projects: true,
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Fetch all customers from ServiceTitan to map details
    const allSTCustomers = await this.getSTCustomers();
    
    // Augment the mapped ST Customer IDs with live ST Data
    const augmentedStCustomers = company.stCustomers.map((mapping) => {
      const stDetails = allSTCustomers.find(
        (c) => c.id.toString() === mapping.serviceTitanCustomerId.toString()
      );
      return {
        ...mapping,
        details: stDetails || null,
      };
    });

    return {
      ...company,
      stCustomers: augmentedStCustomers,
    };
  }

  async assignSTCustomer(companyId: string, serviceTitanCustomerId: string) {
    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Check if mapping already exists
    const existing = await this.prisma.companyServiceTitanCustomer.findUnique({
      where: {
        companyId_serviceTitanCustomerId: {
          companyId,
          serviceTitanCustomerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'This ServiceTitan Customer ID is already assigned to this partner.',
      );
    }

    // Create the mapping
    return this.prisma.companyServiceTitanCustomer.create({
      data: {
        companyId,
        serviceTitanCustomerId,
      },
    });
  }

  async removeSTCustomer(companyId: string, serviceTitanCustomerId: string) {
    try {
      await this.prisma.companyServiceTitanCustomer.delete({
        where: {
          companyId_serviceTitanCustomerId: {
            companyId,
            serviceTitanCustomerId,
          },
        },
      });
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Mapping not found');
    }
  }
}
