import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtUser) {
    return this.prisma.invoice.findMany({
      where: { companyId: user.companyId! },
      include: {
        project: {
          select: {
            address: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
