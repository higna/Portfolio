import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly mailService: MailService) {}

  async sendContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    await this.mailService.sendContactNotification(data);
    this.logger.log(`Contact message from ${data.email} sent`);
  }
}