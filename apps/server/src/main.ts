import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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