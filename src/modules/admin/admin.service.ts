import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceTitanService } from '../service-titan/service-titan.service';
import { ProjectsService } from '../projects/projects.service';
import { StorageService } from '../storage/storage.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stService: ServiceTitanService,
    private readonly projectsService: ProjectsService,
    private readonly storageService: StorageService,
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

    // Fetch ST Customer details to save the name
    let serviceTitanName = null;
    try {
      const allSTCustomers = await this.getSTCustomers();
      const stCustomer = allSTCustomers.find((c: any) => c.id.toString() === serviceTitanCustomerId.toString());
      if (stCustomer && stCustomer.name) {
        serviceTitanName = stCustomer.name;
      }
    } catch (err) {
      console.error('Failed to fetch ST customer details during assignment', err);
    }

    // Create the mapping
    const mapping = await this.prisma.companyServiceTitanCustomer.create({
      data: {
        companyId,
        serviceTitanCustomerId,
        serviceTitanName,
      },
    });

    // Automatically trigger sync for the assigned customer
    // so the admin panel and partner portal immediately reflect the changes!
    this.projectsService.syncProjectsForCompany(companyId).catch(err => {
      console.error(`Error auto-syncing ST customer ${serviceTitanCustomerId} for company ${companyId}:`, err);
    });

    return mapping;
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

  async updatePartnerTier(companyId: string, tier: number) {
    const company = await this.prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new NotFoundException('Partner not found');

    return this.prisma.company.update({
      where: { companyId },
      data: { tier },
    });
  }

  async getPartnerQuotes(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new NotFoundException('Partner not found');

    return this.prisma.quote.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
      },
    });
  }

  // --- Document & Photo Uploads ---
  async uploadProjectDocument(projectId: string, file: Express.Multer.File) {
    const project = await this.prisma.project.findUnique({ where: { projectId: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const result = await this.storageService.uploadFile(file.buffer, `rhino-air/projects/${projectId}/documents`, 'auto');

    return this.prisma.document.create({
      data: {
        companyId: project.companyId,
        projectId: project.projectId,
        name: file.originalname,
        fileUrl: result.secure_url,
        fileKey: result.public_id,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: 'ADMIN',
      },
    });
  }

  async uploadProjectPhoto(projectId: string, file: Express.Multer.File) {
    const project = await this.prisma.project.findUnique({ where: { projectId: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const result = await this.storageService.uploadFile(file.buffer, `rhino-air/projects/${projectId}/photos`, 'image');

    return this.prisma.photo.create({
      data: {
        companyId: project.companyId,
        projectId: project.projectId,
        title: file.originalname,
        imageUrl: result.secure_url,
        imageKey: result.public_id,
      },
    });
  }

  async getProjectDocuments(projectId: string) {
    return this.prisma.document.findMany({
      where: { projectId: projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectPhotos(projectId: string) {
    return this.prisma.photo.findMany({
      where: { projectId: projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
