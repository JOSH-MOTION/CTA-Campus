// src/app/(app)/projects/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookMarked, Loader2, ArrowRight, CheckCircle, BookCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Badge } from '@/components/ui/badge';
import { ProjectActions } from '@/components/projects/ProjectActions';
import { SubmitProjectDialog } from '@/components/projects/SubmitProjectDialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const { role, userData, user } = useAuth();
  const { projects, loading } = useProjects();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  const router = useRouter();
  const [submittedProjectIds, setSubmittedProjectIds] = useState<Set<string>>(new Set());
  const [checkingSubmissions, setCheckingSubmissions] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
        if (role === 'student' && user) {
            setCheckingSubmissions(true);
            const submissionsQuery = query(
                collection(db, 'submissions'),
                where('studentId', '==', user.uid)
            );
            const querySnapshot = await getDocs(submissionsQuery);
             const projectSubmissions = new Set<string>();
            querySnapshot.docs.forEach(doc => {
              const submission = doc.data();
              if (projects.some(p => p.id === submission.assignmentId)) {
                projectSubmissions.add(submission.assignmentId);
              }
            });
            setSubmittedProjectIds(projectSubmissions);
            setCheckingSubmissions(false);
        } else {
            setCheckingSubmissions(false);
        }
    };
     if (!loading) {
       fetchSubmissions();
    }
  }, [user, role, loading, projects]);
  
  const sortedProjects = [...projects].sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });

  const isLoading = loading || (role === 'student' && checkingSubmissions);

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

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map(project => {
            const hasSubmitted = submittedProjectIds.has(project.id);
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <CardTitle>{project.title}</CardTitle>
                      {isTeacherOrAdmin && <Badge variant={project.targetGen === 'Everyone' ? 'destructive' : project.targetGen === 'All Students' ? 'default' : 'secondary'} className="mt-1">{project.targetGen}</Badge>}
                    </div>
                    {isTeacherOrAdmin && <ProjectActions project={project} />}
                  </div>
                  <CardDescription className="pt-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter>
                  {isTeacherOrAdmin ? (
                      <Button variant="outline" className="w-full" onClick={() => router.push(`/projects/${project.id}`)}>
                          <BookCheck className="mr-2 h-4 w-4" />
                          View Submissions
                      </Button>
                  ) : hasSubmitted ? (
                      <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submitted
                      </Button>
                  ) : (
                      <SubmitProjectDialog project={project} onSubmissionSuccess={() => {
                          setSubmittedProjectIds(prev => new Set(prev).add(project.id));
                      }}>
                          <Button className="w-full">
                            Submit Work <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      </SubmitProjectDialog>
                  )}
                </CardFooter>
              </Card>
            )
          })}
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
