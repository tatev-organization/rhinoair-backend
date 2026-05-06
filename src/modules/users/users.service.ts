import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        businessInformation: true,
        notifications: true,
        subscriptions: true,
        cardInfo: true,
        supportTickets: true,
      }
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        businessInformation: true,
        notifications: true,
        subscriptions: true,
        cardInfo: true,
        supportTickets: true,
      }
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { userId },
      data,
    });
  }

  remove(userId: string) {
    return this.prisma.user.delete({
      where: { userId },
    });
  }

  async verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
