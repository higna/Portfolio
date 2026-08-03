import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (authHeader) {
            this.logger.log('Request with auth header');
        } else {
            this.logger.warn('Request without auth header');
        }
        return super.canActivate(context);
    }
}