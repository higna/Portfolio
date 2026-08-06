import { Controller, Post, Body, Req, Get, Delete, Param, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() body: { message: string; conversationId?: string },
    @Req() req: Request,
  ) {
    let userId: string | undefined;
    if ((req as any).user) {
      userId = (req as any).user.id;
    }
    const convId = body.conversationId || this.chatService.createConversationId();
    return this.chatService.sendMessage(body.message, convId, userId);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.chatService.getConversations(userId);
  }

  @Get('history/:conversationId')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = (req as any).user.id;
    return this.chatService.getHistory(userId, conversationId);
  }

  @Delete('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  async deleteConversation(
    @Req() req: Request,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = (req as any).user.id;
    await this.chatService.deleteConversation(conversationId, userId);
    return { message: 'Conversation deleted' };
  }
}