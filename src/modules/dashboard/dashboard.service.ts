import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import {
  ProjectStatus,
  QuoteStatus,
  InvoiceStatus,
  DocumentStatus,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(user: JwtUser) {
    if (!user.companyId) {
      throw new UnauthorizedException('User does not belong to a company');
    }

    const companyId = user.companyId;

    // Fetch Company Info
    const company = await this.prisma.company.findUnique({
      where: { companyId },
    });

    if (!company) {
      throw new UnauthorizedException('Company not found');
    }

    // 1. Stats
    const activeJobsCount = await this.prisma.project.count({
      where: { companyId, status: ProjectStatus.ACTIVE },
    });

    const openEstimatesCount = await this.prisma.quote.count({
      where: { companyId, status: QuoteStatus.SUBMITTED },
    });

    const unreadAlerts = await this.prisma.alert.findMany({
      where: { companyId, status: 'UNREAD' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const alerts: any[] = unreadAlerts.map(a => ({
      id: a.alertId,
      type: a.type,
      title: a.title,
      description: a.message,
      link: a.href || '#',
      icon: a.type === 'INVOICE_DUE' ? 'invoice' : 
            a.type === 'ESTIMATE_READY' ? 'doc' : 
            a.type === 'DOCUMENT_READY' ? 'sign' : 'bell',
    }));

    return {
      stats: {
        activeJobs: activeJobsCount,
        openEstimates: openEstimatesCount,
        approvedJobsYtd: company.approvedJobsYtd,
        annualGoal: company.annualGoal,
      },
      alerts,
    };
  }
}
