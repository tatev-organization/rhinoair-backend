import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { join } from 'path';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST') || process.env.MAIL_HOST,
          port:
            config.get<number>('MAIL_PORT') ||
            parseInt(process.env.MAIL_PORT || '587', 10),
          auth: {
            user: config.get<string>('MAIL_USER') || process.env.MAIL_USER,
            pass: config.get<string>('MAIL_PASS') || process.env.MAIL_PASS,
          },
        },
        defaults: {
          from:
            config.get<string>('MAIL_FROM') ||
            process.env.MAIL_FROM ||
            '"Rhino Air Portal" <noreply@rhinoair.com>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
