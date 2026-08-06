import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatUsageService } from './chat-usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatHistory]), PortfolioModule],
  controllers: [ChatController],
  providers: [ChatService, ChatUsageService],
  exports: [ChatService],
})
export class ChatModule {}