// src/app/(app)/materials/page.tsx (REDESIGNED)
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
import { PlusCircle, Youtube, FileText, Loader2, Eye, Users, Calendar, Clock, BookOpen, Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Material, 
  addMaterial, 
  getUnlockedMaterials, 
  trackMaterialView, 
  onMaterialViewsForGen, 
  MaterialView,
  sortMaterialsByRoadmap
} from '@/services/materials-tracking';
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
import { Label } from '@/components/ui/label';
import clsx from 'clsx';

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

  useEffect(() => {
    if (!isTeacherOrAdmin || !selectedGen) return;

    const unsubscribe = onMaterialViewsForGen(selectedGen, (views) => {
      setMaterialViews(views);
    });

    return () => unsubscribe();
  }, [selectedGen, isTeacherOrAdmin]);

  const filteredMaterials = useMemo(() => {
    if (isTeacherOrAdmin) {
      return sortMaterialsByRoadmap(materials, roadmapData);
    }
    return getUnlockedMaterials(completedWeeks, roadmapData, materials);
  }, [isTeacherOrAdmin, materials, completedWeeks, roadmapData]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            Learning Materials
          </h1>
          <p className="text-muted-foreground text-lg">Resources to support your learning journey</p>
        </header>

        {isTeacherOrAdmin ? (
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="materials" className="text-base">Materials Library</TabsTrigger>
              <TabsTrigger value="tracking" className="text-base">Student Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-8 animate-fade-in">
              {/* Add Material Form */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Add New Material
                  </CardTitle>
                  <CardDescription>Create learning resources for your students</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Introduction to React Hooks" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Youtube className="h-4 w-4 text-red-500" />
                                Video URL
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://youtube.com/..." {...field} className="h-11" />
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
                              <FormLabel className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                Slides URL
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://slides.com/..." {...field} className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Subject" />
                                  </SelectTrigger>
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
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Week" />
                                  </SelectTrigger>
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
                      
                      <Button 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={isSubmitting} 
                        size="lg" 
                        className="w-full md:w-auto"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding Material...</>
                        ) : (
                          <><PlusCircle className="mr-2 h-5 w-5" /> Add Material</>
                        )}
                      </Button>
                    </div>
                  </Form>
                </CardContent>
              </Card>

              {/* Materials Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">All Materials</h2>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {filteredMaterials.length} {filteredMaterials.length === 1 ? 'resource' : 'resources'}
                  </Badge>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-lg">No materials added yet</p>
                      <p className="text-sm text-muted-foreground">Create your first learning resource above</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMaterials.map((material, idx) => (
                      <Card 
                        key={material.id} 
                        className="group hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in border-2"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <CardHeader className="bg-gradient-to-br from-muted/50 to-muted/20">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg leading-tight mb-2">{material.title}</CardTitle>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">{material.subject}</Badge>
                                <Badge variant="secondary" className="text-xs">{material.week}</Badge>
                              </div>
                            </div>
                            <MaterialActions material={material} />
                          </div>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-3 pt-6">
                          {material.videoUrl && (
                            <Button variant="default" className="w-full" asChild>
                              <a href={material.videoUrl} target="_blank" rel="noopener noreferrer">
                                <Youtube className="mr-2 h-4 w-4" />
                                Watch Video
                              </a>
                            </Button>
                          )}
                          {material.slidesUrl && (
                            <Button variant="outline" className="w-full" asChild>
                              <a href={material.slidesUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
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

            <TabsContent value="tracking" className="space-y-6 animate-fade-in">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Material Analytics
                  </CardTitle>
                  <CardDescription>Track student engagement with learning materials</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Select Generation</Label>
                    <Select value={selectedGen} onValueChange={setSelectedGen}>
                      <SelectTrigger className="w-full md:w-[250px] h-11">
                        <SelectValue placeholder="Choose a generation" />
                      </SelectTrigger>
                      <SelectContent>
                        {manageableGens.map(gen => (
                          <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGen && filteredMaterials.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Material Access Report</h3>
                      <div className="grid gap-4">
                        {filteredMaterials.map(material => {
                          const views = getViewsForMaterial(material);
                          return (
                            <Card key={material.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                              <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <h4 className="font-semibold text-base">{material.title}</h4>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="outline" className="text-xs">{material.subject}</Badge>
                                      <Badge variant="secondary" className="text-xs">{material.week}</Badge>
                                      <Badge className="text-xs">{views.length} {views.length === 1 ? 'view' : 'views'}</Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleViewsClick(material)}
                                    className="w-full md:w-auto"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedGen && filteredMaterials.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No materials available yet</p>
                    </div>
                  )}

                  {!selectedGen && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a generation to view analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Materials</h2>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredMaterials.length} available
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Lock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">No materials available yet</p>
                  <p className="text-sm text-muted-foreground">Complete previous weeks to unlock new resources</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material, idx) => (
                  <Card 
                    key={material.id} 
                    className="group hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in border-2"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardTitle className="text-lg leading-tight mb-2">{material.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{material.subject}</Badge>
                        <Badge variant="secondary" className="text-xs">{material.week}</Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3 pt-6">
                      {material.videoUrl && (
                        <Button variant="default" className="w-full" asChild>
                          <a href={material.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Youtube className="mr-2 h-4 w-4" />
                            Watch Video
                          </a>
                        </Button>
                      )}
                      {material.slidesUrl && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={material.slidesUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
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
      </div>

      {/* Views Dialog */}
      <Dialog open={viewsDialogOpen} onOpenChange={setViewsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Student Access Details</DialogTitle>
            <DialogDescription className="text-base">
              {selectedMaterialForViews?.title} - {selectedMaterialForViews?.subject} {selectedMaterialForViews?.week}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {selectedMaterialForViews && getViewsForMaterial(selectedMaterialForViews).length > 0 ? (
              getViewsForMaterial(selectedMaterialForViews).map((view, idx) => (
                <Card key={view.id} className="p-4 animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-lg">{view.studentName}</p>
                        <Badge variant="secondary">{view.gen}</Badge>
                        <Badge variant={view.completed ? "default" : "outline"}>
                          {view.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(view.viewedAt.toDate()).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {(view.duration / 60).toFixed(1)} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Eye className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No student access recorded yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}