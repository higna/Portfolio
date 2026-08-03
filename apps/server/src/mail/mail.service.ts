import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY', '');
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL', '');
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME', 'Hector Portfolio');
  }

  /*
   * Send verification email with the new card design.
   */
  async sendVerificationEmail(toEmail: string, token: string, frontendUrl: string): Promise<void> {
    const link = `${frontendUrl}/verify-email?token=${token}`;
    const html = this.cardTemplate({
      title: 'Hector Portfolio',
      subtitle: 'Verify your email',
      body: `
        <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">Welcome to Hector's portfolio,</p>
        <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">Click the button below to verify your email and activate your account.</p>
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:#D4AF37;color:#0B0A08;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-bottom:24px;">Verify Email</a>
        <p style="margin:0 0 8px;font-size:14px;color:#666;">Or copy this link into your browser:</p>
        <p style="margin:0 0 24px;font-size:14px;color:#999;word-break:break-all;">${link}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#999;">This link expires in 2 days.</p>
        <p style="margin:0;font-size:13px;color:#999;">If you did not request this, kindly ignore.</p>
      `,
    });
    await this.sendEmail(toEmail, 'Verify your email – Hector Portfolio', html);
  }

  /*
   * Send password reset email with the new card design.
   */
  async sendPasswordResetEmail(toEmail: string, token: string, frontendUrl: string): Promise<void> {
    const link = `${frontendUrl}/reset-password?token=${token}`;
    const html = this.cardTemplate({
      title: 'Hector Portfolio',
      subtitle: 'Reset your password',
      body: `
        <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">You requested a password reset.</p>
        <p style="margin:0 0 24px;font-size:16px;color:#1a1a1a;">Click the button below to choose a new password.</p>
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:#D4AF37;color:#0B0A08;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-bottom:24px;">Reset Password</a>
        <p style="margin:0 0 8px;font-size:14px;color:#666;">Or copy this link into your browser:</p>
        <p style="margin:0 0 24px;font-size:14px;color:#999;word-break:break-all;">${link}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#999;">This link expires in 1 hour.</p>
        <p style="margin:0;font-size:13px;color:#999;">If you did not request this, kindly ignore.</p>
      `,
    });
    await this.sendEmail(toEmail, 'Reset your password – Hector Portfolio', html);
  }

  /*
   * Send a contact form notification to the portfolio owner.
   */
  async sendContactNotification(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const recipientEmail =
      this.configService.get<string>('CONTACT_EMAIL') ||
      this.configService.get<string>('BREVO_SENDER_EMAIL');

    if (!recipientEmail) {
      throw new Error('No recipient email configured');
    }

    const html = this.cardTemplate({
      title: 'New message from my portfolio',
      subtitle: data.name,
      body: `
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#666;">Sender: </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#1a1a1a;font-weight:500;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#666;">Email: </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#1a1a1a;font-weight:500;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#666;">Subject: </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#1a1a1a;font-weight:500;">${data.subject}</td>
          </tr>
        </table>
        <p style="margin:24px 0 8px;font-size:14px;color:#666;">Message:</p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${data.message}</p>
      `,
    });

    await this.sendEmail(recipientEmail, `Portfolio Contact: ${data.subject}`, html);
  }

  /*
   * Send a generic email (used internally by the methods above).
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  /*
   * Shared card template: dark header (black bg, gold text) + white body.
   */
  private cardTemplate(opts: { title: string; subtitle?: string; body: string }): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

            <!-- Dark header -->
            <tr>
              <td style="background:#0B0A08;padding:28px 32px;text-align:center;">
                <h1 style="margin:0;font-size:22px;color:#D4AF37;font-weight:700;">${opts.title}</h1>
                ${opts.subtitle ? `<p style="margin:8px 0 0;font-size:15px;color:#D4AF37;opacity:0.85;">${opts.subtitle}</p>` : ''}
              </td>
            </tr>

            <!-- White body -->
            <tr>
              <td style="background:#ffffff;padding:32px;">
                ${opts.body}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:16px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Hector Igna-Igboko. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
  }
}