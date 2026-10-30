import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '@homeseva/db';
import type { SignInRequest, SignInResponse } from '@homeseva/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signIn(dto: SignInRequest, res: Response): Promise<SignInResponse> {
    const business = await prisma.business.findUnique({
      where: { slug: dto.businessSlug },
    });

    if (!business) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await prisma.user.findUnique({
      where: {
        roleId_businessId: {
          roleId: dto.roleId,
          businessId: business.id,
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked due to repeated failures. (AUTH-5)');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      const attempts = user.failedAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, businessId: business.id, roleId: user.roleId };
    const token = this.jwtService.sign(payload);
    const cookieName = this.config.get<string>('AUTH_COOKIE_NAME', 'homeseva_session');
    const maxAge = Number(this.config.get<string>('AUTH_SESSION_MAX_AGE_SECONDS', '28800'));

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: maxAge * 1000,
    });

    return {
      success: true,
      mustChangePass: user.mustChangePass,
      requiresTwoFactor: user.totpEnabled,
    };
  }
}

