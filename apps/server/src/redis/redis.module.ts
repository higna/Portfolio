import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<RedisClientType> => {
        const logger = new Logger('RedisClient');
        const client: RedisClientType = createClient<{}, {}, {}, 2, {}>({
          url: config.get<string>('REDIS_URL', 'redis://127.0.0.1:2525'),
        });

        client.on('error', (error: Error) => logger.error(error.message));
        client.on('connect', () => logger.log('Connected to Redis'));
        client.on('reconnecting', () => logger.warn('Reconnecting to Redis'));
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}
