import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  create(createAdminDto: CreateAdminDto) {
    return this.prisma.admin.create({
      data: createAdminDto,
    });
  }

  findAll() {
    return this.prisma.admin.findMany();
  }

  async findOne(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { adminId },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }
    return admin;
  }

  update(adminId: string, updateAdminDto: UpdateAdminDto) {
    return this.prisma.admin.update({
      where: { adminId },
      data: updateAdminDto,
    });
  }

  remove(adminId: string) {
    return this.prisma.admin.delete({
      where: { adminId },
    });
  }
}
