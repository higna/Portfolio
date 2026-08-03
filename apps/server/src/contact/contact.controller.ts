import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendMessage(
    @Body() body: { name: string; email: string; subject: string; message: string },
  ) {
    await this.contactService.sendContactMessage(body);
    return { message: 'Message sent successfully!' };
  }
}