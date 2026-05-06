import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';

@Injectable()
export class ContactUsService {
  constructor(private prisma: PrismaService) {}

  create(createContactUsDto: CreateContactUsDto) {
    return this.prisma.contactUs.create({
      data: createContactUsDto,
    });
  }

  findAll() {
    return this.prisma.contactUs.findMany();
  }

  async findOne(contactUsId: string) {
    const contact = await this.prisma.contactUs.findUnique({
      where: { contactUsId },
    });
    if (!contact) {
      throw new NotFoundException(`Contact request with ID ${contactUsId} not found`);
    }
    return contact;
  }

  update(contactUsId: string, updateContactUsDto: UpdateContactUsDto) {
    return this.prisma.contactUs.update({
      where: { contactUsId },
      data: updateContactUsDto,
    });
  }

  remove(contactUsId: string) {
    return this.prisma.contactUs.delete({
      where: { contactUsId },
    });
  }
}
