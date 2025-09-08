
// src/app/(app)/teachers/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TeacherCard } from '@/components/teachers/TeacherCard';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('role', '==', 'teacher'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teacherList = querySnapshot.docs.map(doc => doc.data() as UserData);
      setTeachers(teacherList);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load teachers data:", error);
      setLoading(false);
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = 
        teacher.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.gensTaught && teacher.gensTaught.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [teachers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Directory</h1>
        <p className="text-muted-foreground">Browse and manage all teachers in the system.</p>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or generation taught..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

       {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTeachers.map(teacher => (
                <TeacherCard key={teacher.uid} teacher={teacher} />
            ))}
        </div>
      )}
    </div>
  );
}
