'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StudentReport } from '@/types/report';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportsPage() {
  const [reports, setReports] = useState<(StudentReport & { id: string })[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reports'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setReports(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = reports.filter(r =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.gen.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Evaluation Reports</h1>
          <p className="text-muted-foreground">Individual performance & career readiness reports</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search student or gen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(report => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{report.studentName}</h3>
                  <p className="text-sm text-muted-foreground">{report.gen}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{report.overallPoints}</p>
                  <p className="text-xs text-muted-foreground">/ {report.maxPoints}</p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={`/reports/${report.studentId}`}>
                  <FileText className="mr-2 h-4 w-4" /> View Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}