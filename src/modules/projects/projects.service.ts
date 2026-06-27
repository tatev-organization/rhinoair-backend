import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export interface AuthPartner {
  companyId: string;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(partner: AuthPartner) {
    return this.prisma.project.findMany({
      where: { companyId: partner.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        _count: {
          select: {
            invoices: true,
            documents: true,
            photos: true,
            changeOrders: true,
            phases: true,
          },
        },
      },
    });
  }

  async findOne(projectId: string, partner: AuthPartner) {
    const project = await this.prisma.project.findFirst({
      where: {
        projectId,
        companyId: partner.companyId,
      },
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

  create(createProjectDto: CreateProjectDto, partner: AuthPartner) {
    const { companyId: _ignoredCompanyId, ...projectData } = createProjectDto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        companyId: partner.companyId,
      } as any,
    });
  }

  async update(projectId: string, updateProjectDto: UpdateProjectDto, partner: AuthPartner) {
    await this.findOne(projectId, partner);
    const { companyId: requestedCompanyId, ...projectData } = updateProjectDto;

    if (requestedCompanyId && requestedCompanyId !== partner.companyId) {
      throw new ForbiddenException('Partners cannot move projects to other companies');
    }

    return this.prisma.project.update({
      where: { projectId },
      data: projectData as any,
    });
  }

  async remove(projectId: string, partner: AuthPartner) {
    await this.findOne(projectId, partner);

    return this.prisma.project.delete({
      where: { projectId },
    });
  }
}
