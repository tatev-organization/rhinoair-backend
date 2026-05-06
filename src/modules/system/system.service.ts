import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  create(createSystemDto: CreateSystemDto) {
    return this.prisma.system.create({
      data: createSystemDto,
    });
  }

  findAll() {
    return this.prisma.system.findMany();
  }

  async findOne(systemId: string) {
    const system = await this.prisma.system.findUnique({
      where: { systemId },
    });
    if (!system) {
      throw new NotFoundException(`System settings with ID ${systemId} not found`);
    }
    return system;
  }

  update(systemId: string, updateSystemDto: UpdateSystemDto) {
    return this.prisma.system.update({
      where: { systemId },
      data: updateSystemDto,
    });
  }

  remove(systemId: string) {
    return this.prisma.system.delete({
      where: { systemId },
    });
  }
}
