import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieName = this.config.get<string>('AUTH_COOKIE_NAME', 'homeseva_session');
    const token = request.cookies?.[cookieName];

    if (!token) {
      throw new UnauthorizedException('Authentication session required (AUTH-4)');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('AUTH_SECRET', 'dev-auth-secret-key-32-chars-long!'),
      });
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}

