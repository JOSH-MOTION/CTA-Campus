// src/contexts/AuthContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, FC, useMemo} from 'react';
import {auth, db} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged}from 'firebase/auth';
import {doc, getDoc, setDoc, collection, getDocs, Unsubscribe, onSnapshot} from 'firebase/firestore';
import { getChatId, onMessages } from '@/services/chat';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  // Student specific
  gen?: string;
  schoolId?: string;
  lessonDay?: string;
  lessonType?: string;
  bio?: string;
  photoURL?: string;
  // Teacher specific
  gensTaught?: string;
  availableDays?: string[];
  timeSlots?: { startTime: string; endTime: string }[];
  linkedin?: string;
  github?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>> | null;
  role: UserRole | null;
  loading: boolean;
  setRole: (role: UserRole) => void;
  fetchAllUsers: () => Promise<UserData[]>;
  allUsers: UserData[];
  unreadChatCounts: {[chatId: string]: number};
  totalUnreadChats: number;
  markChatAsRead: (chatId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    setUserData: null,
    role: null,
    loading: true,
    setRole: () => {},
    fetchAllUsers: async () => [],
    allUsers: [],
    unreadChatCounts: {},
    totalUnreadChats: 0,
    markChatAsRead: () => {},
});

export const AuthProvider: FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [unreadChatCounts, setUnreadChatCounts] = useState<{[chatId: string]: number}>({});
  const totalUnreadChats = useMemo(() => Object.values(unreadChatCounts).reduce((acc, count) => acc + count, 0), [unreadChatCounts]);

  const fetchAllUsers = useCallback(async (): Promise<UserData[]> => {
    try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
        setAllUsers(usersList);
        return usersList;
    } catch(e) {
        console.error("Error fetching all users:", e);
        return [];
    }
  }, []);

  const markChatAsRead = (chatId: string) => {
    setUnreadChatCounts(prev => ({ ...prev, [chatId]: 0 }));
    localStorage.setItem(`lastSeen_${chatId}`, Date.now().toString());
  };
  
    useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          setRole(data.role);
          localStorage.setItem('userRole', data.role);
        } else {
            const storedRole = localStorage.getItem('userRole') as UserRole;
            if(storedRole) setRole(storedRole);
        }
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
        localStorage.removeItem('userRole');
        setAllUsers([]);
        setUnreadChatCounts({});
      }
      setLoading(false);
    });

    return () => authUnsubscribe();
  }, []);


  // Listener for all users
   useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
        const usersList = snapshot.docs.map(doc => doc.data() as UserData);
        setAllUsers(usersList);
    }, (error) => {
        console.error("Error fetching all users:", error);
    });
    return () => unsubscribe();
   }, []);


  // Global listener for unread messages
  useEffect(() => {
    if (!user || !userData || allUsers.length === 0) {
      setUnreadChatCounts({});
      return;
    }

    const otherUsers = allUsers.filter(u => u.uid !== user.uid);
    const groupChats: {id: string}[] = [];
    if(userData.role === 'teacher' || userData.role === 'admin') {
      const allGens = new Set(allUsers.filter(u => u.role === 'student' && u.gen).map(u => u.gen));
      allGens.forEach(gen => {
        if(gen) groupChats.push({ id: `group-${gen}`})
      });
    } else if (userData.role === 'student' && userData.gen) {
      groupChats.push({id: `group-${userData.gen}`});
    }

    const allChatIds = [
      ...otherUsers.map(u => getChatId(user.uid, u.uid)),
      ...groupChats.map(g => g.id),
    ];
    
    const listeners: Unsubscribe[] = [];

    allChatIds.forEach(chatId => {
      const unsub = onMessages(chatId, (messages) => {
        const lastSeenTimestamp = parseInt(localStorage.getItem(`lastSeen_${chatId}`) || '0', 10);
        const newUnreadCount = messages.filter(m => 
          m.timestamp && m.timestamp.toMillis() > lastSeenTimestamp && m.senderId !== user.uid
        ).length;

        if (newUnreadCount > 0) {
          setUnreadChatCounts(prev => ({ ...prev, [chatId]: newUnreadCount }));
        } else {
          // ensure count is 0 if no new messages
          setUnreadChatCounts(prev => ({ ...prev, [chatId]: 0 }));
        }
      });
      listeners.push(unsub);
    });
    
    // Initial check
    allChatIds.forEach(chatId => {
        const lastSeen = localStorage.getItem(`lastSeen_${chatId}`);
        if(!lastSeen) {
             localStorage.setItem(`lastSeen_${chatId}`, '0');
        }
    });

    return () => {
      listeners.forEach(unsub => unsub());
    };
  }, [user, userData, allUsers]);

  const handleSetRole = async (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      try {
        await setDoc(docRef, { role: newRole }, { merge: true });
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      } catch (error) {
        console.error("Failed to update role in Firestore:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{user, userData, setUserData, role, loading, setRole: handleSetRole, fetchAllUsers, allUsers, unreadChatCounts, totalUnreadChats, markChatAsRead}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
