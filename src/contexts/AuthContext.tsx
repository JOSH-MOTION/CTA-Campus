'use client';

import {createContext, useContext, useState, ReactNode, useEffect} from 'react';

export type UserRole = 'student' | 'teacher' | 'admin';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [role, setRole] = useState<UserRole>('student');

  useEffect(() => {
    // You can add logic here to get the user's role from a cookie, local storage, or an API call.
    // For now, we'll default to 'student'.
    const storedRole = localStorage.getItem('userRole') as UserRole;
    if (storedRole && ['student', 'teacher', 'admin'].includes(storedRole)) {
      setRole(storedRole);
    }
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
  };

  return <AuthContext.Provider value={{role, setRole: handleSetRole}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
