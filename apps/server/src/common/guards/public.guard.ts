import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class PublicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}