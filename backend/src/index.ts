import http from 'http';
import { config } from './config/index.js';
import { createApp } from './app.js';
import { initDatabase } from './database/index.js';
import { NetworkService } from './modules/network/network.service.js';
import { SocketManager } from './websocket/socket.manager.js';

async function bootstrap() {
  console.log('🚀 Bootstrapping NETBANKX Enterprise Platform...');

  // 1. Initialize Database
  await initDatabase();

  // 2. Initialize Network Digital Twin Topology
  await NetworkService.initializeTopology();

  // 3. Create Express App & HTTP Server
  const app = createApp();
  const server = http.createServer(app);

  // 4. Initialize WebSocket / Socket.IO Hub
  SocketManager.initialize(server, config.corsOrigins);

  // 5. Start Listening
  server.listen(config.port, () => {
    console.log(`
================================================================
🏛  NETBANKX — Enterprise Banking Network Digital Twin
🌐  REST API Server:  http://localhost:${config.port}${config.apiPrefix}
📡  WebSocket Hub:    ws://localhost:${config.port}/socket.io/
⚡  Status Endpoint:  http://localhost:${config.port}/health
🔒  Security Mode:    Argon2id/Bcrypt + JWT + Server RBAC
================================================================
    `);
  });

  // Graceful Shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
    server.close(() => {
      console.log('✅ HTTP and WebSocket server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error during bootstrap:', err);
  process.exit(1);
});
