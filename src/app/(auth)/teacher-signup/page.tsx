// src/app/(auth)/teacher-signup/page.tsx
'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {auth, db} from '@/lib/firebase';
import {doc, setDoc} from 'firebase/firestore';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {useAuth} from '@/contexts/AuthContext';
import {Camera, Compass} from 'lucide-react';
import {Textarea} from '@/components/ui/textarea';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import Link from 'next/link';

export default function TeacherSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gensTaught, setGensTaught] = useState('');
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {toast} = useToast();
  const {user, setRole} = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGensTaughtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // This regex ensures "Gen" is capitalized and followed by numbers and commas.
    const sanitizedValue = value.replace(/[^Gen\d, ]/g, '').replace(/gen/g, 'Gen');
    setGensTaught(sanitizedValue);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.setItem('userRole', 'teacher');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const {user} = userCredential;
      
      await updateProfile(user, {displayName: fullName});
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        role: 'teacher',
        gensTaught,
        bio,
      });

      setRole('teacher');
      toast({title: 'Sign Up Successful', description: 'Your teacher account has been created.'});
    } catch (error: any) {
      localStorage.removeItem('userRole');
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
          <CardTitle className="text-2xl">Teacher Sign Up</CardTitle>
          <CardDescription>Create a teacher account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={previewUrl ?? undefined} alt="Profile picture preview" />
                  <AvatarFallback className="text-4xl">{fullName ? fullName.charAt(0).toUpperCase() : 'T'}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={handleUploadClick}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Dr. Evelyn Reed"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gensTaught">Generations Taught</Label>
              <Input
                id="gensTaught"
                type="text"
                placeholder="e.g., Gen 28, Gen 30"
                required
                value={gensTaught}
                onChange={handleGensTaughtChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.reed@example.com"
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
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea id="bio" placeholder="Tell us a little about your teaching experience" value={bio} onChange={e => setBio(e.target.value)} />
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
