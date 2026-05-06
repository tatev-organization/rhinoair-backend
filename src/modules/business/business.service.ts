import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  create(createBusinessDto: CreateBusinessDto) {
    return this.prisma.businessInformation.create({
      data: createBusinessDto,
    });
  }

  findAll() {
    return this.prisma.businessInformation.findMany({
      include: { locations: true },
    });
  }

  async findOne(businessInformationId: string) {
    const business = await this.prisma.businessInformation.findUnique({
      where: { businessInformationId },
      include: { locations: true },
    });
    if (!business) {
      throw new NotFoundException(`Business with ID ${businessInformationId} not found`);
    }
    return business;
  }

  update(businessInformationId: string, updateBusinessDto: UpdateBusinessDto) {
    return this.prisma.businessInformation.update({
      where: { businessInformationId },
      data: updateBusinessDto,
    });
  }

  remove(businessInformationId: string) {
    return this.prisma.businessInformation.delete({
      where: { businessInformationId },
    });
  }
}
