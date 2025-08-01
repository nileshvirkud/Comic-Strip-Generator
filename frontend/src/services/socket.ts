import { io, Socket } from 'socket.io-client';
import { GenerationJob } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('generation-progress', (data: { comicId: string; job: GenerationJob }) => {
      this.emit('generation-progress', data);
    });

    this.socket.on('generation-complete', (data: { comicId: string }) => {
      this.emit('generation-complete', data);
    });

    this.socket.on('generation-error', (data: { comicId: string; error: string }) => {
      this.emit('generation-error', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  subscribeToComic(comicId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe-comic', comicId);
    }
  }

  unsubscribeFromComic(comicId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe-comic', comicId);
    }
  }
}

export default new SocketService();