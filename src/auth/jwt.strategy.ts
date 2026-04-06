import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

console.log("📂 jwt.strategy.ts file loaded");

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const rawSecret = configService.get<string>('JWT_SECRET');
    const finalSecret = rawSecret || 'your-secret-key';
    console.log(`🔑 JwtStrategy initialized. Secret source: ${rawSecret ? 'ENV' : 'FALLBACK'}`);
    if (rawSecret) {
      console.log(`🔑 Secret starts with: ${rawSecret.substring(0, 3)}...`);
    }

    const secretHash = Buffer.from(finalSecret).toString('base64').substring(0, 10);
    console.log(`🔑 Verification Secret Check: Length=${finalSecret.length}, HashPrefix=${secretHash}`);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: finalSecret,
    });
  }

  async validate(payload: any) {
    console.log('🛡️ [JwtStrategy.validate] Payload:', JSON.stringify(payload));
    // Ensure userId is present for controllers that expect it
    const user = { ...payload, userId: payload.sub };
    console.log('🛡️ [JwtStrategy.validate] Returning user:', JSON.stringify(user));
    return user;
  }
}
