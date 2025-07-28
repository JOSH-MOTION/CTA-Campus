// src/app/(app)/profile/page.tsx
'use client';

import {useState, useRef, useEffect} from 'react';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useAuth} from '@/contexts/AuthContext';
import {Camera, LogOut, Briefcase, GraduationCap, Calendar, Monitor, Users, BookUser} from 'lucide-react';
import {auth, storage} from '@/lib/firebase';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {updateProfile} from 'firebase/auth';
import {useToast} from '@/hooks/use-toast';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';

export default function ProfilePage() {
  const {user, userData, role, loading} = useAuth();
  const {toast} = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.photoURL) {
      setPreviewUrl(user.photoURL);
    }
  }, [user]);

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

  const handleSave = async () => {
    if (selectedFile && user) {
      setIsUploading(true);
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${selectedFile.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, selectedFile);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await updateProfile(user, {photoURL: downloadURL});

        setPreviewUrl(downloadURL);
        setSelectedFile(null);
        toast({title: 'Success', description: 'Profile picture updated!'});
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({variant: 'destructive', title: 'Error', description: 'Failed to update profile picture.'});
      } finally {
        setIsUploading(false);
      }
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
      case 'student':
        return 'Update your profile picture and personal information.';
      case 'teacher':
        return 'Manage your public profile and contact details.';
      case 'admin':
        return 'System-wide administrative profile.';
    }
  };
  
  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    value ? (
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium capitalize">{value}</p>
        </div>
      </div>
    ) : null
  );

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
        <CardContent className="flex flex-col items-center gap-6">
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
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{user.displayName || 'User'}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-2 capitalize">{role}</Badge>
          </div>
          <Button onClick={handleSave} disabled={!selectedFile || isUploading}>
            {isUploading ? 'Saving...' : 'Save Picture'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            This information is managed by the administration and is read-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData.bio && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="font-medium italic">"{userData.bio}"</p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
            {role === 'student' && (
              <>
                <InfoItem icon={GraduationCap} label="Generation" value={userData.gen} />
                <InfoItem icon={BookUser} label="School ID" value={userData.schoolId} />
                <InfoItem icon={Calendar} label="Lesson Day" value={userData.lessonDay} />
                <InfoItem icon={Monitor} label="Lesson Type" value={userData.lessonType} />
              </>
            )}
             {role === 'teacher' && (
              <InfoItem icon={Users} label="Generations Taught" value={userData.gensTaught} />
            )}
          </div>
        </CardContent>
      </Card>

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
