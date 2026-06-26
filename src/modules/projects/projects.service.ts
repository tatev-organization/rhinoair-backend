import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type AuthUser = {
  userId: string;
  role: string;
  companyId?: string;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    const where = this.isPartner(user)
      ? { companyId: this.requirePartnerCompany(user) }
      : {};

    return this.prisma.project.findMany({
      where,
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

  async findOne(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        projectId,
        ...(this.isPartner(user)
          ? { companyId: this.requirePartnerCompany(user) }
          : {}),
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

  create(createProjectDto: CreateProjectDto, user: AuthUser) {
    const companyId = this.resolveCompanyId(createProjectDto.companyId, user);
    const { companyId: _ignoredCompanyId, ...projectData } = createProjectDto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        companyId,
      } as any,
    });
  }

  async update(projectId: string, updateProjectDto: UpdateProjectDto, user: AuthUser) {
    await this.findOne(projectId, user);
    const { companyId: requestedCompanyId, ...projectData } = updateProjectDto;

    if (this.isPartner(user) && requestedCompanyId) {
      throw new ForbiddenException('Partners cannot move projects between companies');
    }

    return this.prisma.project.update({
      where: { projectId },
      data: {
        ...projectData,
        ...(requestedCompanyId && !this.isPartner(user)
          ? { companyId: requestedCompanyId }
          : {}),
      } as any,
    });
  }

  async remove(projectId: string, user: AuthUser) {
    await this.findOne(projectId, user);

    return this.prisma.project.delete({
      where: { projectId },
    });
  }

  private isPartner(user: AuthUser) {
    return user.role === 'PARTNER';
  }

  private requirePartnerCompany(user: AuthUser) {
    if (!user.companyId) {
      throw new BadRequestException('Partner user is not linked to a company');
    }

    return user.companyId;
  }

  private resolveCompanyId(requestedCompanyId: string | undefined, user: AuthUser) {
    if (this.isPartner(user)) {
      return this.requirePartnerCompany(user);
    }

    if (!requestedCompanyId) {
      throw new BadRequestException('companyId is required when admin creates a project');
    }

    return requestedCompanyId;
  }
}
