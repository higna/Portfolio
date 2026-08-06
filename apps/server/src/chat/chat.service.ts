import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatUsageService } from './chat-usage.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    // Gemini
    private readonly geminiModels: GenerativeModel[] = [];
    private geminiIndex = 0;

    // Grok (xAI)
    private readonly grokKeys: string[] = [];
    private grokIndex = 0;

    // DeepSeek
    private readonly deepseekKeys: string[] = [];
    private deepseekIndex = 0;

    private systemPromptCache: string | null = null;
    private systemPromptCacheTime = 0;

    constructor(
        private readonly configService: ConfigService,
        private readonly usageService: ChatUsageService,
        private readonly portfolioService: PortfolioService,
        @InjectRepository(ChatHistory)
        private readonly chatHistoryRepo: Repository<ChatHistory>,
    ) {
        // ── Gemini keys ──
        const geminiKeysString = this.configService.get<string>('GEMINI_API_KEYS', '');
        const geminiKeys = geminiKeysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const singleKey = this.configService.get<string>('GEMINI_API_KEY', '');
        if (singleKey && !geminiKeys.includes(singleKey)) geminiKeys.push(singleKey);
        for (const key of geminiKeys) {
            const genAI = new GoogleGenerativeAI(key);
            this.geminiModels.push(genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }));
        }
        this.logger.log(`Loaded ${this.geminiModels.length} Gemini keys`);

        // ── Grok keys ──
        const grokString = this.configService.get<string>('GROK_API_KEYS', '');
        this.grokKeys.push(...grokString.split(',').map(k => k.trim()).filter(k => k.length > 0));
        this.logger.log(`Loaded ${this.grokKeys.length} Grok keys`);

        // ── DeepSeek keys ──
        const deepseekString = this.configService.get<string>('DEEPSEEK_API_KEYS', '');
        this.deepseekKeys.push(...deepseekString.split(',').map(k => k.trim()).filter(k => k.length > 0));
        this.logger.log(`Loaded ${this.deepseekKeys.length} DeepSeek keys`);
    }

    /* ─── System prompt (cached 5 min) ─── */
    private async buildSystemPrompt(): Promise<string> {
        const now = Date.now();
        if (this.systemPromptCache && now - this.systemPromptCacheTime < 5 * 60 * 1000) {
            return this.systemPromptCache;
        }
        try {
            const profile = await this.portfolioService.getProfile();
            const skills = await this.portfolioService.getSkills();
            const skillList = skills.map((s: any) => s.name).join(', ');
            this.systemPromptCache = `You are a helpful AI assistant on Hector Igna‑Igboko's portfolio website.
Your goal is to answer questions about Hector, his skills, his projects, and his professional experience.
Always be polite, concise, and truthful. Never invent roles or skills.

Here is his live CV data:
- Name: ${profile?.fullName || 'Hector Igna‑Igboko'}
- Summary: ${profile?.professionalSummary || 'Full‑Stack Developer & Data Engineer'}
- Phone: ${profile?.phone || ''}
- LinkedIn: ${profile?.linkedinUrl || ''}
- GitHub: ${profile?.githubUrl || ''}
- Skills: ${skillList}

If a user asks for a CV, generate a tailored version based on the job description they provide, using only the real information above.`;
            this.systemPromptCacheTime = now;
            return this.systemPromptCache;
        } catch {
            this.systemPromptCache = `You are a helpful AI assistant on Hector Igna‑Igboko's portfolio website. Answer questions about his work and skills accurately.`;
            this.systemPromptCacheTime = now;
            return this.systemPromptCache;
        }
    }

    createConversationId(): string {
        return uuidv4();
    }

    /* ─── Try Gemini ─── */
    private async tryGemini(userMessage: string): Promise<string | null> {
        if (this.geminiModels.length === 0) return null;
        let attempts = 0;
        while (attempts < this.geminiModels.length) {
            const model = this.geminiModels[(this.geminiIndex + attempts) % this.geminiModels.length];
            try {
                const systemPrompt = await this.buildSystemPrompt();
                const result = await model.generateContent([systemPrompt, userMessage]);
                this.geminiIndex = (this.geminiIndex + 1) % this.geminiModels.length;
                return result.response.text();
            } catch (error: any) {
                attempts++;
                this.logger.warn(`Gemini key ${(this.geminiIndex + attempts - 1) % this.geminiModels.length} failed: ${error.message}`);
                if (!error.message?.includes('429') && !error.message?.includes('quota')) break;
            }
        }
        return null;
    }

    /* ─── Try Grok ─── */
    private async tryGrok(userMessage: string): Promise<string | null> {
        if (this.grokKeys.length === 0) return null;
        const systemPrompt = await this.buildSystemPrompt();
        let attempts = 0;
        while (attempts < this.grokKeys.length) {
            const key = this.grokKeys[(this.grokIndex + attempts) % this.grokKeys.length];
            try {
                const response = await axios.post(
                    'https://api.x.ai/v1/chat/completions',
                    {
                        model: 'grok-2',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage },
                        ],
                    },
                    {
                         headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                        timeout: 30000,
                    },
                );
                this.grokIndex = (this.grokIndex + 1) % this.grokKeys.length;
                return response.data.choices[0].message.content;
            } catch (error: any) {
                attempts++;
                this.logger.warn(`Grok key ${(this.grokIndex + attempts - 1) % this.grokKeys.length} failed: ${error.message}`);
            }
        }
        return null;
    }

    /* ─── Try DeepSeek ─── */
    private async tryDeepSeek(userMessage: string): Promise<string | null> {
        if (this.deepseekKeys.length === 0) return null;
        const systemPrompt = await this.buildSystemPrompt();
        let attempts = 0;
        while (attempts < this.deepseekKeys.length) {
            const key = this.deepseekKeys[(this.deepseekIndex + attempts) % this.deepseekKeys.length];
            try {
                const response = await axios.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    {
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userMessage },
                        ],
                        stream: false,
                    },
                    {
                        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                        timeout: 60000,
                    },
                );
                this.deepseekIndex = (this.deepseekIndex + 1) % this.deepseekKeys.length;
                return response.data.choices[0].message.content;
            } catch (error: any) {
                attempts++;
                this.logger.warn(`DeepSeek key ${(this.deepseekIndex + attempts - 1) % this.deepseekKeys.length} failed: ${error.message}`);
            }
        }
        return null;
    }

    /* ─── Send message with multi‑provider fallback ─── */
    async sendMessage(
        userMessage: string,
        conversationId: string,
        userId?: string,
    ): Promise<{ response: string; conversationId: string; limitReached?: boolean }> {
        if (userId && !this.usageService.trackAndCheck(userId)) {
            return {
                response: 'You have reached your daily message limit (50 messages). Please try again tomorrow.',
                conversationId,
                limitReached: true,
            };
        }

        let aiResponse =
            (await this.tryGemini(userMessage)) ||
            (await this.tryGrok(userMessage)) ||
            (await this.tryDeepSeek(userMessage)) ||
            'All AI services are currently unavailable. Please try again later.';

        if (userId) {
            const entry = this.chatHistoryRepo.create({
                userId,
                userMessage,
                aiResponse,
                conversationId,
            });
            await this.chatHistoryRepo.save(entry);
        }

        return { response: aiResponse, conversationId, limitReached: false };
    }

    /* ── Conversation methods (unchanged) ── */
    async getConversations(userId: string): Promise<any[]> {
        const messages = await this.chatHistoryRepo.find({
            where: { userId },
            order: { createdAt: 'ASC' },
        });
        const convoMap = new Map<string, any>();
        for (const msg of messages) {
            if (!convoMap.has(msg.conversationId)) {
                convoMap.set(msg.conversationId, {
                    conversationId: msg.conversationId,
                    preview: msg.userMessage.substring(0, 50) + (msg.userMessage.length > 50 ? '…' : ''),
                    createdAt: msg.createdAt,
                });
            }
        }
        return Array.from(convoMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    async getHistory(userId: string, conversationId: string): Promise<any[]> {
        const messages = await this.chatHistoryRepo.find({
            where: { userId, conversationId },
            order: { createdAt: 'ASC' },
        });
        return messages
            .map((msg) => ({ role: 'user', content: msg.userMessage, timestamp: msg.createdAt }))
            .concat(
                messages.map((msg) => ({ role: 'ai', content: msg.aiResponse, timestamp: msg.createdAt })),
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        await this.chatHistoryRepo.delete({ conversationId, userId });
        this.logger.log(`Deleted conversation ${conversationId} for user ${userId}`);
    }
}