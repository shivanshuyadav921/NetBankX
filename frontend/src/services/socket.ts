import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('📡 Connected to NetBankX Simulation Socket:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Simulation Socket');
    });
  }

  return socket;
}
