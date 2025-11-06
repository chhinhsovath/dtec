/**
 * WebSocket Server Configuration
 * Handles real-time messaging, notifications, and presence tracking
 * Uses Socket.IO for robust bidirectional communication
 */

import { Server as HTTPServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { query } from '@/lib/db';

// Types for socket events
export interface MessagePayload {
  conversationId: number;
  messageId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  createdAt: string;
}

export interface TypingPayload {
  conversationId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface PresencePayload {
  userId: number;
  userName: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface ReadReceiptPayload {
  conversationId: number;
  messageId: number;
  userId: number;
  readAt: string;
}

// Store active sockets by user ID
const userSockets = new Map<number, Set<string>>();
const typingUsers = new Map<number, Set<number>>(); // conversationId -> userId set

/**
 * Initialize Socket.IO server
 * Attach to HTTP server for real-time communication
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  /**
   * Middleware: Authenticate socket connection
   */
  io.use(async (socket, next) => {
    try {
      const sessionId = socket.handshake.auth.sessionId;
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        return next(new Error('Authentication failed'));
      }

      // Verify user exists
      const userCheck = await query(
        `SELECT id, user_name FROM profiles WHERE id = $1`,
        [userId]
      );

      if (userCheck.rowCount === 0) {
        return next(new Error('User not found'));
      }

      // Store user info on socket
      socket.data.userId = userId;
      socket.data.userName = userCheck.rows[0].user_name;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  /**
   * Handle socket connection
   */
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number;
    const userName = socket.data.userName as string;

    console.log(`User ${userId} (${userName}) connected with socket ${socket.id}`);

    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
      // Emit presence update
      io.emit('user_online', { userId, userName, isOnline: true } as PresencePayload);
    }
    userSockets.get(userId)!.add(socket.id);

    /**
     * Join conversation room
     */
    socket.on('join_conversation', async (conversationId: number) => {
      try {
        // Verify user is participant
        const participantCheck = await query(
          `SELECT participant_id FROM conversation_participants
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId]
        );

        if (participantCheck.rowCount === 0) {
          socket.emit('error', { code: 'NOT_PARTICIPANT', message: 'Not a conversation participant' });
          return;
        }

        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);

        console.log(`User ${userId} joined conversation ${conversationId}`);

        // Notify others that user is online in this conversation
        io.to(roomName).emit('user_joined', {
          userId,
          userName,
          conversationId,
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { code: 'JOIN_ERROR', message: 'Failed to join conversation' });
      }
    });

    /**
     * Leave conversation room
     */
    socket.on('leave_conversation', (conversationId: number) => {
      const roomName = `conversation_${conversationId}`;
      socket.leave(roomName);

      console.log(`User ${userId} left conversation ${conversationId}`);

      // Notify others that user left
      io.to(roomName).emit('user_left', {
        userId,
        userName,
        conversationId,
      });
    });

    /**
     * Handle typing indicator
     */
    socket.on('user_typing', (payload: TypingPayload) => {
      const roomName = `conversation_${payload.conversationId}`;

      if (!typingUsers.has(payload.conversationId)) {
        typingUsers.set(payload.conversationId, new Set());
      }

      if (payload.isTyping) {
        typingUsers.get(payload.conversationId)!.add(userId);
      } else {
        typingUsers.get(payload.conversationId)!.delete(userId);
      }

      // Broadcast typing status
      io.to(roomName).emit('user_typing', {
        userId,
        userName,
        isTyping: payload.isTyping,
        conversationId: payload.conversationId,
      });
    });

    /**
     * Handle new message
     */
    socket.on('new_message', async (payload: MessagePayload) => {
      try {
        const roomName = `conversation_${payload.conversationId}`;

        // Clear typing indicator
        if (typingUsers.has(payload.conversationId)) {
          typingUsers.get(payload.conversationId)!.delete(userId);
        }

        // Verify message exists in database (API should have inserted it)
        const messageCheck = await query(
          `SELECT * FROM messages WHERE message_id = $1 AND sender_id = $2`,
          [payload.messageId, userId]
        );

        if (messageCheck.rowCount === 0) {
          socket.emit('error', { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' });
          return;
        }

        // Broadcast message to all in conversation
        io.to(roomName).emit('message_received', payload);

        // Update conversation updated_at
        await query(
          `UPDATE conversations SET updated_at = NOW() WHERE conversation_id = $1`,
          [payload.conversationId]
        );

        console.log(`Message ${payload.messageId} from user ${userId} delivered to conversation ${payload.conversationId}`);
      } catch (error) {
        console.error('Error handling new message:', error);
        socket.emit('error', { code: 'MESSAGE_ERROR', message: 'Failed to deliver message' });
      }
    });

    /**
     * Handle message edit
     */
    socket.on('message_edited', (payload: any) => {
      const roomName = `conversation_${payload.conversationId}`;

      io.to(roomName).emit('message_updated', {
        messageId: payload.messageId,
        messageText: payload.messageText,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });

      console.log(`Message ${payload.messageId} edited by user ${userId}`);
    });

    /**
     * Handle message deletion
     */
    socket.on('message_deleted', (payload: any) => {
      const roomName = `conversation_${payload.conversationId}`;

      io.to(roomName).emit('message_removed', {
        messageId: payload.messageId,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });

      console.log(`Message ${payload.messageId} deleted by user ${userId}`);
    });

    /**
     * Handle read receipt
     */
    socket.on('message_read', async (payload: ReadReceiptPayload) => {
      try {
        const roomName = `conversation_${payload.conversationId}`;

        // Verify user hasn't already read this message
        const receiptCheck = await query(
          `SELECT * FROM message_read_receipts
           WHERE message_id = $1 AND user_id = $2`,
          [payload.messageId, userId]
        );

        if (receiptCheck.rowCount === 0) {
          // Insert read receipt
          await query(
            `INSERT INTO message_read_receipts (message_id, user_id)
             VALUES ($1, $2)`,
            [payload.messageId, userId]
          );
        }

        // Broadcast read receipt
        io.to(roomName).emit('message_read_receipt', {
          messageId: payload.messageId,
          userId,
          userName,
          readAt: new Date().toISOString(),
        });

        console.log(`User ${userId} read message ${payload.messageId}`);
      } catch (error) {
        console.error('Error handling read receipt:', error);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected with socket ${socket.id}`);

      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);

        // If no more sockets for this user, mark as offline
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          io.emit('user_offline', {
            userId,
            userName,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          } as PresencePayload);
        }
      }
    });

    /**
     * Handle errors
     */
    socket.on('error', (error: any) => {
      console.error('Socket error for user', userId, ':', error);
    });
  });

  return io;
}

/**
 * Emit direct message to user
 * Used for notifications that should reach user regardless of conversation
 */
export function notifyUser(io: SocketIOServer, userId: number, event: string, data: any) {
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet && userSocketSet.size > 0) {
    const sockets = Array.from(userSocketSet).map((socketId) => io.sockets.sockets.get(socketId)).filter(Boolean);
    sockets.forEach((socket) => {
      socket?.emit(event, data);
    });
  }
}

/**
 * Emit message to entire conversation
 */
export function broadcastToConversation(io: SocketIOServer, conversationId: number, event: string, data: any) {
  io.to(`conversation_${conversationId}`).emit(event, data);
}

/**
 * Get online users in a conversation
 */
export function getConversationOnlineUsers(io: SocketIOServer, conversationId: number): Set<number> {
  const roomName = `conversation_${conversationId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const onlineUsers = new Set<number>();

  if (room) {
    room.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket?.data?.userId) {
        onlineUsers.add(socket.data.userId);
      }
    });
  }

  return onlineUsers;
}

/**
 * Get all online users
 */
export function getOnlineUsers(): Map<number, Set<string>> {
  return new Map(userSockets);
}

export default {
  initializeSocketServer,
  notifyUser,
  broadcastToConversation,
  getConversationOnlineUsers,
  getOnlineUsers,
};
