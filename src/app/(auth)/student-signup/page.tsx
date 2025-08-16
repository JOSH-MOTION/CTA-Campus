
// src/app/(auth)/student-signup/page.tsx
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
import {Camera, Clock, Compass} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const availableGens = ['Gen 28', 'Gen 29', 'Gen 30', 'Gen 31', 'Gen 32'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return `${formattedHour}:${minute}`;
});


export default function StudentSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gen, setGen] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [lessonDay, setLessonDay] = useState('');
  const [lessonType, setLessonType] = useState('online');
  const [lessonTime, setLessonTime] = useState('');
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!lessonTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a time for your lesson.',
      });
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem('userRole', 'student');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const {user} = userCredential;

      await updateProfile(user, {displayName: fullName});
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        role: 'student',
        gen,
        schoolId,
        lessonDay,
        lessonType,
        lessonTime,
        bio,
      });

      setRole('student');
      toast({title: 'Sign Up Successful', description: 'Your account has been created.'});
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
        <h1 className="text-4xl font-bold">Coderain Campus</h1>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Student Sign Up</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={previewUrl ?? undefined} alt="Profile picture preview" />
                  <AvatarFallback className="text-4xl">{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
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
                placeholder="John Doe"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gen">Generation</Label>
                 <Select onValueChange={setGen} value={gen} required>
                  <SelectTrigger id="gen">
                    <SelectValue placeholder="Select a generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGens.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">School ID</Label>
                <Input id="schoolId" type="text" placeholder="CTAxxxx" required value={schoolId} onChange={e => setSchoolId(e.target.value)} />
              </div>
            </div>
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
            <div className="space-y-2">
              <Label>Lesson Day & Time</Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select onValueChange={setLessonDay} value={lessonDay} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                     {daysOfWeek.map(day => (
                        <SelectItem key={day} value={day.toLowerCase()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <Select onValueChange={setLessonTime} value={lessonTime} required>
                    <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeSlots.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className='pt-2'>
                 <Label>Lesson Type</Label>
                 <RadioGroup defaultValue="online" className="flex items-center space-x-4 pt-2" onValueChange={setLessonType}>
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
              <Textarea id="bio" placeholder="Tell us a little about yourself" value={bio} onChange={e => setBio(e.target.value)} />
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
