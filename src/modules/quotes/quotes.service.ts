import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthPartner {
  companyId: string;
}

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQuoteDto: CreateQuoteDto, partner: AuthPartner) {
    const quoteNumber = `RA-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.quote.create({
      data: {
        ...createQuoteDto,
        quoteNumber,
        companyId: partner.companyId,
      },
    });
  }

  async findAll(partner: AuthPartner) {
    return this.prisma.quote.findMany({
      where: { companyId: partner.companyId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, partner: AuthPartner) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId: id },
      include: { project: true },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.companyId !== partner.companyId) {
      throw new UnauthorizedException('You do not have access to this quote');
    }

    return quote;
  }

  async update(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    partner: AuthPartner,
  ) {
    await this.findOne(id, partner);
    return this.prisma.quote.update({
      where: { quoteId: id },
      data: updateQuoteDto,
    });
  }

  async remove(id: string, partner: AuthPartner) {
    await this.findOne(id, partner);
    return this.prisma.quote.delete({
      where: { quoteId: id },
    });
  }
}
