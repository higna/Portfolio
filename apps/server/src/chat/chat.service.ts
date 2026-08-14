import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatUsageService } from './chat-usage.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openaiKeys: string[] = [];
  private openaiIndex = 0;
  private readonly groqKeys: string[] = [];
  private groqIndex = 0;

  private systemPromptCache: string | null = null;
  private systemPromptCacheTime = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly usageService: ChatUsageService,
    private readonly portfolioService: PortfolioService,
    @InjectRepository(ChatHistory)
    private readonly chatHistoryRepo: Repository<ChatHistory>,
  ) {
    const openaiString = this.configService.get<string>('OPENAI_API_KEYS', '');
    const openaiSingle = this.configService.get<string>('OPENAI_API_KEY', '');
    const openaiList = openaiString
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    if (openaiSingle && !openaiList.includes(openaiSingle)) {
      openaiList.push(openaiSingle);
    }
    this.openaiKeys.push(...openaiList);
    this.logger.log(`Loaded ${this.openaiKeys.length} OpenAI key(s)`);

    const groqString = this.configService.get<string>('GROQ_API_KEYS', '');
    this.groqKeys.push(
      ...groqString
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0),
    );
    this.logger.log(`Loaded ${this.groqKeys.length} Groq key(s)`);
  }

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

If a user asks for a CV, cover letter, or any document, generate the text content for it. Also mention that they can click the "Download PDF" button below your response to save it as a PDF. Do not say you cannot generate PDFs — the platform provides the PDF conversion automatically.`;

      this.systemPromptCacheTime = now;
      return this.systemPromptCache;
    } catch {
      this.systemPromptCache = `You are a helpful AI assistant on Hector Igna‑Igboko's portfolio website. Answer questions about his work and skills accurately. If asked for a PDF, provide the text content and mention the download button.`;
      this.systemPromptCacheTime = now;
      return this.systemPromptCache;
    }
  }

  createConversationId(): string {
    return uuidv4();
  }

  private async tryOpenAI(userMessage: string): Promise<string | null> {
    if (this.openaiKeys.length === 0) return null;
    const systemPrompt = await this.buildSystemPrompt();
    let attempts = 0;
    while (attempts < this.openaiKeys.length) {
      const key = this.openaiKeys[(this.openaiIndex + attempts) % this.openaiKeys.length];
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );
        this.openaiIndex = (this.openaiIndex + 1) % this.openaiKeys.length;
        return response.data.choices[0].message.content;
      } catch (error: any) {
        attempts++;
        this.logger.warn(
          `OpenAI key ${(this.openaiIndex + attempts - 1) % this.openaiKeys.length} failed: ${error.message}`,
        );
      }
    }
    return null;
  }

  private async tryGroq(userMessage: string): Promise<string | null> {
    if (this.groqKeys.length === 0) return null;
    const systemPrompt = await this.buildSystemPrompt();
    let attempts = 0;
    while (attempts < this.groqKeys.length) {
      const key = this.groqKeys[(this.groqIndex + attempts) % this.groqKeys.length];
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );
        this.groqIndex = (this.groqIndex + 1) % this.groqKeys.length;
        return response.data.choices[0].message.content;
      } catch (error: any) {
        attempts++;
        this.logger.warn(
          `Groq key ${(this.groqIndex + attempts - 1) % this.groqKeys.length} failed: ${error.message}`,
        );
      }
    }
    return null;
  }

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
      (await this.tryOpenAI(userMessage)) ||
      (await this.tryGroq(userMessage)) ||
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
          preview:
            msg.userMessage.substring(0, 50) +
            (msg.userMessage.length > 50 ? '…' : ''),
          createdAt: msg.createdAt,
          updatedAt: msg.createdAt,
        });
      } else {
        const conv = convoMap.get(msg.conversationId);
        conv.updatedAt = msg.createdAt;
      }
    }

    return Array.from(convoMap.values())
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(({ updatedAt, ...rest }) => rest);
  }

  async getHistory(userId: string, conversationId: string): Promise<any[]> {
    const messages = await this.chatHistoryRepo.find({
      where: { userId, conversationId },
      order: { createdAt: 'ASC' },
    });
    return messages
      .map((msg) => ({
        role: 'user',
        content: msg.userMessage,
        timestamp: msg.createdAt,
      }))
      .concat(
        messages.map((msg) => ({
          role: 'ai',
          content: msg.aiResponse,
          timestamp: msg.createdAt,
        })),
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    await this.chatHistoryRepo.delete({ conversationId, userId });
    this.logger.log(`Deleted conversation ${conversationId} for user ${userId}`);
  }
}