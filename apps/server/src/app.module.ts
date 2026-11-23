import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { RedisClientType } from 'redis';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ContactModule } from './contact/contact.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OnaModule } from './ona/ona.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { PdfModule } from './pdf/pdf.module';
import { HealthPingService } from './common/health-ping.service';
import { HealthController } from './common/health.controller';
import { HealthPageService } from './common/health-page.service';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { CampaignModule } from './campaign/campaign.module';
import { GeneratorSettingsModule } from './generator-settings/generator-settings.module';
import { EventsModule } from './common/events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { REDIS_CLIENT } from './redis/redis.constants';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler-storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (client: RedisClientType) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        errorMessage: 'Too many requests',
        getTracker: (request: Record<string, any>) =>
          request.user?.id ?? request.ip ?? 'anonymous',
        storage: new RedisThrottlerStorage(client),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          url: configService.get('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: configService.get<string>('MIGRATIONS_RUN') === 'true',
          migrationsTableName: 'migrations',
          migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        };
      },
    }),
    UsersModule,
    AuthModule,
    SeedModule,
    PortfolioModule,
    ContactModule,
    DashboardModule,
    ChatModule,
    OnaModule,
    PipelineModule,
    PdfModule,
    CampaignModule,
    GeneratorSettingsModule,
    EventsModule,
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    HealthPingService,
    HealthPageService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
