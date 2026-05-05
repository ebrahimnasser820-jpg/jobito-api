import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private configService: ConfigService) {
    const finalSecret = configService.get<string>('JWT_SECRET') || 'your-secret-key';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: finalSecret,
    });
  }

  async validate(payload: any) {
    // Only allow admin tokens (they have adminId and adminRole)
    if (!payload.adminId || !payload.adminRole) {
      return null;
    }
    return {
      adminId: payload.adminId,
      email: payload.email,
      adminRole: payload.adminRole,
      name: payload.name,
    };
  }
}
