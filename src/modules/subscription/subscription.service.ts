import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  create(createSubscriptionDto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: createSubscriptionDto,
    });
  }

  findAll() {
    return this.prisma.subscription.findMany();
  }

  async findOne(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }
    return subscription;
  }

  update(subscriptionId: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.prisma.subscription.update({
      where: { subscriptionId },
      data: updateSubscriptionDto,
    });
  }

  remove(subscriptionId: string) {
    return this.prisma.subscription.delete({
      where: { subscriptionId },
    });
  }
}
