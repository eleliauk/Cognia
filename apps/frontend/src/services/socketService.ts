import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';

// Socket.io server URL
const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize socket connection with authentication
   */
  connect(): void {
    const tokens = useAuthStore.getState().tokens;

    if (!tokens?.accessToken) {
      console.warn('Cannot connect to socket: No access token');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Disconnect existing socket if any
    this.disconnect();

    // Create new socket connection
    this.socket = io(SOCKET_URL, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Notification events
    this.socket.on('notification:new', (notification: Notification) => {
      console.log('New notification received:', notification);
      useNotificationStore.getState().addNotification(notification);
    });

    this.socket.on('notification:read', (data: { notificationId: string }) => {
      console.log('Notification marked as read:', data.notificationId);
      useNotificationStore.getState().markAsRead(data.notificationId);
    });

    this.socket.on('notification:read-all', (data: { count: number }) => {
      console.log('All notifications marked as read:', data.count);
      useNotificationStore.getState().markAllAsRead();
    });

    // Application status change events
    this.socket.on(
      'application:status-changed',
      (data: { applicationId: string; status: string }) => {
        console.log('Application status changed:', data);
        // This can be handled by components that need to react to status changes
      }
    );

    // Internship progress update events
    this.socket.on(
      'internship:progress-updated',
      (data: { internshipId: string; progress: number }) => {
        console.log('Internship progress updated:', data);
        // This can be handled by components that need to react to progress updates
      }
    );
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected');
    }
  }

  /**
   * Emit notification read event
   */
  emitNotificationRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  /**
   * Emit notification read all event
   */
  emitNotificationReadAll(): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:read-all');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Reconnect with new token (after token refresh)
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
