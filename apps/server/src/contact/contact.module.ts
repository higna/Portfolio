import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports: [MailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}