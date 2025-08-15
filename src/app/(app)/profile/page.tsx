// src/app/(app)/profile/page.tsx
'use client';

import {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {useAuth} from '@/contexts/AuthContext';
import {Camera, LogOut, Loader2, Linkedin, Github} from 'lucide-react';
import {auth, storage, db} from '@/lib/firebase';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {updateProfile} from 'firebase/auth';
import {doc, updateDoc} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  bio: z.string().optional(),
  // student specific
  gen: z.string().optional(),
  lessonDay: z.string().optional(),
  lessonType: z.string().optional(),
  // teacher specific
  gensTaught: z.string().optional(),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  github: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const {user, userData, role, loading, setUserData} = useAuth();
  const {toast} = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      gen: '',
      lessonDay: '',
      lessonType: '',
      gensTaught: '',
      linkedin: '',
      github: '',
    }
  });

  useEffect(() => {
    if (user?.photoURL) {
      setPreviewUrl(user.photoURL);
    }
    if (userData) {
      form.reset({
        displayName: user?.displayName || '',
        bio: userData.bio || '',
        gen: userData.gen || '',
        lessonDay: userData.lessonDay || '',
        lessonType: userData.lessonType || '',
        gensTaught: userData.gensTaught || '',
        linkedin: userData.linkedin || '',
        github: userData.github || '',
      });
    }
  }, [user, userData, form]);

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

  const handleSavePicture = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    const storageRef = ref(storage, `profile-pictures/${user.uid}/${selectedFile.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateProfile(user, {photoURL: downloadURL});
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });

      setPreviewUrl(downloadURL);
      setSelectedFile(null);
      if (setUserData) setUserData(prev => prev ? {...prev, photoURL: downloadURL} : null);
      toast({title: 'Success', description: 'Profile picture updated!'});
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({variant: 'destructive', title: 'Error', description: 'Failed to update profile picture.'});
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormValues) => {
    if (!user || !userData) return;
    form.clearErrors();
    const updateData: any = { // Use 'any' to dynamically add properties
        displayName: data.displayName,
        bio: data.bio
    };

    let lessonDetailsChanged = false;
    if (role === 'student') {
        updateData.gen = data.gen;
        if (userData.lessonDay !== data.lessonDay || userData.lessonType !== data.lessonType) {
            lessonDetailsChanged = true;
        }
        updateData.lessonDay = data.lessonDay;
        updateData.lessonType = data.lessonType;
        if(lessonDetailsChanged && !userData.hasEditedLessonDetails) {
            updateData.hasEditedLessonDetails = true;
        }
    }
    if (role === 'teacher' || role === 'admin') {
        updateData.gensTaught = data.gensTaught;
        updateData.linkedin = data.linkedin;
        updateData.github = data.github;
    }

    try {
        if(user.displayName !== data.displayName) {
            await updateProfile(user, { displayName: data.displayName });
        }
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, updateData);
        if (setUserData) setUserData(prev => prev ? {...prev, ...updateData} : null);

        toast({title: 'Profile Updated', description: 'Your information has been saved.'});
    } catch (error) {
        console.error("Error updating profile: ", error);
        toast({variant: 'destructive', title: 'Error', description: 'Failed to update profile.'});
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
  };

  if (loading || !user || !userData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const getRoleBasedDescription = () => {
    switch (role) {
      case 'student': return 'Update your profile picture and personal information.';
      case 'teacher': return 'Manage your public profile and contact details.';
      case 'admin': return 'System-wide administrative profile.';
    }
  };
  
  const lessonDetailsLocked = role === 'student' && userData.hasEditedLessonDetails;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">{getRoleBasedDescription()}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>A picture helps other users identify you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-md">
              <AvatarImage src={previewUrl ?? undefined} alt="Profile picture" />
              <AvatarFallback className="text-4xl">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <Button size="icon" className="absolute bottom-1 right-1 rounded-full" onClick={handleUploadClick}>
              <Camera className="h-5 w-5" />
            </Button>
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          <Button onClick={handleSavePicture} disabled={!selectedFile || isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Picture'}
          </Button>
        </CardContent>
      </Card>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdateProfile)}>
            <Card>
                <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>
                    Update your personal information here.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Tell us a little about yourself" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    {role === 'student' && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <FormField
                                control={form.control}
                                name="gen"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Generation</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Gen 30" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="lessonDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lesson Day</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={lessonDetailsLocked}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a day" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="monday">Monday</SelectItem>
                                                <SelectItem value="tuesday">Tuesday</SelectItem>
                                                <SelectItem value="wednesday">Wednesday</SelectItem>
                                                <SelectItem value="thursday">Thursday</SelectItem>
                                                <SelectItem value="friday">Friday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {lessonDetailsLocked && <p className="text-xs text-muted-foreground pt-1">Lesson details can only be set once.</p>}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                     {(role === 'teacher' || role === 'admin') && (
                        <>
                            <FormField
                                control={form.control}
                                name="gensTaught"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Generations Taught</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Gen 28, Gen 30" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="linkedin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://linkedin.com/in/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="github"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://github.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>


      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
