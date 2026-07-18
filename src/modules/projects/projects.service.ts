import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtUser } from '../../common/decorators/current-user.decorator';

import { ServiceTitanService } from '../service-titan/service-titan.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stService: ServiceTitanService,
  ) {}

  async findAll(user: JwtUser) {
    // 1. Sync projects for the company first
    await this.syncProjectsForCompany(user.companyId!);

    // 2. Return the updated local DB list
    return this.prisma.project.findMany({
      where: { companyId: user.companyId! },
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

  // Sync projects from ST to local DB for all mapped customers of a company
  async syncProjectsForCompany(companyId: string) {
    // Get company's mapped ST customers
    const company = await this.prisma.company.findUnique({
      where: { companyId },
      include: { stCustomers: true },
    });

    if (!company || !company.stCustomers || company.stCustomers.length === 0) {
      return;
    }

    const stProjectIdsToUpsert: string[] = [];

    // Loop through each mapped ST customer and fetch jobs
    for (const mapping of company.stCustomers) {
      const stJobs = await this.stService.getJobsByCustomerId(mapping.serviceTitanCustomerId);
      
      for (const stJob of stJobs) {
        if (!stJob || !stJob.id) continue;
        
        stProjectIdsToUpsert.push(stJob.id.toString());

        // Upsert into local DB. We only create if it doesn't exist to preserve admin's phase/status
        const existing = await this.prisma.project.findFirst({
          where: { serviceTitanProjectId: stJob.id.toString() }
        });

        if (!existing) {
          const jobName = stJob.jobType?.name 
            ? `${stJob.jobType.name} - #${stJob.number || stJob.id}` 
            : `ST Job #${stJob.number || stJob.id}`;

          await this.prisma.project.create({
            data: {
              companyId,
              name: jobName,
              address: stJob.location?.address?.street || null,
              serviceTitanProjectId: stJob.id.toString(),
              status: 'ACTIVE',
              currentPhaseIndex: 0,
              currentPhase: 'Planning',
              phaseClass: 'planning',
              phases: {
                create: [
                  {
                    name: 'Planning',
                    status: 'CURRENT',
                    sortOrder: 0,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                    tasks: {
                      create: [
                        { name: 'Design & measuring', sortOrder: 0, status: 'NOT_STARTED' },
                        { name: 'Equipment / materials preparing', sortOrder: 1, status: 'NOT_STARTED' },
                      ]
                    }
                  },
                  {
                    name: 'Rough-in',
                    status: 'UPCOMING',
                    sortOrder: 1,
                    tasks: {
                      create: [
                        { name: 'Indoor units installation', sortOrder: 0, status: 'NOT_STARTED' },
                        { name: 'Ductwork rough-in (trunk & branch runs)', sortOrder: 1, status: 'NOT_STARTED' },
                        { name: 'Line sets, drains & low voltage', sortOrder: 2, status: 'NOT_STARTED' },
                        { name: 'Exhausts', sortOrder: 3, status: 'NOT_STARTED' },
                        { name: 'Ready for rough inspection', sortOrder: 4, status: 'NOT_STARTED', isInspection: true },
                      ]
                    }
                  },
                  {
                    name: 'Finishing',
                    status: 'UPCOMING',
                    sortOrder: 2,
                    tasks: {
                      create: [
                        { name: 'Outdoor units installation', sortOrder: 0, status: 'NOT_STARTED' },
                        { name: 'Registers, grilles & thermostats', sortOrder: 1, status: 'NOT_STARTED' },
                        { name: 'Electrical after disconnect box', sortOrder: 2, status: 'NOT_STARTED' },
                        { name: 'Startup, refrigerant balancing & test', sortOrder: 3, status: 'NOT_STARTED' },
                      ]
                    }
                  },
                  {
                    name: 'Final Inspection',
                    status: 'UPCOMING',
                    sortOrder: 3,
                    tasks: {
                      create: [
                        { name: 'Ready for final inspection', sortOrder: 0, status: 'NOT_STARTED', isInspection: true },
                      ]
                    }
                  }
                ]
              }
            }
          });
        }

        // --- Sync Location and Invoices ---
        const project = await this.prisma.project.findFirst({
          where: { serviceTitanProjectId: stJob.id.toString() }
        });

        if (project) {
          // Sync Location Address
          if (stJob.locationId) {
            const loc = await this.stService.getLocationById(stJob.locationId.toString());
            if (loc && loc.address) {
              const addr = loc.address;
              const formattedAddress = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
              await this.prisma.project.update({
                where: { projectId: project.projectId },
                data: { address: formattedAddress }
              });
            }
          }

          // Sync Invoices
          if (stJob.invoiceId) {
            const invoices = await this.stService.getInvoicesByIds(stJob.invoiceId.toString());
            for (const inv of invoices) {
              const isPaid = parseFloat(inv.balance || '0') === 0;
              await this.prisma.invoice.upsert({
                where: { 
                  companyId_invoiceNumber: { companyId, invoiceNumber: inv.id.toString() } 
                },
                update: {
                  status: isPaid ? 'PAID' : 'DUE',
                  amount: parseFloat(inv.total || '0'),
                  serviceTitanPayload: inv,
                },
                create: {
                  companyId,
                  projectId: project.projectId,
                  serviceTitanInvoiceId: inv.id.toString(),
                  invoiceNumber: inv.id.toString(),
                  description: 'Job Invoice',
                  status: isPaid ? 'PAID' : 'DUE',
                  amount: parseFloat(inv.total || '0'),
                  serviceTitanPayload: inv,
                }
              });
            }
          }
        }

      }
    }
  }
  async findOne(projectId: string, user: JwtUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        projectId,
        companyId: user.companyId!,
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

  create(createProjectDto: CreateProjectDto, user: JwtUser) {
    const { companyId: _ignoredCompanyId, ...projectData } = createProjectDto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        companyId: user.companyId!,
      } as any,
    });
  }

  async update(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    user: JwtUser,
  ) {
    await this.findOne(projectId, user);
    const { companyId: requestedCompanyId, ...projectData } = updateProjectDto;

    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new ForbiddenException(
        'Partners cannot move projects to other companies',
      );
    }

    return this.prisma.project.update({
      where: { projectId },
      data: projectData as any,
    });
  }

  async remove(projectId: string, user: JwtUser) {
    await this.findOne(projectId, user);

    return this.prisma.project.delete({
      where: { projectId },
    });
  }
}
