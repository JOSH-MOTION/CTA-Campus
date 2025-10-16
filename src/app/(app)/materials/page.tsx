// src/app/(app)/materials/page.tsx (updated)
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Youtube, FileText, Loader2, Eye, Users, Calendar, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Material, addMaterial, getUnlockedMaterials, trackMaterialView, onMaterialViewsForGen, MaterialView } from '@/services/materials-tracking';
import { MaterialActions } from '@/components/materials/MaterialActions';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const materialSchema = z.object({
  title: z.string().min(3, 'Title is too short.'),
  videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  slidesUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  subject: z.string().nonempty('Please select a subject.'),
  week: z.string().nonempty('Please select a week.'),
}).refine(data => data.videoUrl || data.slidesUrl, {
    message: "Please provide at least one link for a video or slides.",
    path: ["videoUrl"],
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function MaterialsPage() {
  const { roadmapData, completedWeeks, completionMap } = useRoadmap();
  const { toast } = useToast();
  const { role, userData, allUsers } = useAuth();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialViews, setMaterialViews] = useState<MaterialView[]>([]);
  const [selectedGen, setSelectedGen] = useState<string>('');
  const [viewsDialogOpen, setViewsDialogOpen] = useState(false);
  const [selectedMaterialForViews, setSelectedMaterialForViews] = useState<Material | null>(null);

  // Get manageable generations for teacher
  const manageableGens = useMemo(() => {
    if (!isTeacherOrAdmin) return [];
    
    if (role === 'admin') {
      const allGens = new Set<string>();
      allUsers.forEach(u => {
        if (u.role === 'student' && u.gen) {
          allGens.add(u.gen);
        }
      });
      return Array.from(allGens).sort();
    }

    return userData?.gensTaught?.split(',').map(g => g.trim()).filter(Boolean) || [];
  }, [userData, isTeacherOrAdmin, role, allUsers]);

  // Materials listener
  useEffect(() => {
    setIsLoading(true);
    const materialsCollection = collection(db, 'materials');
    const q = query(materialsCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMaterials = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      setMaterials(fetchedMaterials);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching materials:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch materials from the database.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Material views listener for teachers
  useEffect(() => {
    if (!isTeacherOrAdmin || !selectedGen) return;

    const unsubscribe = onMaterialViewsForGen(selectedGen, (views) => {
      setMaterialViews(views);
    });

    return () => unsubscribe();
  }, [selectedGen, isTeacherOrAdmin]);

  // Determine unlocked materials for students
  const unlockedWeekIds = useMemo(() => {
    if (isTeacherOrAdmin) return null; // Teachers/admins see everything

    // Students start with all their completed weeks unlocked
    const unlocked = new Set<string>(completedWeeks);

    roadmapData.forEach(subject => {
        let lastCompletedWeekIndex = -1;
        subject.weeks.forEach((week, index) => {
            const weekId = `${subject.title}-${week.title}`;
            if (completedWeeks.has(weekId)) {
                lastCompletedWeekIndex = index;
            }
        });
        
        // Unlock the next week if there is one
        if (lastCompletedWeekIndex !== -1 && lastCompletedWeekIndex + 1 < subject.weeks.length) {
            const nextWeek = subject.weeks[lastCompletedWeekIndex + 1];
            unlocked.add(`${subject.title}-${nextWeek.title}`);
        } else if (lastCompletedWeekIndex === -1 && subject.weeks.length > 0) {
            const firstWeek = subject.weeks[0];
            unlocked.add(`${subject.title}-${firstWeek.title}`);
        }
    });

    return unlocked;
  }, [isTeacherOrAdmin, completedWeeks, roadmapData]);
  
  const filteredMaterials = useMemo(() => {
    if (isTeacherOrAdmin) return materials;
    return materials.filter(material => {
      const materialWeekId = `${material.subject}-${material.week}`;
      return unlockedWeekIds?.has(materialWeekId);
    });
  }, [materials, isTeacherOrAdmin, unlockedWeekIds]);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: '',
      videoUrl: '',
      slidesUrl: '',
    },
  });

  const selectedSubjectTitle = form.watch('subject');

  const availableWeeks = useMemo(() => {
    if (!selectedSubjectTitle) return [];
    const subject = roadmapData.find(s => s.title === selectedSubjectTitle);
    return subject ? subject.weeks : [];
  }, [selectedSubjectTitle, roadmapData]);

  const onSubmit = async (data: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      await addMaterial(data);
      toast({ title: 'Material Added!', description: 'The new resource is now available.' });
      form.reset();
    } catch (error) {
      console.error('Error adding material:', error);
       toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Failed to save the material. You might not have permission.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getViewsForMaterial = (material: Material) => {
    return materialViews.filter(view => 
      view.materialId === `${material.subject}-${material.week}`
    );
  };

  const handleViewsClick = (material: Material) => {
    setSelectedMaterialForViews(material);
    setViewsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Class Materials</h1>
        <p className="text-muted-foreground">Add and manage learning resources for each topic.</p>
      </div>

      {isTeacherOrAdmin ? (
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="tracking">Student Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Material</CardTitle>
                <CardDescription>Link a video or slide deck to a specific topic in the roadmap.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Flexbox Explained" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://youtube.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slidesUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slides URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://slides.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roadmapData.map(s => <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="week"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Week</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectTitle}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select Week" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableWeeks.map(w => <SelectItem key={w.title} value={w.title}>{w.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                      ) : (
                        <><PlusCircle className="mr-2 h-4 w-4" /> Add Material</>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">All Materials</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No materials have been added yet.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {materials.map(material => (
                    <Card key={material.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                             <CardTitle>{material.title}</CardTitle>
                              <CardDescription>
                                  {material.subject} - {material.week}
                              </CardDescription>
                          </div>
                          <MaterialActions material={material} />
                        </div>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-2 items-stretch">
                         {material.videoUrl && (
                           <Button variant="outline" asChild>
                               <a href={material.videoUrl} target="_blank" rel="noopener noreferrer">
                                   <Youtube className="mr-2 h-4 w-4 text-red-500" />
                                   View Video
                               </a>
                           </Button>
                         )}
                         {material.slidesUrl && (
                           <Button variant="outline" asChild>
                               <a href={material.slidesUrl} target="_blank" rel="noopener noreferrer">
                                   <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                   View Slides
                               </a>
                           </Button>
                         )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Material Tracking</CardTitle>
                <CardDescription>View which materials your students are accessing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Generation</label>
                  <Select value={selectedGen} onValueChange={setSelectedGen}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Select a generation" />
                    </SelectTrigger>
                    <SelectContent>
                      {manageableGens.map(gen => (
                        <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGen && materials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Material Access Report</h3>
                    <div className="grid gap-4">
                      {materials.map(material => {
                        const views = getViewsForMaterial(material);
                        return (
                          <Card key={material.id} className="bg-muted/50">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{material.title}</CardTitle>
                                  <CardDescription>{material.subject} - {material.week}</CardDescription>
                                </div>
                                <Badge variant="outline">{views.length} views</Badge>
                              </div>
                            </CardHeader>
                            <CardFooter>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewsClick(material)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details ({views.length})
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Available Materials</h2>
           {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No materials available yet. Complete previous weeks to unlock them.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map(material => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex-1 pr-2">
                       <CardTitle>{material.title}</CardTitle>
                        <CardDescription>
                            {material.subject} - {material.week}
                        </CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2 items-stretch">
                     {material.videoUrl && (
                       <Button variant="outline" asChild>
                           <a href={material.videoUrl} target="_blank" rel="noopener noreferrer">
                               <Youtube className="mr-2 h-4 w-4 text-red-500" />
                               View Video
                           </a>
                       </Button>
                     )}
                     {material.slidesUrl && (
                       <Button variant="outline" asChild>
                           <a href={material.slidesUrl} target="_blank" rel="noopener noreferrer">
                               <FileText className="mr-2 h-4 w-4 text-blue-500" />
                               View Slides
                           </a>
                       </Button>
                     )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Views Dialog */}
      <Dialog open={viewsDialogOpen} onOpenChange={setViewsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Access Details</DialogTitle>
            <DialogDescription>
              {selectedMaterialForViews?.title} - {selectedMaterialForViews?.subject} {selectedMaterialForViews?.week}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedMaterialForViews && getViewsForMaterial(selectedMaterialForViews).length > 0 ? (
              getViewsForMaterial(selectedMaterialForViews).map(view => (
                <Card key={view.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="font-semibold">{view.studentName}</p>
                      <Badge variant="secondary">{view.gen}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(view.viewedAt.toDate()).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {(view.duration / 60).toFixed(1)} minutes
                      </p>
                      <p>Status: {view.completed ? 'Completed' : 'Viewing'}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No student access yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}