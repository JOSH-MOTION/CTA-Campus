// src/app/(app)/resources/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Upload } from 'lucide-react';
import { useResources } from '@/contexts/ResourcesContext';
import { CreateResourceDialog } from '@/components/resources/CreateResourceDialog';
import { useAuth } from '@/contexts/AuthContext';


export default function ResourcesPage() {
  const { resources, loading } = useResources();
  const [searchTerm, setSearchTerm] = useState('');
  const { role } = useAuth();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const filteredResources = useMemo(() => {
    if (!searchTerm) {
      return resources;
    }
    return resources.filter(resource =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Resources Library</h1>
          <p className="text-muted-foreground">Find and share course materials, articles, and useful links.</p>
        </div>
        {isTeacherOrAdmin && (
          <CreateResourceDialog>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </CreateResourceDialog>
        )}
      </div>

      <div className="relative">
         <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search for resources..." 
          className="w-full pl-9" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          ) : (
             <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-10">
                No resources found.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
