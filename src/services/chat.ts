// src/services/chat.ts (MIGRATED TO MONGODB)
export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
  isPinned?: boolean;
  edited?: boolean;
}

export interface ChatMetadata {
  chatId: string;
  lastMessageAt: string;
  unreadCount: { [userId: string]: number };
  lastMessage?: string;
}

export type NewMessage = Omit<Message, 'id' | 'timestamp'>;

/**
 * Creates a consistent, sorted ID for a one-on-one chat.
 */
export const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('-');
};

/**
 * Sends a message to a specific chat via MongoDB API
 */
export const sendMessage = async (chatId: string, message: NewMessage) => {
  try {
    // Create message
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: new Date().toISOString(),
        replyTo: message.replyTo,
        isPinned: message.isPinned || false,
        edited: false,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send message');
    }

    // Update chat metadata (unread counts)
    await updateChatMetadata(chatId, message);

    return result.message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Update chat metadata with unread counts
 */
const updateChatMetadata = async (chatId: string, message: NewMessage) => {
  try {
    // Get current metadata
    const metaResponse = await fetch(`/api/chat/metadata?chatId=${chatId}`);
    const metaResult = await metaResponse.json();
    
    let currentUnread: { [userId: string]: number } = {};
    if (metaResult.success && metaResult.metadata && metaResult.metadata.length > 0) {
      currentUnread = metaResult.metadata[0].unreadCount || {};
    }

    // Increment unread for all participants except sender
    if (chatId.startsWith('group-')) {
      // For group chats, would need to fetch all participants
      // Simplified for now - assuming DM
    } else {
      // DM - increment for the other person
      const recipientId = chatId.split('-').find(id => id !== message.senderId);
      if (recipientId) {
        currentUnread[recipientId] = (currentUnread[recipientId] || 0) + 1;
      }
    }
    
    // Update metadata
    await fetch('/api/chat/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        lastMessageAt: new Date().toISOString(),
        lastMessage: message.text.substring(0, 50),
        unreadCount: currentUnread,
      }),
    });

    // Send notification to recipient
    if (!chatId.startsWith('group-')) {
      const recipientId = chatId.split('-').find(id => id !== message.senderId);
      if (recipientId) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `New Message from ${message.senderName}`,
            description: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
            href: `/chat?dm=${message.senderId}`,
            userId: recipientId,
            read: false,
            date: new Date().toISOString(),
          }),
        });
      }
    }
  } catch (error) {
    console.error('Error updating chat metadata:', error);
    // Non-critical, don't throw
  }
};

/**
 * Mark chat as read for a specific user
 */
export const markChatAsRead = async (chatId: string, userId: string) => {
  try {
    const metaResponse = await fetch(`/api/chat/metadata?chatId=${chatId}`);
    const metaResult = await metaResponse.json();
    
    if (metaResult.success && metaResult.metadata && metaResult.metadata.length > 0) {
      const currentUnread = metaResult.metadata[0].unreadCount || {};
      currentUnread[userId] = 0;
      
      await fetch('/api/chat/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          unreadCount: currentUnread,
        }),
      });
    }
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
};

/**
 * Get unread count for a specific chat and user
 */
export const getUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  try {
    const response = await fetch(`/api/chat/metadata?chatId=${chatId}`);
    const result = await response.json();
    
    if (result.success && result.metadata && result.metadata.length > 0) {
      const unreadCount = result.metadata[0].unreadCount || {};
      return unreadCount[userId] || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Listen to chat metadata for unread counts (polling-based)
 */
export const onChatMetadata = (
  callback: (metadata: Map<string, ChatMetadata>) => void,
  userId?: string
) => {
  const fetchMetadata = async () => {
    try {
      const url = userId 
        ? `/api/chat/metadata?userId=${userId}`
        : '/api/chat/metadata';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const metadataMap = new Map<string, ChatMetadata>();
        result.metadata.forEach((meta: any) => {
          metadataMap.set(meta.chatId, {
            chatId: meta.chatId,
            lastMessageAt: meta.lastMessageAt,
            unreadCount: meta.unreadCount || {},
            lastMessage: meta.lastMessage,
          });
        });
        callback(metadataMap);
      }
    } catch (error) {
      console.error('Error fetching chat metadata:', error);
    }
  };

  // Initial fetch
  fetchMetadata();
  
  // Poll every 15 seconds for chat metadata
  const interval = setInterval(fetchMetadata, 15000);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Sets up a polling listener for messages in a chat (replaces onSnapshot)
 */
export const onMessages = (
  chatId: string, 
  callback: (messages: Message[]) => void
) => {
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?chatId=${chatId}`);
      const result = await response.json();
      
      if (result.success) {
        const messages: Message[] = result.messages.map((msg: any) => ({
          id: msg._id,
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          timestamp: new Date(msg.timestamp).toISOString(),
          replyTo: msg.replyTo,
          isPinned: msg.isPinned,
          edited: msg.edited,
        }));
        callback(messages);
      }
    } catch (error) {
      console.error('Error listening to messages:', error);
    }
  };

  // Initial fetch
  fetchMessages();
  
  // Poll every 10 seconds for new messages (more frequent for chat)
  const interval = setInterval(fetchMessages, 10000);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Updates a message in a chat
 */
export const updateMessage = async (
  chatId: string, 
  messageId: string, 
  updates: Partial<Message>
) => {
  try {
    const response = await fetch(`/api/chat/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        edited: true,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update message');
    }
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Deletes a message from a chat
 */
export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const response = await fetch(`/api/chat/${messageId}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete message');
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};