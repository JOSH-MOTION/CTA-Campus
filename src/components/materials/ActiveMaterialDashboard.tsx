// src/components/materials/ActiveMaterialDashboard.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Users, Eye, Clock } from 'lucide-react';
import { onMaterialViewsForGen, MaterialView } from '@/services/materials-tracking';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ActiveMaterialDashboardProps {
  generation: string;
  materials: Array<{ id: string; title: string; subject: string; week: string }>;
  completedWeeks: Set<string>;
}

export function ActiveMaterialDashboard({
  generation,
  materials,
  completedWeeks,
}: ActiveMaterialDashboardProps) {
  const [materialViews, setMaterialViews] = useState<MaterialView[]>([]);
  const [loading, setLoading] = useState(true);
  const { roadmapData } = useRoadmap();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onMaterialViewsForGen(generation, (views) => {
      setMaterialViews(views);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [generation]);

  // Get the current active material (most recently viewed)
  const currentActiveMaterial = useMemo(() => {
    if (materialViews.length === 0) return null;
    
    const sorted = [...materialViews].sort((a, b) => 
      new Date(b.viewedAt.toDate()).getTime() - new Date(a.viewedAt.toDate()).getTime()
    );

    const latestView = sorted[0];
    return {
      material: materials.find(m => 
        m.subject === latestView.materialId.split('-')[0] &&
        m.week === latestView.materialId.split('-')[1]
      ),
      view: latestView,
      totalViews: materialViews.filter(v => 
        v.materialId === latestView.materialId
      ).length,
      uniqueStudents: new Set(
        materialViews
          .filter(v => v.materialId === latestView.materialId)
          .map(v => v.studentId)
      ).size,
    };
  }, [materialViews, materials]);

  // Get material statistics
  const materialStats = useMemo(() => {
    const stats: Record<string, {
      title: string;
      subject: string;
      week: string;
      views: number;
      uniqueStudents: number;
      lastViewed?: Date;
      isUnlocked: boolean;
    }> = {};

    materials.forEach(material => {
      const id = `${material.subject}-${material.week}`;
      const views = materialViews.filter(v => v.materialId === id);
      const uniqueStudents = new Set(views.map(v => v.studentId)).size;
      const lastView = views.sort((a, b) => 
        new Date(b.viewedAt.toDate()).getTime() - new Date(a.viewedAt.toDate()).getTime()
      )[0];

      const weekId = `${material.subject}-${material.week}`;
      const isUnlocked = completedWeeks.has(weekId);

      stats[id] = {
        title: material.title,
        subject: material.subject,
        week: material.week,
        views: views.length,
        uniqueStudents,
        lastViewed: lastView ? lastView.viewedAt.toDate() : undefined,
        isUnlocked,
      };
    });

    return stats;
  }, [materials, materialViews, completedWeeks]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Material Activity Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Active Material */}
      {currentActiveMaterial && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Currently Active Material
            </CardTitle>
            <CardDescription>
              What {generation} students are viewing now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{currentActiveMaterial.material?.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {currentActiveMaterial.material?.subject} - {currentActiveMaterial.material?.week}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {currentActiveMaterial.totalViews} views
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {currentActiveMaterial.uniqueStudents} students
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                Last viewed: {currentActiveMaterial.view.viewedAt.toDate().toLocaleString()}
              </p>
              <p>Student: {currentActiveMaterial.view.studentName}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Material Access Statistics</CardTitle>
          <CardDescription>
            Overview of all {generation} materials and student engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unlocked" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="all">All Materials</TabsTrigger>
              <TabsTrigger value="engaging">Most Engaging</TabsTrigger>
            </TabsList>

            <TabsContent value="unlocked" className="space-y-4 mt-4">
              {Object.entries(materialStats)
                .filter(([, stat]) => stat.isUnlocked)
                .length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No unlocked materials yet. Mark weeks as complete in the roadmap.
                </p>
              ) : (
                Object.entries(materialStats)
                  .filter(([, stat]) => stat.isUnlocked)
                  .map(([id, stat]) => (
                    <MaterialStatCard key={id} stat={stat} />
                  ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-4">
              {Object.entries(materialStats).map(([id, stat]) => (
                <MaterialStatCard key={id} stat={stat} />
              ))}
            </TabsContent>

            <TabsContent value="engaging" className="space-y-4 mt-4">
              {Object.entries(materialStats)
                .sort((a, b) => b[1].views - a[1].views)
                .slice(0, 5)
                .map(([id, stat]) => (
                  <MaterialStatCard key={id} stat={stat} highlight />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialStatCard({
  stat,
  highlight = false,
}: {
  stat: {
    title: string;
    subject: string;
    week: string;
    views: number;
    uniqueStudents: number;
    lastViewed?: Date;
    isUnlocked: boolean;
  };
  highlight?: boolean;
}) {
  const engagementPercentage = Math.min((stat.uniqueStudents / 30) * 100, 100); // Assuming max 30 students

  return (
    <Card className={highlight ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{stat.title}</h4>
              <p className="text-sm text-muted-foreground">
                {stat.subject} - {stat.week}
              </p>
            </div>
            {!stat.isUnlocked && (
              <Badge variant="outline" className="text-xs">Locked</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-3 w-3" />
                Total Views
              </div>
              <p className="text-2xl font-semibold">{stat.views}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                Students
              </div>
              <p className="text-2xl font-semibold">{stat.uniqueStudents}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Student Engagement</span>
              <span>{engagementPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={engagementPercentage} />
          </div>

          {stat.lastViewed && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last viewed: {stat.lastViewed.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}