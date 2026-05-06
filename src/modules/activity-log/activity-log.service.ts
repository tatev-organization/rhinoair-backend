import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  create(createActivityLogDto: CreateActivityLogDto) {
    return this.prisma.activityLog.create({
      data: createActivityLogDto,
    });
  }

  findAll() {
    return this.prisma.activityLog.findMany();
  }

  async findOne(activityLogId: string) {
    const log = await this.prisma.activityLog.findUnique({
      where: { activityLogId },
    });
    if (!log) {
      throw new NotFoundException(`Activity log with ID ${activityLogId} not found`);
    }
    return log;
  }

  update(activityLogId: string, updateActivityLogDto: UpdateActivityLogDto) {
    return this.prisma.activityLog.update({
      where: { activityLogId },
      data: updateActivityLogDto,
    });
  }

  remove(activityLogId: string) {
    return this.prisma.activityLog.delete({
      where: { activityLogId },
    });
  }
}
