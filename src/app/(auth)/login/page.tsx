// src/app/(auth)/login/page.tsx
'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {auth} from '@/lib/firebase';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {useAuth} from '@/contexts/AuthContext';
import {Compass} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gen, setGen] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [lessonDay, setLessonDay] = useState('');
  const [lessonType, setLessonType] = useState('online');
  const [bio, setBio] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {toast} = useToast();
  const {user} = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({title: 'Login Successful', description: 'Welcome back!'});
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // In a real app, you would save the extra details to a Firestore database
        // associated with the user's UID.
        await updateProfile(userCredential.user, {displayName: fullName});
        console.log('Signup details:', {
          uid: userCredential.user.uid,
          fullName,
          gen,
          schoolId,
          lessonDay,
          lessonType,
          bio,
        });
        toast({title: 'Sign Up Successful', description: 'Your account has been created.'});
      }
      // The onAuthStateChanged listener in AuthContext will handle redirection
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

  if (user) return null; // Don't render anything if user is already logged in (and redirecting)

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="flex items-center gap-3 text-primary">
        <Compass className="h-10 w-10" />
        <h1 className="text-4xl font-bold">Campus Compass</h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Login' : 'Student Sign Up'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Enter your credentials to access your account.' : 'Create an account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gen">Generation</Label>
                    <Input id="gen" type="text" placeholder="e.g., Gen 30" required value={gen} onChange={e => setGen(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolId">School ID</Label>
                    <Input id="schoolId" type="text" placeholder="CTAxxxx" required value={schoolId} onChange={e => setSchoolId(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Lesson Day</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select onValueChange={setLessonDay} value={lessonDay} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                    <RadioGroup defaultValue="online" className="flex items-center space-x-4" onValueChange={setLessonType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online">Online</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-person" id="in-person" />
                        <Label htmlFor="in-person">In-person</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </>
            )}
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
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea id="bio" placeholder="Tell us a little about yourself" value={bio} onChange={e => setBio(e.target.value)} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-1">
              {isLogin ? 'Sign up' : 'Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
