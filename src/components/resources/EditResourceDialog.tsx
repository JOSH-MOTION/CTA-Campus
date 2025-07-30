// src/components/resources/EditResourceDialog.tsx
'use client';

import {useState, type ReactNode} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useResources, type Resource} from '@/contexts/ResourcesContext';
import {useAuth} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const resourceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  content: z.string().min(20, "Content must be at least 20 characters for the summarizer."),
  type: z.enum(['Article', 'Video', 'Link', 'Document']),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

interface EditResourceDialogProps {
  resource: Resource;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditResourceDialog({ resource, isOpen, onOpenChange }: EditResourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {updateResource} = useResources();
  const {toast} = useToast();

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    values: {
      title: resource.title,
      description: resource.description,
      url: resource.url,
      content: resource.content,
      type: resource.type,
    },
  });

  const onSubmit = async (data: ResourceFormValues) => {
    setIsSubmitting(true);
    try {
      await updateResource(resource.id, {
        ...resource, // spread old resource to keep authorId and createdAt
        ...data,
      });
      toast({
        title: 'Resource Updated',
        description: 'The resource has been successfully updated.',
      });
      onOpenChange(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update resource. You may not have permission.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Make changes to the resource details below.
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
                    <Input placeholder="e.g., The Importance of Clean Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief summary of the resource" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Resource Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select resource type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Article">Article</SelectItem>
                                <SelectItem value="Video">Video</SelectItem>
                                <SelectItem value="Link">Link</SelectItem>
                                <SelectItem value="Document">Document</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="url"
                    render={({field}) => (
                        <FormItem>
                        <FormLabel>URL (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com/resource" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Full Content</FormLabel>
                  <FormDescription>
                    Paste the full text content here for the AI summarizer.
                  </FormDescription>
                  <FormControl>
                    <Textarea placeholder="Paste the article text here..." {...field} rows={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
