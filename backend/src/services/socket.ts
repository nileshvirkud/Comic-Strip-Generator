import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { SocketUser } from './types';

let io: SocketIOServer;
const connectedUsers = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, SocketUser>(); // socketId -> user data

export const initializeSocket = (socketServer: SocketIOServer) => {
  io = socketServer;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const socketId = socket.id;

    // Store user connection
    connectedUsers.set(userId, socketId);
    socketUsers.set(socketId, {
      id: userId,
      socketId,
      subscribedComics: [],
    });

    logger.info('User connected', { userId, socketId });

    // Handle comic subscription
    socket.on('subscribe-comic', (comicId: string) => {
      const user = socketUsers.get(socketId);
      if (user && !user.subscribedComics.includes(comicId)) {
        user.subscribedComics.push(comicId);
        socket.join(`comic-${comicId}`);
        logger.debug('User subscribed to comic', { userId, comicId });
      }
    });

    // Handle comic unsubscription
    socket.on('unsubscribe-comic', (comicId: string) => {
      const user = socketUsers.get(socketId);
      if (user) {
        user.subscribedComics = user.subscribedComics.filter(id => id !== comicId);
        socket.leave(`comic-${comicId}`);
        logger.debug('User unsubscribed from comic', { userId, comicId });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      socketUsers.delete(socketId);
      logger.info('User disconnected', { userId, socketId });
    });
  });

  logger.info('Socket.IO server initialized');
};

export const emitToUser = (userId: string, event: string, data: any) => {
  const socketId = connectedUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    logger.debug('Emitted event to user', { userId, event, socketId });
  }
};

export const emitToComic = (comicId: string, event: string, data: any) => {
  if (io) {
    io.to(`comic-${comicId}`).emit(event, data);
    logger.debug('Emitted event to comic room', { comicId, event });
  }
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

// Extend Socket interface
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userEmail?: string;
  }
}