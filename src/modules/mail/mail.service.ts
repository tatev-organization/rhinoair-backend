import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationCode(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Rhino Air Portal - Verify Your Email',
      template: './verification',
      context: {
        code,
      },
    });
  }

  async sendPasswordReset(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Rhino Air Portal - Password Reset Request',
      template: './password-reset',
      context: {
        code,
      },
    });
  }

  async sendQuoteSubmittedNotification(to: string, quoteNumber: string) {
    await this.mailerService.sendMail({
      to,
      subject: `New Rhino Air quote submitted: ${quoteNumber}`,
      text: `A new partner quote has been submitted. Quote number: ${quoteNumber}`,
    });
  }
}
