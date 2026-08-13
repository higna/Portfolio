import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET not set in environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.query?.token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    this.logger.log(`Authenticated: ${payload.email}`);
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}