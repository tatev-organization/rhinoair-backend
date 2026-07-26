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

    const projects = await this.prisma.project.findMany({
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

    const quotes = await this.prisma.quote.findMany({
      where: { companyId: user.companyId!, projectId: null },
      orderBy: { createdAt: 'desc' },
    });

    const formattedQuotes = quotes.map((q) => ({
      ...q,
      id: q.quoteId,
      projectId: q.quoteId,
      name: q.projectAddress || q.builderName || 'New Quote',
      systemSummary: q.scope,
      status: 'QUOTED',
      quotedPrice: q.total,
      serviceTitanProjectId: q.stProjectId,
    }));

    return [...projects, ...formattedQuotes];
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

    // Loop through each mapped ST customer and fetch projects
    for (const mapping of company.stCustomers) {
      const stProjects = await this.stService.getProjectsByCustomerId(
        mapping.serviceTitanCustomerId,
      );

      for (const stProject of stProjects) {
        if (!stProject || !stProject.id) continue;

        stProjectIdsToUpsert.push(stProject.id.toString());

        // Upsert into local DB. We only create if it doesn't exist to preserve admin's phase/status
        const existing = await this.prisma.project.findFirst({
          where: { serviceTitanProjectId: stProject.id.toString() },
        });

        if (existing) {
          if (
            existing.builderName !== mapping.serviceTitanName &&
            mapping.serviceTitanName
          ) {
            await this.prisma.project.update({
              where: { projectId: existing.projectId },
              data: { builderName: mapping.serviceTitanName },
            });
          }
        }

        if (!existing) {
          const projectName =
            stProject.name || `ST Project #${stProject.number || stProject.id}`;

          const newProject = await this.prisma.project.create({
            data: {
              companyId,
              name: projectName,
              address: null, // Since ST Project doesn't necessarily have a deep location object in the summary view, or we can leave it null until we fetch location details if needed
              serviceTitanProjectId: stProject.id.toString(),
              builderName: mapping.serviceTitanName || 'Unknown Builder',
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
                    endDate: new Date(
                      new Date().setDate(new Date().getDate() + 7),
                    ),
                    tasks: {
                      create: [
                        {
                          name: 'Design & measuring',
                          sortOrder: 0,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Equipment / materials preparing',
                          sortOrder: 1,
                          status: 'NOT_STARTED',
                        },
                      ],
                    },
                  },
                  {
                    name: 'Rough-in',
                    status: 'UPCOMING',
                    sortOrder: 1,
                    tasks: {
                      create: [
                        {
                          name: 'Indoor units installation',
                          sortOrder: 0,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Ductwork rough-in (trunk & branch runs)',
                          sortOrder: 1,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Line sets, drains & low voltage',
                          sortOrder: 2,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Exhausts',
                          sortOrder: 3,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Ready for rough inspection',
                          sortOrder: 4,
                          status: 'NOT_STARTED',
                          isInspection: true,
                        },
                      ],
                    },
                  },
                  {
                    name: 'Finishing',
                    status: 'UPCOMING',
                    sortOrder: 2,
                    tasks: {
                      create: [
                        {
                          name: 'Outdoor units installation',
                          sortOrder: 0,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Registers, grilles & thermostats',
                          sortOrder: 1,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Electrical after disconnect box',
                          sortOrder: 2,
                          status: 'NOT_STARTED',
                        },
                        {
                          name: 'Startup, refrigerant balancing & test',
                          sortOrder: 3,
                          status: 'NOT_STARTED',
                        },
                      ],
                    },
                  },
                  {
                    name: 'Final Inspection',
                    status: 'UPCOMING',
                    sortOrder: 3,
                    tasks: {
                      create: [
                        {
                          name: 'Ready for final inspection',
                          sortOrder: 0,
                          status: 'NOT_STARTED',
                          isInspection: true,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          });

          // Link any orphaned quotes that belong to this newly created ST Project
          await this.prisma.quote.updateMany({
            where: { stProjectId: stProject.id.toString(), projectId: null },
            data: { projectId: newProject.projectId },
          });
        }

        // --- Sync Location ---
        const project = await this.prisma.project.findFirst({
          where: { serviceTitanProjectId: stProject.id.toString() },
        });

        if (project) {
          // Sync Location Address
          if (stProject.locationId) {
            const loc = await this.stService.getLocationById(
              stProject.locationId.toString(),
            );
            if (loc && loc.address) {
              const addr = loc.address;
              const formattedAddress = [
                addr.street,
                addr.city,
                addr.state,
                addr.zip,
              ]
                .filter(Boolean)
                .join(', ');
              await this.prisma.project.update({
                where: { projectId: project.projectId },
                data: { address: formattedAddress },
              });
            }
          }
        }
      }

      // --- Sync Invoices ---
      const invoices = await this.stService.getInvoicesByCustomerId(
        mapping.serviceTitanCustomerId,
      );
      for (const inv of invoices) {
        if (inv.projectId) {
          const project = await this.prisma.project.findFirst({
            where: { serviceTitanProjectId: inv.projectId.toString() },
          });

          if (project) {
            const isPaid = parseFloat(inv.balance || '0') === 0;
            await this.prisma.invoice.upsert({
              where: {
                companyId_invoiceNumber: {
                  companyId,
                  invoiceNumber: inv.id.toString(),
                },
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
                description: 'Project Invoice',
                status: isPaid ? 'PAID' : 'DUE',
                amount: parseFloat(inv.total || '0'),
                serviceTitanPayload: inv,
              },
            });
          }
        }
      }
    }
  }
  async syncChangeOrders(
    projectId: string,
    stProjectId: string,
    companyId: string,
  ) {
    const estimates = await this.stService.getChangeOrderEstimates(stProjectId);

    for (const est of estimates) {
      if (!est.id) continue;

      const stChangeOrderId = est.id.toString();

      // Parse name: "Change Order #1 - Additional Electrical Work"
      let number = `CO-${est.id}`;
      let title = est.name;

      const match = est.name.match(/Change Order #(\d+)\s*-\s*(.*)/i);
      if (match) {
        number = `CO-${match[1].padStart(2, '0')}`;
        title = match[2];
      }

      // Parse status
      let status: 'PENDING' | 'APPROVED' | 'DECLINED' = 'PENDING';
      const stStatus = est.status?.name?.toLowerCase();
      if (stStatus === 'sold') status = 'APPROVED';
      else if (stStatus === 'dismissed') status = 'DECLINED';

      // Ensure upsert uses existing record if we have it by ST ID to prevent duplicates
      const existing = await this.prisma.changeOrder.findFirst({
        where: { serviceTitanChangeOrderId: stChangeOrderId },
      });

      if (existing) {
        await this.prisma.changeOrder.update({
          where: { changeOrderId: existing.changeOrderId },
          data: {
            status,
            title,
            amount: parseFloat(est.subtotal || '0'),
          },
        });
      } else {
        // Prevent unique constraint violation on duplicate names (e.g. two "Change Order #1" in ST)
        const existingNumberCheck = await this.prisma.changeOrder.findUnique({
          where: {
            projectId_number: {
              projectId,
              number,
            },
          },
        });

        if (existingNumberCheck) {
          number = `${number}-${est.id}`;
        }

        await this.prisma.changeOrder.create({
          data: {
            companyId,
            projectId,
            number,
            title,
            amount: parseFloat(est.subtotal || '0'),
            status,
            serviceTitanChangeOrderId: stChangeOrderId,
          },
        });
      }
    }
  }

  async findOne(projectId: string, user: JwtUser) {
    let project = await this.prisma.project.findFirst({
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
        changeOrders: { orderBy: { createdAt: 'asc' } },
        quotes: { orderBy: { createdAt: 'desc' } },
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.serviceTitanProjectId) {
      await this.syncChangeOrders(
        project.projectId,
        project.serviceTitanProjectId,
        user.companyId!,
      );
      // Refetch change orders after sync
      project = await this.prisma.project.findFirst({
        where: { projectId },
        include: {
          company: true,
          phases: {
            orderBy: { sortOrder: 'asc' },
            include: {
              tasks: { orderBy: { sortOrder: 'asc' } },
            },
          },
          invoices: { orderBy: { createdAt: 'desc' } },
          documents: { orderBy: { createdAt: 'desc' } },
          photos: { orderBy: { createdAt: 'desc' } },
          changeOrders: { orderBy: { createdAt: 'asc' } },
          quotes: { orderBy: { createdAt: 'desc' } },
          alerts: { orderBy: { createdAt: 'desc' } },
        },
      });
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

  async decideChangeOrder(
    projectId: string,
    changeOrderId: string,
    isApproved: boolean,
    user: JwtUser,
  ) {
    const project = await this.findOne(projectId, user);

    const changeOrder = await this.prisma.changeOrder.findFirst({
      where: { changeOrderId, projectId },
    });

    if (!changeOrder) {
      throw new NotFoundException(`Change order not found`);
    }

    if (!changeOrder.serviceTitanChangeOrderId) {
      throw new ForbiddenException(`Cannot update change order without ST ID`);
    }

    const newStatus = isApproved ? 'APPROVED' : 'DECLINED';

    // Fetch user details for audit trail
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    const userName = dbUser?.name || 'Partner';
    const userEmail = dbUser?.email || 'Unknown';

    // Memo with audit trail
    const auditMemo = `${isApproved ? 'Approved' : 'Declined'} by: ${userName} (${userEmail}) via Portal at ${new Date().toISOString()}`;

    // Update in ServiceTitan
    if (isApproved) {
      await this.stService.sellEstimate(
        changeOrder.serviceTitanChangeOrderId,
        auditMemo,
      );
    } else {
      await this.stService.dismissEstimate(
        changeOrder.serviceTitanChangeOrderId,
        auditMemo,
      );
    }

    // Update in DB
    return this.prisma.changeOrder.update({
      where: { changeOrderId },
      data: { status: newStatus },
    });
  }
}
