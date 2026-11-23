import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();
  configureApp(app);
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = Number(process.env.PORT || configService.get<string>('BACKEND_PORT')) || 2500;
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const backendUrl = configService.get<string>('BACKEND_URL', `http://localhost:${port}`);

  await app.listen(port, '0.0.0.0');

  logger.log('--------------------------------------------------');
  logger.log('Hector Portfolio API server starting...');
  logger.log(`Allowed frontend origin: ${frontendUrl}`);
  logger.log(`Server running on port: ${port}`);
  logger.log(`Server ready at ${backendUrl}`);
  if (
    configService.get<string>('NODE_ENV') !== 'production' ||
    configService.get<string>('SWAGGER_ENABLED') === 'true'
  ) {
    logger.log(`Swagger docs: ${backendUrl}/api/docs`);
  }
  logger.log(`Health dashboard: ${backendUrl}/health`);
  logger.log(`Liveness endpoint: ${backendUrl}/health/live`);
  logger.log('--------------------------------------------------');
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API server', error);
  process.exit(1);
});
