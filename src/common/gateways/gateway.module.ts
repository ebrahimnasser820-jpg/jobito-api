import { Module, Global } from '@nestjs/common';
import { AppGateway } from './app.gateway.js';

@Global()
@Module({
    providers: [AppGateway],
    exports: [AppGateway],
})
export class GatewayModule { }
