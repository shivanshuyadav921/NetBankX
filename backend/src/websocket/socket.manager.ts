import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Response } from 'express';
import { SimulationEvent, SimulationPacket, NetworkMetrics } from '../modules/network/network.types.js';

export class SocketManager {
  private static io: SocketIOServer | null = null;
  private static sseClients: Set<Response> = new Set();

  public static initialize(server: HttpServer, corsOrigins: string[]): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected to simulation socket: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected from socket: ${socket.id}`);
      });
    });

    return this.io;
  }

  public static addSseClient(res: Response): void {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public static removeSseClient(res: Response): void {
    this.sseClients.delete(res);
  }

  private static broadcastSse(eventType: string, data: any): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  public static getIO(): SocketIOServer | null {
    return this.io;
  }

  public static emitSimulationEvent(event: SimulationEvent): void {
    if (this.io) {
      this.io.emit('simulation:event', event);
    }
    this.broadcastSse('simulation:event', event);
  }

  public static emitPacketUpdate(packet: SimulationPacket): void {
    if (this.io) {
      this.io.emit('simulation:packet', packet);
    }
    this.broadcastSse('simulation:packet', packet);
  }

  public static emitMetrics(metrics: NetworkMetrics): void {
    if (this.io) {
      this.io.emit('simulation:metrics', metrics);
    }
    this.broadcastSse('simulation:metrics', metrics);
  }

  public static emitTopologyUpdate(data: { nodes: any[]; links: any[] }): void {
    if (this.io) {
      this.io.emit('simulation:topology', data);
    }
    this.broadcastSse('simulation:topology', data);
  }

  public static emitSecurityEvent(event: any): void {
    if (this.io) {
      this.io.emit('security:event', event);
    }
    this.broadcastSse('security:event', event);
  }

  public static emitEvent(channel: string, data: any): void {
    if (this.io) {
      this.io.emit(channel, data);
    }
    this.broadcastSse(channel, data);
  }
}
