import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Shared HTTP setup for the server bootstrap. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  const allowedOrigin = (config.get<string>('FRONTEND_URL') || '').replace(/\/$/, '');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin.replace(/\/$/, '') === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const docsEnabled =
    config.get<string>('NODE_ENV') !== 'production' ||
    config.get<string>('SWAGGER_ENABLED') === 'true';
  if (!docsEnabled) return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hector Portfolio API')
    .setDescription('API for portfolio content, user accounts, data tools, and contact workflows.')
    .setVersion(process.env.npm_package_version ?? '0.0.1')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    () => SwaggerModule.createDocument(app, swaggerConfig),
    { swaggerOptions: { persistAuthorization: true } },
  );
}
