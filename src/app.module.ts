import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { SystemModule } from './modules/system/system.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SupportTicketModule } from './modules/support-ticket/support-ticket.module';
import { ContactUsModule } from './modules/contact-us/contact-us.module';
import { CardInfoModule } from './modules/card-info/card-info.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { MailModule } from './modules/mail/mail.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    UsersModule,
    MailModule,
    BusinessModule,
    AdminModule,
    SystemModule,
    ActivityLogModule,
    NotificationModule,
    SupportTicketModule,
    ContactUsModule,
    CardInfoModule,
    SubscriptionModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
