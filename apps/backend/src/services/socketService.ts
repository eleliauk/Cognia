import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, type TokenPayload } from '../utils/jwt';
import logger from '../utils/logger';

// Extend Socket to include user data
interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.io server with HTTP server
   */
  initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      this.authenticateSocket(socket, next);
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.io server initialized');
    return this.io;
  }

  /**
   * Authenticate socket connection using JWT token
   */
  private authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed', { error });
      next(new Error('Invalid or expired token'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user?.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Join user's personal room
    socket.join(`user:${userId}`);
    this.addUserSocket(userId, socket.id);

    logger.info('User connected to WebSocket', {
      userId,
      socketId: socket.id,
      role: socket.user?.role,
    });

    // Handle notification read event
    socket.on('notification:read', (notificationId: string) => {
      this.handleNotificationRead(socket, notificationId);
    });

    // Handle notification read all event
    socket.on('notification:read-all', () => {
      this.handleNotificationReadAll(socket);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { userId, socketId: socket.id, error });
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    const userId = socket.user?.userId;

    if (userId) {
      this.removeUserSocket(userId, socket.id);
      logger.info('User disconnected from WebSocket', {
        userId,
        socketId: socket.id,
        reason,
      });
    }
  }

  /**
   * Handle notification read event from client
   */
  private handleNotificationRead(socket: AuthenticatedSocket, notificationId: string): void {
    // This event is emitted by client when they read a notification
    // The actual database update is handled by the notification service via REST API
    logger.debug('Notification read event received', {
      userId: socket.user?.userId,
      notificationId,
    });
  }

  /**
   * Handle notification read all event from client
   */
  private handleNotificationReadAll(socket: AuthenticatedSocket): void {
    logger.debug('Notification read all event received', {
      userId: socket.user?.userId,
    });
  }

  /**
   * Add socket to user's socket set
   */
  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Remove socket from user's socket set
   */
  private removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Check if user is online (has active socket connections)
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug('Sent event to user', { userId, event });
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: unknown): void {
    userIds.forEach((userId) => this.sendToUser(userId, event, data));
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized');
      return;
    }

    this.io.emit(event, data);
    logger.debug('Broadcast event', { event });
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
