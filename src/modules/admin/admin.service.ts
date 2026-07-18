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
        (c) => c.id.toString() === mapping.serviceTitanCustomerId.toString(),
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

  async getAllProjects() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { name: true },
        },
      },
    });
  }

  async updateProjectPhase(projectId: string, dto: any) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    // Determine dynamic dates based on phase progression
    let updateData: any = {
      currentPhaseIndex: dto.currentPhaseIndex,
      currentPhase: dto.currentPhase,
      phaseClass: dto.phaseClass,
      status: dto.currentPhaseIndex === 3 ? 'COMPLETED' : 'ACTIVE',
    };

    if (dto.currentPhaseIndex >= 1 && !project.startDate) {
      updateData.startDate = new Date();
    }
    if (dto.currentPhaseIndex >= 2 && !project.roughInspectionAt) {
      updateData.roughInspectionAt = new Date();
    }
    if (dto.currentPhaseIndex === 3 && !project.finalInspectionAt) {
      updateData.finalInspectionAt = new Date();
    }

    return this.prisma.project.update({
      where: { projectId },
      data: updateData,
    });
  }

  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      include: {
        company: true,
        phases: {
          orderBy: { sortOrder: 'asc' },
          include: {
            tasks: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        invoices: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        photos: { orderBy: { createdAt: 'desc' } },
        changeOrders: { orderBy: { createdAt: 'desc' } },
        quotes: { orderBy: { createdAt: 'desc' } },
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return project;
  }

  async updateTaskStatus(projectId: string, taskId: string, status: any) {
    const task = await this.prisma.projectTask.findUnique({
      where: { taskId },
      include: { phase: true },
    });
    if (!task || task.phase.projectId !== projectId) {
      throw new NotFoundException('Task not found for this project');
    }

    return this.prisma.projectTask.update({
      where: { taskId },
      data: { status },
    });
  }
}
