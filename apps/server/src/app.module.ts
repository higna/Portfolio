import { AppService } from './app.service';
import { OnaModule } from './ona/ona.module';
import { PdfModule } from './pdf/pdf.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { ContactModule } from './contact/contact.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PortfolioModule } from './portfolio/portfolio.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';

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
    OnaModule,
    PdfModule,
    AuthModule,
    SeedModule,
    UsersModule,
    ContactModule,
    PipelineModule,
    DashboardModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}