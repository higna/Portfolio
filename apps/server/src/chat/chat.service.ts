import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ChatHistory } from './entities/chat-history.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    private readonly genAI: GoogleGenerativeAI | undefined;
    private readonly model: GenerativeModel | undefined;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(ChatHistory)
        private readonly chatHistoryRepo: Repository<ChatHistory>,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    async sendMessage(
        userMessage: string,
        conversationId?: string,
        userId?: string,
    ): Promise<{ response: string; conversationId: string }> {
        const convId = conversationId || uuidv4();
        let aiResponse = '';

        if (this.model) {
            try {
                const result = await this.model.generateContent(userMessage);
                aiResponse = result.response.text();
            } catch (error: any) {
                this.logger.error(`Gemini API error: ${error.message}`);
                aiResponse = 'Sorry, I had trouble processing that request.';
            }
        } else {
            aiResponse = 'AI service is not configured.';
        }

        if (userId) {
            const entry = this.chatHistoryRepo.create({
                userId,
                userMessage,
                aiResponse,
                conversationId: convId,
            });
            await this.chatHistoryRepo.save(entry);
        }

        return { response: aiResponse, conversationId: convId };
    }

    async getHistory(userId: string): Promise<any[]> {
        const messages = await this.chatHistoryRepo.find({
            where: { userId },
            order: { createdAt: 'ASC' },
        });

        const conversations = new Map<string, any[]>();
        for (const msg of messages) {
            if (!conversations.has(msg.conversationId)) {
                conversations.set(msg.conversationId, []);
            }
            conversations.get(msg.conversationId)!.push({
                role: 'user',
                content: msg.userMessage,
                timestamp: msg.createdAt,
            });
            conversations.get(msg.conversationId)!.push({
                role: 'ai',
                content: msg.aiResponse,
                timestamp: msg.createdAt,
            });
        }

        return Array.from(conversations.entries()).map(([id, msgs]) => ({
            conversationId: id,
            messages: msgs,
        }));
    }
}