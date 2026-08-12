import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { CampaignModule } from './campaign/campaign.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') !== 'production';
        return {
          type: 'postgres',
          url: configService.get('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: isDevelopment,
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
    CampaignModule
  ],
  controllers: [AppController],
  providers: [AppService, HealthPingService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}