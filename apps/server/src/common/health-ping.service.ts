import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HealthPingService {
    private readonly logger = new Logger(HealthPingService.name);
    private readonly backendUrl: string;

    constructor(private readonly configService: ConfigService) {
        const port =
            process.env.PORT ||
            this.configService.get<number>('BACKEND_PORT') ||
            2500;

        this.backendUrl = this.configService.get<string>(
            'BACKEND_URL',
            `http://localhost:${port}`,
        );
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async pingSelf() {
        try {
            await axios.get(`${this.backendUrl}/`);
            this.logger.log('Health ping sent');
        } catch (error: any) {
            this.logger.warn(`Health ping failed: ${error.message}`);
        }
    }
}