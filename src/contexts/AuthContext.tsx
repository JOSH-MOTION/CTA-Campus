// src/contexts/AuthContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {auth, db} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged}from 'firebase/auth';
import {doc, getDoc, setDoc} from 'firebase/firestore';

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
  // Teacher specific
  gensTaught?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedData = docSnap.data() as UserData;
          setUserData(fetchedData);
          if (fetchedData.role) {
            setRole(fetchedData.role);
            localStorage.setItem('userRole', fetchedData.role);
          }
        } else {
          // If no user doc, check localStorage (for just-signed-up users)
          const storedRole = localStorage.getItem('userRole') as UserRole;
          if (storedRole && ['student', 'teacher', 'admin'].includes(storedRole)) {
            setRole(storedRole);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, {role: newRole}, {merge: true}).then(() => {
        if (userData) {
          setUserData({...userData, role: newRole});
        }
      });
    }
  };

  return (
    <AuthContext.Provider value={{user, userData, role, loading, setRole: handleSetRole}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
