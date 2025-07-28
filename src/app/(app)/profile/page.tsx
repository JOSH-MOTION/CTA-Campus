// src/app/(app)/profile/page.tsx
'use client';

import {useState, useRef} from 'react';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useAuth} from '@/contexts/AuthContext';
import {Camera} from 'lucide-react';

export default function ProfilePage() {
  const {role} = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    if (selectedFile) {
      // Here you would typically upload the file to Firebase Storage
      console.log('Uploading file:', selectedFile.name);
      alert(`Simulating upload for ${selectedFile.name}`);
    }
  };

  const getRoleBasedInfo = () => {
    switch (role) {
      case 'student':
        return {
          name: 'Alex Doe',
          email: 'alex.doe@university.edu',
          fallback: 'AD',
          description: 'Update your profile picture and personal information.',
        };
      case 'teacher':
        return {
          name: 'Dr. Evelyn Reed',
          email: 'e.reed@university.edu',
          fallback: 'ER',
          description: 'Manage your public profile and contact details.',
        };
      case 'admin':
        return {
          name: 'Admin User',
          email: 'admin@university.edu',
          fallback: 'AU',
          description: 'System-wide administrative profile.',
        };
    }
  };

  const userInfo = getRoleBasedInfo();

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">{userInfo.description}</p>
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
              <AvatarFallback className="text-4xl">{userInfo.fallback}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-1 right-1 rounded-full"
              onClick={handleUploadClick}
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{userInfo.name}</h2>
            <p className="text-muted-foreground">{userInfo.email}</p>
          </div>
          <Button onClick={handleSave} disabled={!selectedFile}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
