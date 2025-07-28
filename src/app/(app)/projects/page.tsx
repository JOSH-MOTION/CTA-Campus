// src/app/(app)/projects/page.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookMarked, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Badge } from '@/components/ui/badge';
import { ProjectActions } from '@/components/projects/ProjectActions';

export default function ProjectsPage() {
  const { role, userData } = useAuth();
  const { projects, loading } = useProjects();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const filteredProjects = useMemo(() => {
    if (isTeacherOrAdmin) return projects;
    return projects.filter(project => {
      if (project.targetGen === 'Everyone') return true;
      if (role === 'student' && project.targetGen === 'All Students') return true;
      if (role === 'student' && project.targetGen === userData?.gen) return true;
      return false;
    });
  }, [projects, isTeacherOrAdmin, role, userData?.gen]);
  
  const sortedProjects = [...filteredProjects].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin ? 'Create and manage projects.' : 'View and submit your projects.'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <CreateProjectDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </CreateProjectDialog>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map(project => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <CardTitle>{project.title}</CardTitle>
                    {isTeacherOrAdmin && <Badge variant={project.targetGen === 'Everyone' ? 'destructive' : project.targetGen === 'All Students' ? 'default' : 'secondary'} className="mt-1">{project.targetGen}</Badge>}
                  </div>
                  <ProjectActions project={project} />
                </div>
                <CardDescription className="pt-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow"></CardContent>
              <CardFooter>
                 <Button className="w-full">
                    View Project Details
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <BookMarked className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No projects yet</h2>
          <p className="mt-1 text-muted-foreground">
            {isTeacherOrAdmin ? 'Create the first project to get started.' : 'Check back later for projects.'}
          </p>
        </div>
      )}
    </div>
  );
}
