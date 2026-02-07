import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { User } from "@/auth/schema";

import type { PairMatch, PairRequest, PairSession } from "./schema";

// Simple auth guard for WebSocket
export class WsAuthGuard {
  constructor(private jwtService: JwtService) {}

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload as User;
    } catch {
      return null;
    }
  }
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_APP_BASE_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/pairs",
})
export class PairsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(PairsGateway.name);
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  // ==================== Connection Handling ====================

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Validate token
      const user = await this.validateToken(token as string);

      if (!user) {
        this.logger.warn(
          `Client ${client.id} connection rejected: Invalid token`,
        );
        client.disconnect();
        return;
      }

      // Store connection
      client.data.userId = user.id;
      this.socketToUser.set(client.id, user.id);

      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)?.add(client.id);

      // Join user's personal room
      client.join(`user:${user.id}`);

      this.logger.log(
        `User ${user.id} connected (${this.onlineUsers.get(user.id)?.size} active connections)`,
      );

      // Notify user's pairs that they're online
      this.emitUserOnlineStatus(user.id, true);

      // Send current online users to the connected user (filter falsy in case of stale state)
      client.emit(
        "online-users",
        Array.from(this.onlineUsers.keys()).filter((id): id is string =>
          Boolean(id),
        ),
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const userSockets = this.onlineUsers.get(userId);
      userSockets?.delete(client.id);

      // If no more connections for this user
      if (userSockets?.size === 0) {
        this.onlineUsers.delete(userId);
        this.logger.log(`User ${userId} went offline`);

        // Notify user's pairs that they're offline
        this.emitUserOnlineStatus(userId, false);
      }

      this.socketToUser.delete(client.id);
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  private async validateToken(token: string): Promise<User | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.id;
      if (!userId) {
        this.logger.warn("JWT payload missing user id");
        return null;
      }
      return {
        id: userId,
        name: payload.name,
        email: payload.email,
      } as User;
    } catch {
      return null;
    }
  }

  // ==================== Presence ====================

  @SubscribeMessage("join-pair")
  handleJoinPair(
    @ConnectedSocket() client: Socket,
    @MessageBody() pairId: string,
  ) {
    client.join(`pair:${pairId}`);
    this.logger.log(`User ${client.data.userId} joined pair room ${pairId}`);

    // Notify other user in the pair
    client.to(`pair:${pairId}`).emit("pair-user-online", {
      userId: client.data.userId,
      pairId,
    });
  }

  @SubscribeMessage("leave-pair")
  handleLeavePair(
    @ConnectedSocket() client: Socket,
    @MessageBody() pairId: string,
  ) {
    client.leave(`pair:${pairId}`);
    this.logger.log(`User ${client.data.userId} left pair room ${pairId}`);

    // Notify other user in the pair
    client.to(`pair:${pairId}`).emit("pair-user-offline", {
      userId: client.data.userId,
      pairId,
    });
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  private emitUserOnlineStatus(userId: string, isOnline: boolean) {
    // Emit to all user's connections about their online status
    const event = isOnline ? "user-online" : "user-offline";
    this.server.emit(event, { userId });
  }

  // ==================== Pair Request Events ====================

  notifyPairRequest(
    userId: string,
    request: PairRequest & { requester: Partial<User> },
  ) {
    this.server.to(`user:${userId}`).emit("pair-request", {
      type: "pair-request",
      data: request,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified user ${userId} of pair request ${request.id}`);
  }

  notifyPairRequestResponse(
    requesterId: string,
    data: {
      request: PairRequest;
      pair?: {
        id: string;
        user1_id: string;
        user2_id: string;
        created_at: Date;
      };
      accepted: boolean;
    },
  ) {
    this.server.to(`user:${requesterId}`).emit("pair-request-response", {
      type: "pair-request-response",
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Notified requester ${requesterId} of request response (${data.accepted ? "accepted" : "rejected"})`,
    );
  }

  // ==================== Session Events ====================

  notifySessionCreated(pairId: string, session: PairSession) {
    this.server.to(`pair:${pairId}`).emit("session-created", {
      type: "session-created",
      data: session,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified pair ${pairId} of new session ${session.id}`);
  }

  notifyFiltersProposed(pairId: string, data: { session: PairSession }) {
    this.server.to(`pair:${pairId}`).emit("filters-proposed", {
      type: "filters-proposed",
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified pair ${pairId} of proposed filters`);
  }

  notifyFiltersAccepted(pairId: string, data: { session: PairSession }) {
    this.server.to(`pair:${pairId}`).emit("filters-accepted", {
      type: "filters-accepted",
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified pair ${pairId} that filters were accepted`);
  }

  notifySessionEnded(pairId: string, session: PairSession) {
    this.server.to(`pair:${pairId}`).emit("session-ended", {
      type: "session-ended",
      data: session,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified pair ${pairId} that session ended`);
  }

  // ==================== Swipe Events ====================

  notifyPartnerSwiped(
    pairId: string,
    excludeUserId: string,
    data: {
      tmdbId: number;
      direction: "left" | "right";
      userId: string;
    },
  ) {
    // Notify everyone in the pair except the user who swiped
    this.server
      .to(`pair:${pairId}`)
      .except(`user:${excludeUserId}`)
      .emit("partner-swiped", {
        type: "partner-swiped",
        data,
        timestamp: new Date().toISOString(),
      });

    this.logger.log(
      `Notified pair ${pairId} of swipe (excluding user ${excludeUserId})`,
    );
  }

  notifyMatch(pairId: string, match: PairMatch) {
    this.server.to(`pair:${pairId}`).emit("match-found", {
      type: "match-found",
      data: match,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Notified pair ${pairId} of match: ${match.title} (${match.tmdb_id})`,
    );
  }

  // ==================== Match Events ====================

  notifyMatchWatchedUpdate(
    pairId: string,
    data: {
      matchId: string;
      markedWatched: boolean;
    },
  ) {
    this.server.to(`pair:${pairId}`).emit("match-watched-updated", {
      type: "match-watched-updated",
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Notified pair ${pairId} of match watched update (${data.matchId})`,
    );
  }

  // ==================== Typing Indicators (Optional) ====================

  @SubscribeMessage("typing")
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pairId: string; isTyping: boolean },
  ) {
    client.to(`pair:${data.pairId}`).emit("partner-typing", {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }
}
