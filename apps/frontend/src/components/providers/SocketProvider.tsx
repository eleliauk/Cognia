import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { socketService } from '@/services/socketService';

interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages WebSocket connection lifecycle
 * Automatically connects when user is authenticated and disconnects on logout
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated, tokens } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      // Connect to WebSocket when authenticated
      socketService.connect();
    } else {
      // Disconnect when not authenticated
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, tokens?.accessToken]);

  // Reconnect when token changes (e.g., after refresh)
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken && socketService.isConnected()) {
      // Token changed, reconnect with new token
      socketService.reconnect();
    }
  }, [tokens?.accessToken]);

  return <>{children}</>;
}

export default SocketProvider;
