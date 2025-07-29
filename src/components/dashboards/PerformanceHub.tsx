// src/components/dashboards/PerformanceHub.tsx
'use client';

import {useState, useMemo, useEffect} from 'react';
import {BarChart, PieChart, TrendingUp, Award, Loader2} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {ChartContainer, ChartTooltipContent} from '@/components/ui/chart';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

const initialGradingData = [
  {title: 'Class Attendance', current: 0, total: 50, description: '1 point per attendance'},
  {title: 'Class Assignments', current: 0, total: 50, description: '1 point per assignment'},
  {title: 'Class Exercises', current: 0, total: 50, description: '1 point per exercise'},
  {title: 'Weekly Projects', current: 0, total: 50, description: '1 point per project'},
  {title: 'Monthly Personal Projects', current: 0, total: 10, description: '1 point per project'},
  {title: 'Soft Skills & Product Training', current: 0, total: 6, description: '1 point per attendance'},
  {title: 'Mini Demo Days', current: 0, total: 5, description: '5 points per demo'},
  {title: '100 Days of Code', current: 0, total: 50, description: '0.5 points per day'},
  {title: 'Code Review', current: 0, total: 5, description: '1 point per contribution'},
  {title: 'Final Project Completion', current: 0, total: 10, description: 'Awarded upon completion'},
];

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#a4de6c',
  '#d0ed57',
  '#ffc658',
];

export default function PerformanceHub({ studentId }: { studentId?: string }) {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [gradingData, setGradingData] = useState(initialGradingData);
  const [loading, setLoading] = useState(true);

  const targetUserId = studentId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const pointsCol = collection(db, 'users', targetUserId, 'points');
    const q = query(pointsCol);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userPoints: { [key: string]: number } = {};
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const reason = data.reason;
        if (reason) {
          userPoints[reason] = (userPoints[reason] || 0) + data.points;
        }
      });
      
      const updatedGradingData = initialGradingData.map(item => ({
        ...item,
        current: userPoints[item.title] || 0,
      }));

      setGradingData(updatedGradingData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching points data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetUserId]);

  const chartData = useMemo(() => gradingData.map(item => ({
    name: item.title,
    value: item.current,
  })).filter(item => item.value > 0), [gradingData]);

  const overallProgress = useMemo(() => {
    const totalCurrent = gradingData.reduce((acc, item) => acc + item.current, 0);
    const totalPossible = gradingData.reduce((acc, item) => acc + item.total, 0);
    return {
      current: totalCurrent,
      total: totalPossible,
      percentage: totalPossible > 0 ? (totalCurrent / totalPossible) * 100 : 0,
    };
  }, [gradingData]);

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Performance Hub</CardTitle>
                  <CardDescription>Your academic points breakdown and progress.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <CardTitle>Performance Hub</CardTitle>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
              >
                <BarChart className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={chartType === 'pie' ? 'default' : 'outline'}
                onClick={() => setChartType('pie')}
              >
                <PieChart className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>Your academic points breakdown and progress.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                You have earned {overallProgress.current.toFixed(1)} out of {overallProgress.total} possible points.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress.percentage} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
            <div className="space-y-4">
            {gradingData.map(item => (
                <div key={item.title} className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">
                    {item.current.toFixed(1)} / {item.total} pts
                    </span>
                </div>
                <Progress value={(item.current / item.total) * 100} />
                </div>
            ))}
            </div>
            <div className="min-h-[300px] w-full h-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        {chartType === 'bar' ? (
                        <RechartsBarChart
                            data={chartData}
                            layout="vertical"
                            margin={{left: 0, right: 10, top: 10, bottom: 10}}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={5}
                                tick={{fontSize: 10, width: 100, whiteSpace: 'pre-wrap'}}
                                className="text-xs"
                                width={100}
                            />
                            <XAxis dataKey="value" type="number" hide />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                            <Bar dataKey="value" radius={5}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </RechartsBarChart>
                        ) : (
                        <RechartsPieChart margin={{left: 0, right: 0, top: 0, bottom: 0}}>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                        </RechartsPieChart>
                        )}
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>No points recorded yet.</p>
                        <p className="text-xs">Complete an activity to see your progress.</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
