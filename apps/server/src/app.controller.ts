import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) { }

  @Get()
  @Header('Content-Type', 'text/html')
  getRoot(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    return this.appService.getWelcomeHtml(frontendUrl);
  }

  @Get('api')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getApiLanding(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    return this.appService.getWelcomeHtml(frontendUrl);
  }
}
