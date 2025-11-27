
// // src/contexts/AuthContext.tsx
// 'use client';

// import {createContext, useContext, useState, ReactNode, useEffect, useCallback, FC} from 'react';
// import {auth, db} from '@/lib/firebase';
// import type {User} from 'firebase/auth';
// import {onAuthStateChanged}from 'firebase/auth';
// import {doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot} from 'firebase/firestore';

// export type UserRole = 'student' | 'teacher' | 'admin';
// // Updated availability structure: day-specific time slots
// type DayAvailability = { startTime: string; endTime: string }[];
// type WeeklyAvailability = { [day: string]: DayAvailability };

// export interface UserData {
//   uid: string;
//   email: string;
//   displayName: string;
//   role: UserRole;
//   // Student specific
//   gen?: string;
//   schoolId?: string;
//   lessonDay?: string;
//   lessonType?: string;
//   lessonTime?: string;
//   hasEditedLessonDetails?: boolean;
//   bio?: string;
//   photoURL?: string;
//   totalPoints?: number;
//   // Teacher specific
//   // Teacher specific
 
//   // NEW: Day-specific availability
//   availability?: WeeklyAvailability;
//   // OLD: Keep for backwards compatibility (deprecated)
//   availableDays?: string[];
//   gensTaught?: string;
//   timeSlots?: { startTime: string; endTime: string }[];
//   linkedin?: string;
//   github?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   userData: UserData | null;
//   setUserData: React.Dispatch<React.SetStateAction<UserData | null>> | null;
//   role: UserRole | null;
//   loading: boolean;
//   setRole: (role: UserRole) => Promise<void>;
//   fetchAllUsers: () => Promise<UserData[]>;
//   fetchAllStudents: () => Promise<UserData[]>;
//   allUsers: UserData[];
// }

// const AuthContext = createContext<AuthContextType>({
//     user: null,
//     userData: null,
//     setUserData: null,
//     role: null,
//     loading: true,
//     setRole: async () => {},
//     fetchAllUsers: async () => [],
//     fetchAllStudents: async () => [],
//     allUsers: [],
// });

// export const AuthProvider: FC<{children: ReactNode}> = ({children}) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [role, setRole] = useState<UserRole | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [allUsers, setAllUsers] = useState<UserData[]>([]);

//   const fetchAllUsers = useCallback(async (): Promise<UserData[]> => {
//     try {
//         const usersCollection = collection(db, 'users');
//         const usersSnapshot = await getDocs(usersCollection);
//         const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
//         setAllUsers(usersList);
//         return usersList;
//     } catch(e) {
//         console.error("Error fetching all users:", e);
//         return [];
//     }
//   }, []);

//   const fetchAllStudents = useCallback(async (): Promise<UserData[]> => {
//     try {
//         const usersCollection = collection(db, 'users');
//         const q = query(usersCollection, where('role', '==', 'student'));
//         const usersSnapshot = await getDocs(q);
//         const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
//         return usersList;
//     } catch(e) {
//         console.error("Error fetching all students:", e);
//         return [];
//     }
//   }, []);
  
//   const handleSetRole = useCallback(async (newRole: UserRole) => {
//     const currentUser = auth.currentUser;
//     if (currentUser) {
//         try {
//             // Call API to set custom claim
//             await fetch('/api/auth/set-role', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ uid: currentUser.uid, role: newRole }),
//             });
//             // Force refresh the token on the client to get the new claims.
//             await currentUser.getIdToken(true);
            
//             // Update local state
//             setRole(newRole);
//             const docRef = doc(db, 'users', currentUser.uid);
//             // This merge might be redundant if the signup process already creates this field,
//             // but it's safe to have for consistency.
//             await setDoc(docRef, { role: newRole }, { merge: true });

//         } catch (error) {
//             console.error("Failed to set custom claims or update role in Firestore:", error);
//             // Optionally re-throw or handle the error in UI
//             throw error;
//         }
//     } else {
//         throw new Error("No user is currently authenticated.");
//     }
//   }, []);

//   useEffect(() => {
//     const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setUser(user);
        
//         // When auth state changes, get a fresh ID token which will have the latest claims.
//         const tokenResult = await user.getIdTokenResult(true);
//         const userRole = tokenResult.claims.role as UserRole | undefined;

//         const userDocUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
//             if (docSnap.exists()) {
//                 const data = docSnap.data() as UserData;
//                 setUserData(data);
//                 setRole(data.role || userRole || null); // Prioritize DB role, then token, then null
                
//                 await fetchAllUsers();
//                 setLoading(false);
//             } else {
//                 // If user is authenticated but no doc exists, it's likely a fresh signup.
//                 // The signup process will create the doc. We'll wait.
//                 setLoading(true);
//             }
//         }, (error) => {
//             console.error("Failed to fetch user data:", error);
//             setUser(null);
//             setUserData(null);
//             setRole(null);
//             setLoading(false);
//         });
        
//         return () => userDocUnsubscribe();

//       } else {
//         setUser(null);
//         setUserData(null);
//         setRole(null);
//         setLoading(false);
//       }
//     });

//     return () => authUnsubscribe();
//   }, [fetchAllUsers]);

//   return (
//     <AuthContext.Provider value={{user, userData, setUserData, role, loading, setRole: handleSetRole, fetchAllUsers, fetchAllStudents, allUsers}}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth(): AuthContextType {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


// src/contexts/AuthContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, FC} from 'react';
import {auth, db} from '@/lib/firebase';
import type {User} from 'firebase/auth';
import {onAuthStateChanged} from 'firebase/auth';
import {doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot} from 'firebase/firestore';
import { syncUserToMongoDB, getUserFromMongoDB } from '@/services/user-sync';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  gen?: string;
  schoolId?: string;
  lessonDay?: string;
  lessonType?: string;
  lessonTime?: string;
  hasEditedLessonDetails?: boolean;
  bio?: string;
  photoURL?: string;
  totalPoints?: number;
  availability?: { [day: string]: Array<{ startTime: string; endTime: string }> };
  availableDays?: string[];
  gensTaught?: string;
  timeSlots?: Array<{ startTime: string; endTime: string }>;
  linkedin?: string;
  github?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>> | null;
  role: UserRole | null;
  loading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  fetchAllUsers: () => Promise<UserData[]>;
  fetchAllStudents: () => Promise<UserData[]>;
  allUsers: UserData[];
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    setUserData: null,
    role: null,
    loading: true,
    setRole: async () => {},
    fetchAllUsers: async () => [],
    fetchAllStudents: async () => [],
    allUsers: [],
});

export const AuthProvider: FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  const fetchAllUsers = useCallback(async (): Promise<UserData[]> => {
    try {
        // Still fetch from Firestore for now (we'll migrate this gradually)
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

  const fetchAllStudents = useCallback(async (): Promise<UserData[]> => {
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'student'));
        const usersSnapshot = await getDocs(q);
        const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
        return usersList;
    } catch(e) {
        console.error("Error fetching all students:", e);
        return [];
    }
  }, []);
  
  const handleSetRole = useCallback(async (newRole: UserRole) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            // Set custom claim via API
            await fetch('/api/auth/set-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: currentUser.uid, role: newRole }),
            });
            
            await currentUser.getIdToken(true);
            setRole(newRole);
            
            // Update in Firestore
            const docRef = doc(db, 'users', currentUser.uid);
            await setDoc(docRef, { role: newRole }, { merge: true });

            // Sync to MongoDB
            if (userData) {
              await syncUserToMongoDB({ ...userData, role: newRole });
            }
        } catch (error) {
            console.error("Failed to set role:", error);
            throw error;
        }
    } else {
        throw new Error("No user is currently authenticated.");
    }
  }, [userData]);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        const tokenResult = await user.getIdTokenResult(true);
        const userRole = tokenResult.claims.role as UserRole | undefined;

        // Listen to Firestore for real-time updates
        const userDocUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as UserData;
                setUserData(data);
                setRole(data.role || userRole || null);
                
                // Sync to MongoDB in background (don't block UI)
                syncUserToMongoDB(data).catch(err => {
                  console.error('Background sync to MongoDB failed:', err);
                });
                
                await fetchAllUsers();
                setLoading(false);
            } else {
                setLoading(true);
            }
        }, (error) => {
            console.error("Failed to fetch user data:", error);
            setUser(null);
            setUserData(null);
            setRole(null);
            setLoading(false);
        });
        
        return () => userDocUnsubscribe();
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, [fetchAllUsers]);

  return (
    <AuthContext.Provider value={{user, userData, setUserData, role, loading, setRole: handleSetRole, fetchAllUsers, fetchAllStudents, allUsers}}>
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