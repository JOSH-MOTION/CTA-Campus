// src/services/aiChat.ts
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    getDocs,
    writeBatch,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }
  
  /**
   * Sets up a real-time listener for a user's AI chat history.
   * @param userId - The ID of the user whose chat history to listen to.
   * @param callback - The function to call with the new array of messages.
   * @returns An unsubscribe function to stop the listener.
   */
  export const onAiChatHistory = (userId: string, callback: (messages: Message[]) => void) => {
    const historyCol = collection(db, 'users', userId, 'ai_chat_history');
    const q = query(historyCol, orderBy('timestamp', 'asc'));
  
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const messages: Message[] = querySnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() } as Message;
        });
        callback(messages);
      },
      (error) => {
        console.error('Error listening to AI chat history:', error);
      }
    );
  
    return unsubscribe;
  };
  
  /**
   * Adds a new message to a user's AI chat history.
   * @param userId - The ID of the user.
   * @param message - The message object to add (role and content).
   */
  export const addAiChatMessage = async (userId: string, message: Omit<Message, 'id'>) => {
    try {
      const historyCol = collection(db, 'users', userId, 'ai_chat_history');
      await addDoc(historyCol, {
        ...message,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding AI chat message:', error);
      throw error;
    }
  };
  
  /**
   * Deletes all messages from a user's AI chat history.
   * @param userId - The ID of the user whose history should be cleared.
   */
  export const clearAiChatHistory = async (userId: string) => {
    try {
      const historyCol = collection(db, 'users', userId, 'ai_chat_history');
      const snapshot = await getDocs(historyCol);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing AI chat history:', error);
      throw error;
    }
  };
