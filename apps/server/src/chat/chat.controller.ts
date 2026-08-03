import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('message')
    async sendMessage(
        @Body() body: { message: string; conversationId?: string },
        @Req() req: Request,
    ) {
        // Extract user from request if authenticated (JWT guard is optional here)
        let userId: string | undefined;
        if ((req as any).user) {
            userId = (req as any).user.id;
        }

        const result = await this.chatService.sendMessage(
            body.message,
            body.conversationId,
            userId,
        );
        return result;
    }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getHistory(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.chatService.getHistory(userId);
    }
}