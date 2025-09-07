// src/components/announcements/EditAnnouncementDialog.tsx
'use client';

import {useState, type ReactNode, useEffect, useMemo, useRef} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Announcement, useAnnouncements} from '@/contexts/AnnouncementsContext';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup} from '@/components/ui/select';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { uploadImage } from '@/lib/cloudinary';

const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target audience.'),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnnouncementDialog({ announcement, isOpen, onOpenChange }: EditAnnouncementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {updateAnnouncement} = useAnnouncements();
  const {toast} = useToast();
  const {fetchAllUsers} = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(announcement.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        setLoadingUsers(true);
        const users = await fetchAllUsers();
        setAllUsers(users);
        setLoadingUsers(false);
      };
      loadUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const availableGens = useMemo(() => {
    const studentGens = allUsers
      .filter(u => u.role === 'student' && u.gen)
      .map(u => u.gen!);
    return [...new Set(studentGens)].sort();
  }, [allUsers]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    values: {
      title: announcement.title,
      content: announcement.content,
      targetGen: announcement.targetGen,
    },
  });

  const onSubmit = async (data: AnnouncementFormValues) => {
    setIsSubmitting(true);
    let imageUrl = announcement.imageUrl;

    try {
      if (imageFile) {
        const uploadResult: any = await uploadImage(imageFile);
        imageUrl = uploadResult.secure_url;
      }
      
      await updateAnnouncement(announcement.id, {
        title: data.title,
        content: data.content,
        targetGen: data.targetGen,
        imageUrl: imageUrl || undefined,
      });
      toast({
        title: 'Announcement Updated',
        description: 'Your announcement has been successfully updated.',
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update announcement. You may not have permission.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Make changes to your existing announcement.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upcoming Midterm Exams" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="targetGen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingUsers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                           <SelectItem value="Everyone">Everyone (incl. Staff)</SelectItem>
                           <SelectItem value="All Students">All Students</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                           {availableGens.map(gen => (
                            <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="content"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide the full details of the announcement here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
              <FormLabel>Image (Optional)</FormLabel>
              <FormControl>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" width={200} height={100} className="mx-auto h-24 object-contain" />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="flex text-sm text-muted-foreground">
                      <p className="pl-1">Click to upload an image</p>
                      <Input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </FormControl>
            </FormItem>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
