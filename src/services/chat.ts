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
  
  export type NewMessage = Omit<Message, 'id' | 'timestamp'>;
  
  /**
   * Creates a consistent, sorted ID for a one-on-one chat.
   * @param userId1 - The UID of the first user.
   * @param userId2 - The UID of the second user.
   * @returns A consistent chat ID string.
   */
  export const getChatId = (userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('-');
  };
  
  /**
   * Sends a message to a specific chat.
   * @param chatId - The ID of the chat (can be a group ID or a DM ID from getChatId).
   * @param message - The message object to send.
   */
  export const sendMessage = async (chatId: string, message: NewMessage) => {
    try {
      const messagesCol = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCol, {
        ...message,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  /**
   * Sets up a real-time listener for messages in a chat.
   * @param chatId - The ID of the chat to listen to.
   * @param callback - The function to call with the new array of messages.
   * @returns An unsubscribe function to stop the listener.
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
            }
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
   * @param chatId - The ID of the chat.
   * @param messageId - The ID of the message to update.
   * @param newText - The new text for the message.
   */
  export const updateMessage = async (chatId: string, messageId: string, newText: string) => {
      try {
          const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
          await updateDoc(messageRef, {
              text: newText,
              edited: true,
          });
      } catch (error) {
          console.error("Error updating message: ", error);
          throw error;
      }
  };
  
  /**
   * Deletes a message from a chat.
   * @param chatId - The ID of the chat.
   * @param messageId - The ID of the message to delete.
   */
  export const deleteMessage = async (chatId: string, messageId: string) => {
      try {
          const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
          await deleteDoc(messageRef);
      } catch (error) {
          console.error("Error deleting message: ", error);
          throw error;
      }
  };