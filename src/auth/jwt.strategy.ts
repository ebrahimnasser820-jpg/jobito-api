import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService // Inject UsersService
  ) {
    const finalSecret = configService.get<string>('JWT_SECRET') || 'your-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: finalSecret,
    });
  }

  async validate(payload: any) {
    // 1. If it's an admin token, just pass it through
    if (payload.adminId) {
      return { ...payload, userId: payload.sub };
    }

    // 2. Fetch the fresh user from the database
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. Check if account is completely deactivated (after 15 days)
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // 4. Force logout on other devices if account was scheduled for deletion
    // If the token was issued BEFORE the deletion request, it's an old session.
    if (user.deletionRequestedAt && payload.iat) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.deletionRequestedAt) {
        throw new UnauthorizedException('Session expired due to account deletion request');
      }
    }

    // 5. Ensure userId is present and return fresh deletion status
    return { 
      ...payload, 
      userId: payload.sub,
      deletionRequestedAt: user.deletionRequestedAt || null 
    };
  }
}
