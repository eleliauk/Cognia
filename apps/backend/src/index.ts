import { createServer } from 'http';
import app from './app';
import { socketService } from './services/socketService';

const PORT = process.env.BACKEND_PORT || 3000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io with the HTTP server
socketService.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready`);
});
