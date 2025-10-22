// src/services/chat.ts
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
  writeBatch,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
  isPinned?: boolean;
  edited?: boolean;
}

export interface ChatMetadata {
  lastMessageAt: Timestamp;
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
 * Sends a message to a specific chat and updates unread counts.
 */
export const sendMessage = async (chatId: string, message: NewMessage) => {
  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const messageDocRef = await addDoc(messagesCol, {
      ...message,
      timestamp: serverTimestamp(),
    });

    // Update chat metadata with unread counts
    const chatMetaRef = doc(db, 'chat_metadata', chatId);
    const chatMetaSnap = await getDoc(chatMetaRef);
    
    let currentUnread: { [userId: string]: number } = {};
    
    if (chatMetaSnap.exists()) {
      currentUnread = chatMetaSnap.data().unreadCount || {};
    }

    // Increment unread for all participants except sender
    if (chatId.startsWith('group-')) {
      const gen = chatId.replace('group-', '');
      const usersQuery = query(collection(db, 'users'), where('gen', '==', gen));
      const usersSnap = await getDocs(usersQuery);
      
      usersSnap.forEach(userDoc => {
        if (userDoc.id !== message.senderId) {
          currentUnread[userDoc.id] = (currentUnread[userDoc.id] || 0) + 1;
        }
      });
    } else {
      // DM - increment for the other person
      const recipientId = chatId.split('-').find(id => id !== message.senderId);
      if (recipientId) {
        currentUnread[recipientId] = (currentUnread[recipientId] || 0) + 1;
      }
    }
    
    await setDoc(chatMetaRef, {
      lastMessageAt: serverTimestamp(),
      unreadCount: currentUnread,
      lastMessage: message.text.substring(0, 50),
    }, { merge: true });

    // Send notifications
    const notificationsBatch = writeBatch(db);
    const notificationsCol = collection(db, 'notifications');
    const newNotification = {
      title: `New Message from ${message.senderName}`,
      description: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
      href: `/chat?dm=${message.senderId}`,
      read: false,
      date: serverTimestamp(),
    };

    if (chatId.startsWith('group-')) {
      const gen = chatId.replace('group-', '');
      const usersQuery = query(collection(db, 'users'), where('gen', '==', gen));
      const querySnapshot = await getDocs(usersQuery);
      querySnapshot.forEach(userDoc => {
        const userId = userDoc.id;
        if (userId !== message.senderId) {
          const notificationRef = doc(notificationsCol);
          notificationsBatch.set(notificationRef, { 
            ...newNotification, 
            userId, 
            href: `/chat?group=${gen}` 
          });
        }
      });
    } else {
      const recipientId = chatId.split('-').find(id => id !== message.senderId);
      if (recipientId) {
        const notificationRef = doc(notificationsCol);
        notificationsBatch.set(notificationRef, { 
          ...newNotification, 
          userId: recipientId 
        });
      }
    }
    await notificationsBatch.commit();

  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark chat as read for a specific user
 */
export const markChatAsRead = async (chatId: string, userId: string) => {
  try {
    const chatMetaRef = doc(db, 'chat_metadata', chatId);
    const chatMetaSnap = await getDoc(chatMetaRef);
    
    if (chatMetaSnap.exists()) {
      const currentUnread = chatMetaSnap.data().unreadCount || {};
      currentUnread[userId] = 0;
      
      await updateDoc(chatMetaRef, {
        unreadCount: currentUnread,
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
    const chatMetaRef = doc(db, 'chat_metadata', chatId);
    const chatMetaSnap = await getDoc(chatMetaRef);
    
    if (chatMetaSnap.exists()) {
      const unreadCount = chatMetaSnap.data().unreadCount || {};
      return unreadCount[userId] || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Listen to chat metadata for unread counts
 */
export const onChatMetadata = (callback: (metadata: Map<string, ChatMetadata>) => void) => {
  const metadataCol = collection(db, 'chat_metadata');
  
  const unsubscribe = onSnapshot(
    metadataCol,
    querySnapshot => {
      const metadata = new Map<string, ChatMetadata>();
      querySnapshot.docs.forEach(doc => {
        metadata.set(doc.id, doc.data() as ChatMetadata);
      });
      callback(metadata);
    },
    error => {
      console.error('Error listening to chat metadata:', error);
    }
  );

  return unsubscribe;
};

/**
 * Sets up a real-time listener for messages in a chat.
 */
export const onMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    querySnapshot => {
      const messages: Message[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp as Timestamp,
          replyTo: data.replyTo,
          isPinned: data.isPinned,
          edited: data.edited,
        };
      });
      callback(messages);
    },
    error => {
      console.error('Error listening to messages:', error);
    }
  );

  return unsubscribe;
};

/**
 * Updates a message in a chat.
 */
export const updateMessage = async (chatId: string, messageId: string, updates: Partial<Message>) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, updates);
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

/**
 * Deletes a message from a chat.
 */
export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};