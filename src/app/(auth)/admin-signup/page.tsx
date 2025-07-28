// src/app/(auth)/admin-signup/page.tsx
'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {auth} from '@/lib/firebase';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {useAuth} from '@/contexts/AuthContext';
import {Compass} from 'lucide-react';
import Link from 'next/link';

export default function AdminSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {toast} = useToast();
  const {user} = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {displayName: fullName});
      console.log('Admin Signup details:', {
        uid: userCredential.user.uid,
        role: 'admin',
        fullName,
      });
      toast({title: 'Sign Up Successful', description: 'Your admin account has been created.'});
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="flex items-center gap-3 text-primary">
        <Compass className="h-10 w-10" />
        <h1 className="text-4xl font-bold">Campus Compass</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Sign Up</CardTitle>
          <CardDescription>Create a new administrative account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Admin User"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?
            <Button variant="link" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
