import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: (origin: string, callback: any) => callback(null, true),
        credentials: true,
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_session')
    handleJoinSession(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`session_${data.sessionId}`);
        console.log(`Client ${client.id} joined session room: session_${data.sessionId}`);
        return { event: 'joined', data: `session_${data.sessionId}` };
    }

    @SubscribeMessage('join_user')
    handleJoinUser(
        @MessageBody() data: { userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`user_${data.userId}`);
        console.log(`Client ${client.id} joined user room: user_${data.userId}`);
        return { event: 'joined', data: `user_${data.userId}` };
    }

    // Generic method to emit events to specific rooms
    emitToRoom(room: string, event: string, payload: any) {
        if (this.server) {
            try {
                this.server.to(room).emit(event, payload);
            } catch (err) {
                console.error(`WS error: ${err.message}`);
            }
        }
    }

    // Specifically for Postgres updates
    notifyUserUpdate(userId: string, data: any) {
        this.emitToRoom(`user_${userId}`, 'user_updated', data);
    }

    // Specifically for P2P Chat messages (frontend expects new_p2p_message)
    notifyNewP2PMessage(recipientId: string, message: any) {
        this.emitToRoom(`user_${recipientId}`, 'new_p2p_message', message);
    }

    // Specifically for read status updates
    notifyMessagesRead(recipientId: string, readBy: string) {
        this.emitToRoom(`user_${recipientId}`, 'messages_read', { readBy });
    }
}
