import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketService {
  constructor(private prisma: PrismaService) {}

  create(createSupportTicketDto: CreateSupportTicketDto) {
    const { userIds, ...data } = createSupportTicketDto;
    return this.prisma.supportTicket.create({
      data: {
        ...data,
        users: userIds ? {
          connect: userIds.map(id => ({ userId: id }))
        } : undefined,
      },
      include: { users: true },
    });
  }

  findAll() {
    return this.prisma.supportTicket.findMany({
      include: { users: true },
    });
  }

  async findOne(supportTicketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { supportTicketId },
      include: { users: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Support ticket with ID ${supportTicketId} not found`);
    }
    return ticket;
  }

  update(supportTicketId: string, updateSupportTicketDto: UpdateSupportTicketDto) {
    const { userIds, ...data } = updateSupportTicketDto;
    return this.prisma.supportTicket.update({
      where: { supportTicketId },
      data: {
        ...data,
        users: userIds ? {
          set: userIds.map(id => ({ userId: id }))
        } : undefined,
      },
      include: { users: true },
    });
  }

  remove(supportTicketId: string) {
    return this.prisma.supportTicket.delete({
      where: { supportTicketId },
    });
  }
}
