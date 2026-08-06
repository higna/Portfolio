import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatUsageService {
  private readonly logger = new Logger(ChatUsageService.name);
  private readonly usage = new Map<string, { date: string; count: number }>();
  private readonly DAILY_LIMIT = 50;

  trackAndCheck(userId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const record = this.usage.get(userId);

    if (!record || record.date !== today) {
      this.usage.set(userId, { date: today, count: 1 });
      return true;
    }

    if (record.count >= this.DAILY_LIMIT) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemaining(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const record = this.usage.get(userId);
    if (!record || record.date !== today) return this.DAILY_LIMIT;
    return Math.max(0, this.DAILY_LIMIT - record.count);
  }
}