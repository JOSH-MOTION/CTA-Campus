// src/contexts/AuthContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, FC} from 'react';
import {auth, db} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged}from 'firebase/auth';
import {doc, getDoc, setDoc, collection, getDocs} from 'firebase/firestore';

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
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>> | null;
  role: UserRole | null;
  loading: boolean;
  setRole: (role: UserRole) => void;
  fetchAllUsers: () => Promise<UserData[]>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    setUserData: null,
    role: null,
    loading: true,
    setRole: () => {},
    fetchAllUsers: async () => [],
});

export const AuthProvider: FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
            // Case for newly signed up user where doc might not be available
             const storedRole = localStorage.getItem('userRole') as UserRole;
             if(storedRole) setRole(storedRole);
        }
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
  
  const fetchAllUsers = useCallback(async (): Promise<UserData[]> => {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
    return usersList;
  }, []);

  return (
    <AuthContext.Provider value={{user, userData, setUserData, role, loading, setRole: handleSetRole, fetchAllUsers}}>
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
