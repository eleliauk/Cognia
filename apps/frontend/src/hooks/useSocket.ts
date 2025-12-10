import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores';
import { socketService } from '@/services/socketService';

/**
 * Hook to manage WebSocket connection lifecycle
 * Automatically connects when authenticated and disconnects on logout
 */
export function useSocket() {
  const { isAuthenticated, tokens } = useAuthStore();
  const previousTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      // Connect if not already connected or if token changed
      if (previousTokenRef.current !== tokens.accessToken) {
        socketService.connect();
        previousTokenRef.current = tokens.accessToken;
      }
    } else {
      // Disconnect when not authenticated
      socketService.disconnect();
      previousTokenRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount as other components may still need the connection
      // The connection will be cleaned up when the user logs out
    };
  }, [isAuthenticated, tokens?.accessToken]);

  return {
    isConnected: socketService.isConnected(),
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
    reconnect: () => socketService.reconnect(),
  };
}

export default useSocket;
