import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCardInfoDto } from './dto/create-card-info.dto';
import { UpdateCardInfoDto } from './dto/update-card-info.dto';

@Injectable()
export class CardInfoService {
  constructor(private prisma: PrismaService) {}

  create(createCardInfoDto: CreateCardInfoDto) {
    return this.prisma.cardInfo.create({
      data: createCardInfoDto,
    });
  }

  findAll() {
    return this.prisma.cardInfo.findMany();
  }

  async findOne(cardInfoId: string) {
    const card = await this.prisma.cardInfo.findUnique({
      where: { cardInfoId },
    });
    if (!card) {
      throw new NotFoundException(`Card info with ID ${cardInfoId} not found`);
    }
    return card;
  }

  update(cardInfoId: string, updateCardInfoDto: UpdateCardInfoDto) {
    return this.prisma.cardInfo.update({
      where: { cardInfoId },
      data: updateCardInfoDto,
    });
  }

  remove(cardInfoId: string) {
    return this.prisma.cardInfo.delete({
      where: { cardInfoId },
    });
  }
}
