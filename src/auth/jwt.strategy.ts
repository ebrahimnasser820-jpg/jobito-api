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

    // 3. Check if account is suspended or banned by Admin
    if (!user.isActive) {
      if (user.accountStatus === 'suspended') {
        throw new UnauthorizedException('Your account is temporarily suspended by the administration.');
      }
      if (user.accountStatus === 'banned') {
        throw new UnauthorizedException('Your account has been permanently banned.');
      }
      // If it's a deactivated account due to deletion request
      if (user.deletionRequestedAt) {
        throw new UnauthorizedException('Account has been deactivated.');
      }
      throw new UnauthorizedException('Your account is currently inactive.');
    }

    // 4. Force logout on other devices if account was scheduled for deletion
    // If the token was issued BEFORE the deletion request, it's an old session.
    if (user.deletionRequestedAt && payload.iat) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.deletionRequestedAt) {
        throw new UnauthorizedException('Session expired due to account deletion request.');
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
