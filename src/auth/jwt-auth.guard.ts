import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy.js';

console.log("📂 jwt-auth.guard.ts file loaded");

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private jwtStrategy: JwtStrategy) {
        super();
        console.log("🔥 JwtAuthGuard Initialized with strategy.");
    }

    canActivate(context: ExecutionContext) {
        // Add custom logic before Passport execution if needed
        console.log("🔥 JwtAuthGuard Incoming Request Headers:", context.switchToHttp().getRequest().headers);
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            console.error("🔥 JwtAuthGuard Passport Reject:", { err, user, info });
            throw err || new UnauthorizedException('Authentication failed: ' + (info?.message || 'Unknown error'));
        }
        return user;
    }
}
