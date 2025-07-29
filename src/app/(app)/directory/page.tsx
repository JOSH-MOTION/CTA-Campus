// src/app/(app)/directory/page.tsx
'use client';

import {useEffect, useState, useMemo} from 'react';
import {ContactCard, type Contact} from '@/components/directory/ContactCard';
import {Input} from '@/components/ui/input';
import {Search, Loader2} from 'lucide-react';
import {useAuth, UserData} from '@/contexts/AuthContext';

export default function DirectoryPage() {
  const {fetchAllUsers} = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      const staff = users.filter(u => u.role === 'teacher' || u.role === 'admin');
      setAllUsers(staff);
      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers]);

  const filteredContacts = useMemo(() => {
    const mappedUsers: Contact[] = allUsers.map(user => ({
      id: user.uid,
      name: user.displayName,
      role: user.role === 'teacher' ? 'Teacher' : 'Administrator',
      department: user.role === 'teacher' ? `Teaches: ${user.gensTaught || 'N/A'}` : 'Administration',
      email: user.email,
      linkedin: user.linkedin,
      github: user.github,
      avatar: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName.charAt(0)}`,
      dataAiHint: user.role === 'teacher' ? 'teacher portrait' : 'admin portrait',
      availability: 'Please check the booking schedule for availability.', // Placeholder
      preferences: 'Email or Direct Message are preferred.', // Placeholder
    }));

    if (!searchTerm) {
      return mappedUsers;
    }

    return mappedUsers.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <p className="text-muted-foreground">Find contact information for faculty and staff.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for name, role, department..."
          className="w-full pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
