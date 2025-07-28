'use client';

import {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {auth} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged} from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      // In a real app, you would fetch the user's role from your database.
      // We'll use localStorage for this simulation.
      const storedRole = localStorage.getItem('userRole') as UserRole;
      if (user && storedRole && ['student', 'teacher', 'admin'].includes(storedRole)) {
        setRole(storedRole);
      } else if (user) {
        // default to student if no role is stored
        setRole('student');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
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
