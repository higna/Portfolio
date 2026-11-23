import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

const INTERVAL_MINUTES = 10;
const PING_TIMEOUT_MS = 10_000;

export interface KeepAliveState {
  enabled: boolean;
  intervalMinutes: number;
  lastPingAt: string | null;
  lastPingOk: boolean;
  lastPingError: string | null;
  pingCount: number;
  pingUrl: string;
}

export interface PingResult {
  ok: boolean;
  error: string | null;
  url: string;
  at: string;
}

@Injectable()
export class HealthPingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HealthPingService.name);
  private readonly pingUrl: string;
  private enabled = true;
  private lastPingAt: Date | null = null;
  private lastPingOk = false;
  private lastPingError: string | null = null;
  private pingCount = 0;
  private lastActionAt = 0;

  constructor(private readonly config: ConfigService) {
    const port = process.env.PORT || this.config.get<string>('BACKEND_PORT') || '2500';
    const base = (this.config.get<string>('BACKEND_URL') || `http://127.0.0.1:${port}`).replace(/\/$/, '');
    const path = this.config.get<string>('KEEP_ALIVE_PING_PATH') || '/health/live';
    this.pingUrl = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  onApplicationBootstrap(): void {
    this.enabled = this.config.get<string>('KEEP_ALIVE_ENABLED') !== 'false';
    if (this.enabled) void this.pingNow();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingSelf(): Promise<void> {
    if (this.enabled) await this.pingNow();
  }

  async pingNow(): Promise<PingResult> {
    this.pingCount += 1;
    const at = new Date();
    try {
      const response = await fetch(this.pingUrl, { signal: AbortSignal.timeout(PING_TIMEOUT_MS) });
      this.lastPingAt = at;
      this.lastPingOk = response.ok;
      this.lastPingError = response.ok ? null : `HTTP ${response.status}`;
      const message = `Keep-alive ping ${this.pingUrl} -> ${response.status}`;
      response.ok ? this.logger.log(message) : this.logger.warn(message);
    } catch (error) {
      this.lastPingAt = at;
      this.lastPingOk = false;
      this.lastPingError = (error as Error).message;
      this.logger.warn(`Keep-alive ping failed: ${this.lastPingError}`);
    }
    return { ok: this.lastPingOk, error: this.lastPingError, url: this.pingUrl, at: at.toISOString() };
  }

  async toggle(): Promise<KeepAliveState> {
    this.enforceCooldown();
    this.enabled = !this.enabled;
    this.lastActionAt = Date.now();
    if (this.enabled) await this.pingNow();
    return this.getState();
  }

  async manualPing(): Promise<PingResult> {
    this.enforceCooldown();
    this.lastActionAt = Date.now();
    return this.pingNow();
  }

  getState(): KeepAliveState {
    return {
      enabled: this.enabled,
      intervalMinutes: INTERVAL_MINUTES,
      lastPingAt: this.lastPingAt?.toISOString() ?? null,
      lastPingOk: this.lastPingOk,
      lastPingError: this.lastPingError,
      pingCount: this.pingCount,
      pingUrl: this.pingUrl,
    };
  }

  private enforceCooldown(): void {
    if (Date.now() - this.lastActionAt < 2000) {
      throw new HttpException('Wait a moment before another keep-alive action', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
