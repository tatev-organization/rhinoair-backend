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

  async sendQuoteSubmittedNotification(to: string, quoteData: any) {
    const quoteNumber = quoteData.quoteNumber || 'Unknown';
    const builder = quoteData.builderName || 'Unknown Builder';
    const tier = quoteData.tierLabel || 'Unknown Tier';
    const total = quoteData.total || 0;
    const scope = quoteData.scope || 'N/A';
    const address = quoteData.projectAddress || 'N/A';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2b3a4a; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">
          New Quote Submitted
        </h2>
        <p>A new partner quote has been successfully generated and submitted.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Quote Number:</td>
            <td style="padding: 8px 0;">${quoteNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Builder / Partner:</td>
            <td style="padding: 8px 0;">${builder}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Project Address:</td>
            <td style="padding: 8px 0;">${address}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Tier:</td>
            <td style="padding: 8px 0;">${tier}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Scope:</td>
            <td style="padding: 8px 0;">${scope}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-top: 2px solid #eaeaea; padding-top: 15px;">Grand Total:</td>
            <td style="padding: 8px 0; font-weight: bold; font-size: 1.2em; color: #27ae60; border-top: 2px solid #eaeaea; padding-top: 15px;">
              ${formatter.format(total)}
            </td>
          </tr>
        </table>
        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
          This quote has been automatically synced to ServiceTitan.
        </p>
      </div>
    `;

    await this.mailerService.sendMail({
      to,
      subject: `New Rhino Air quote submitted: ${quoteNumber}`,
      html: htmlContent,
    });
  }
}
