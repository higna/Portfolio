import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = (configService.get<string>('FRONTEND_URL') || '').replace(/\/$/, '');
      if (!origin || origin.replace(/\/$/, '') === allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT || configService.get<number>('BACKEND_PORT') || 2500;
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const backendUrl = configService.get<string>('BACKEND_URL', `http://localhost:${port}`);

  await app.listen(port);

  logger.log('--------------------------------------------------');
  logger.log('Hector Portfolio API server starting...');
  logger.log(`Allowed frontend origin: ${frontendUrl}`);
  logger.log(`Server running on port: ${port}`);
  logger.log(`Server ready at ${backendUrl}`);
  logger.log('--------------------------------------------------');
}

bootstrap();