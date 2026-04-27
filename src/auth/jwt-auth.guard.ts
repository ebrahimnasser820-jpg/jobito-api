import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private jwtStrategy: JwtStrategy) {
        super();
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException('Authentication failed: ' + (info?.message || 'Unknown error'));
        }
        return user;
    }
}
