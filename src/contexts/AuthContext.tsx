'use client';

import {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {auth, db} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';

export type UserRole = 'student' | 'teacher' | 'admin';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role) {
            setRole(userData.role);
            localStorage.setItem('userRole', userData.role);
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
      setDoc(docRef, {role: newRole}, {merge: true});
    }
  };

  return (
    <AuthContext.Provider value={{user, role, loading, setRole: handleSetRole}}>
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
