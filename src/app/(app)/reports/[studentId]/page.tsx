'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { StudentReport } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Props {
  params: { studentId: string };
}

const ratingBadge = (rating: string) => {
  const map: any = {
    'High': 'bg-green-500',
    'Above Average': 'bg-emerald-500',
    'Average': 'bg-blue-500',
    'Below Average': 'bg-orange-500',
    'Low': 'bg-red-500',
  };
  return <Badge className={`${map[rating] || 'bg-gray-500'} text-white`}>{rating}</Badge>;
};

export default function StudentReportPage({ params }: Props) {
  const { userData, role } = useAuth();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const isStaff = role === 'teacher' || role === 'admin';

  useEffect(() => {
    const fetch = async () => {
      const docRef = doc(db, 'reports', params.studentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as StudentReport;
        setReport(data);
        setForm({
          strengths: data.strengths?.join('\n') || '',
          areasForImprovement: data.areasForImprovement?.join('\n') || '',
          noteworthyAchievements: data.noteworthyAchievements?.join('\n') || '',
          recommendations: data.recommendations?.join('\n') || '',
          teacherComment: data.teacherComment || '',
          careerLeadComment: data.careerLeadComment || '',
        });
      }
    };
    fetch();
  }, [params.studentId]);

  const save = async () => {
    if (!report) return;
    const updates: any = {
      strengths: form.strengths.split('\n').filter(Boolean),
      areasForImprovement: form.areasForImprovement.split('\n').filter(Boolean),
      noteworthyAchievements: form.noteworthyAchievements.split('\n').filter(Boolean),
      recommendations: form.recommendations.split('\n').filter(Boolean),
      teacherComment: form.teacherComment,
      careerLeadComment: form.careerLeadComment,
      lastEditedBy: userData?.uid,
      lastEditedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, 'reports', params.studentId), updates);
    setEditing(false);
    alert('Report saved!');
  };

  if (!report) return <div>Loading...</div>;

  const metrics = report.careerMetrics;
  const percentage = Math.round((report.overallPoints / report.maxPoints) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{report.studentName}</h1>
        <p className="text-xl text-muted-foreground">{report.gen} Evaluation Document</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-bold">{report.overallPoints} / {report.maxPoints}</p>
            <p className="text-2xl">{percentage}%</p>
          </div>

          {/* Academic Ratings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><strong>Attendance:</strong> {ratingBadge(report.attendanceRating)}</div>
            <div><strong>Assignments:</strong> {ratingBadge(report.assignmentsRating)}</div>
            <div><strong>Weekly Projects:</strong> {ratingBadge(report.weeklyProjectsRating)}</div>
            <div><strong>Participation:</strong> {ratingBadge(report.classParticipationRating)}</div>
          </div>

          <Separator />

          {/* Career Service Evaluation */}
          <h3 className="text-xl font-semibold">Career Service Evaluation</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span>Career Module (10 pts):</span> <Badge variant={metrics.careerModuleCompleted ? "default" : "destructive"}>{metrics.careerModuleCompleted ? 'Completed' : 'Pending'}</Badge></div>
            <div className="flex justify-between"><span>Events & Workshops (≥12):</span> <strong>{metrics.eventsAttended}/12</strong></div>
            <div className="flex justify-between"><span>Job/Internship Applications (≥24):</span> <strong>{metrics.jobApplications}/24</strong></div>
            <div className="flex justify-between"><span>One-on-One Sessions (≥24):</span> <strong>{metrics.oneOnOneSessions}/24</strong></div>
            <div className="flex justify-between"><span>CV & Portfolio:</span> <Badge variant={metrics.cvPortfolioApproved ? "default" : "destructive"}>{metrics.cvPortfolioApproved ? 'Approved' : 'Needs Review'}</Badge></div>
          </div>

          <Separator />

          {/* Editable Sections */}
          {isStaff && (
            <div className="flex justify-end gap-2">
              <Button variant={editing ? "outline" : "default"} onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit Comments'}
              </Button>
              {editing && <Button onClick={save}>Save Changes</Button>}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div><strong>Strengths</strong><Textarea value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} /></div>
              <div><strong>Areas for Improvement</strong><Textarea value={form.areasForImprovement} onChange={e => setForm({...form, areasForImprovement: e.target.value})} /></div>
              <div><strong>Noteworthy Achievements</strong><Textarea value={form.noteworthyAchievements} onChange={e => setForm({...form, noteworthyAchievements: e.target.value})} /></div>
              <div><strong>Recommendations</strong><Textarea value={form.recommendations} onChange={e => setForm({...form, recommendations: e.target.value})} /></div>
              <div><strong>Teacher's Comment</strong><Textarea value={form.teacherComment} onChange={e => setForm({...form, teacherComment: e.target.value})} /></div>
              <div><strong>Career Lead Comment</strong><Textarea value={form.careerLeadComment} onChange={e => setForm({...form, careerLeadComment: e.target.value})} /></div>
            </div>
          ) : (
            <>
              <div><strong>Strengths:</strong><ul className="list-disc pl-6">{report.strengths?.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
              <div><strong>Areas for Improvement:</strong><ul className="list-disc pl-6">{report.areasForImprovement?.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
              <div><strong>Noteworthy Achievements:</strong><ul className="list-disc pl-6">{report.noteworthyAchievements?.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
              <div><strong>Recommendations:</strong><ul className="list-disc pl-6">{report.recommendations?.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
              {report.teacherComment && <div><strong>Teacher:</strong> {report.teacherComment}</div>}
              {report.careerLeadComment && <div><strong>Career Lead:</strong> {report.careerLeadComment}</div>}
              {report.employerFeedback && <div><strong>Employer Feedback:</strong> {report.employerFeedback}</div>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Generated on {report.generatedAt?.toDate()?.toLocaleDateString()}
        {report.lastEditedAt && <><br/>Last edited {report.lastEditedAt.toDate()?.toLocaleString()}</>}
      </div>
    </div>
  );
}