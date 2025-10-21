'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  Users,
} from 'lucide-react';
import { fetchAllPerformance, StudentPerformance, WeekRecord } from '@/lib/performance';

const TOTAL_WEEKS = 30;

interface GenGroup {
  gen: string;
  students: StudentPerformance[];
}

const PerformanceExportSystem = () => {
  const [data, setData] = useState<StudentPerformance[]>([]);
  const [groupedData, setGroupedData] = useState<GenGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const perf = await fetchAllPerformance();
        setData(perf);

        // Group by gen
        const grouped = perf.reduce((acc: any, s) => {
          if (!acc[s.gen]) acc[s.gen] = [];
          acc[s.gen].push(s);
          return acc;
        }, {});

        const sortedGroups: GenGroup[] = Object.keys(grouped)
          .sort()
          .map((gen) => ({
            gen,
            students: grouped[gen],
          }));

        setGroupedData(sortedGroups);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const { headers, rows } = convertToExcelFormat(data);
      const csv = generateCSV({ headers, rows });
      downloadCSV(csv, `Performance_${new Date().toISOString().split('T')[0]}.csv`);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!autoSync) return;
    const id = setInterval(exportToExcel, 3_600_000);
    return () => clearInterval(id);
  }, [autoSync, data]);

  const formatCell = (record: { completed: boolean; points: number }) =>
    record.completed ? `Check (${record.points})` : '';

  const generateWeekHeaders = () => {
    const h: string[] = [];
    for (let i = 1; i <= TOTAL_WEEKS; i++) {
      h.push(`Week ${i} (Att)`, `Week ${i} (Ex)`, `Week ${i} (As)`, `Week ${i} (Pr)`, `Week ${i} (100D)`);
    }
    return h;
  };

  const flattenWeeklyData = (weeks: WeekRecord[]) =>
    weeks.flatMap((w) => [
      formatCell(w.attendance),
      formatCell(w.classExercise),
      formatCell(w.assignment),
      formatCell(w.project),
      formatCell(w.hundredDays),
    ]);

  const convertToExcelFormat = (perf: StudentPerformance[]) => {
    const headers = ['Student ID', 'Student Name', 'Gen', 'Active', ...generateWeekHeaders()];
    const rows = perf.map((s) => [
      s.studentId,
      s.studentName,
      s.gen,
      'Yes',
      ...flattenWeeklyData(s.weeks),
    ]);
    return { headers, rows };
  };

  const generateCSV = ({ headers, rows }: any) =>
    [headers.join(','), ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(','))].join('\n');

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Export</h1>
          <p className="text-gray-600 mt-1">Grouped by Generation • 100 Days = 0.5 pts</p>
        </div>
        <FileSpreadsheet className="h-12 w-12 text-blue-600" />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6 grid md:grid-cols-3 gap-4">
        <button
          onClick={exportToExcel}
          disabled={exporting || loading}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>

        <button
          onClick={() => setAutoSync(!autoSync)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
            autoSync ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {autoSync ? <CheckCircle className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
          {autoSync ? 'Auto-Sync ON' : 'Enable Auto-Sync'}
        </button>
      </div>

      {lastSync && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          Last sync: <strong>{lastSync.toLocaleString()}</strong>
        </div>
      )}

      {/* Live Preview: Grouped by Gen */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : groupedData.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No students found.</div>
      ) : (
        <div className="space-y-8">
          {groupedData.map((group) => (
            <div key={group.gen} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">{group.gen}</h2>
                <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                  {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 text-gray-900 font-medium">ID</th>
                      <th className="px-3 py-2 text-left sticky left-16 bg-gray-50 text-gray-900 font-medium">Name</th>
                      {Array.from({ length: 5 }, (_, i) => (
                        <th key={i} colSpan={5} className="px-3 py-2 text-center border-l text-gray-900 font-medium">
                          Week {i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-gray-900 font-medium">Points</th>
                    </tr>
                    <tr className="bg-gray-50 text-gray-700">
                      <th colSpan={2}></th>
                      {Array.from({ length: 5 }, () => (
                        <>
                          <th className="px-2 py-1 text-xs font-medium">Att</th>
                          <th className="px-2 py-1 text-xs font-medium">Ex</th>
                          <th className="px-2 py-1 text-xs font-medium">As</th>
                          <th className="px-2 py-1 text-xs font-medium">Pr</th>
                          <th className="px-2 py-1 text-xs font-medium">100D</th>
                        </>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.students.map((s) => (
                      <tr key={s.studentId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 sticky left-0 bg-white font-medium text-gray-900">{s.studentId}</td>
                        <td className="px-3 py-2 sticky left-16 bg-white font-medium text-gray-900">{s.studentName}</td>
                        {s.weeks.slice(0, 5).map((w, i) => (
                          <React.Fragment key={i}>
                            <td className="px-2 py-2 text-center text-gray-800">{formatCell(w.attendance)}</td>
                            <td className="px-2 py-2 text-center text-gray-800">{formatCell(w.classExercise)}</td>
                            <td className="px-2 py-2 text-center text-gray-800">{formatCell(w.assignment)}</td>
                            <td className="px-2 py-2 text-center text-gray-800">{formatCell(w.project)}</td>
                            <td className="px-2 py-2 text-center text-gray-800 font-bold text-emerald-600">
                              {formatCell(w.hundredDays)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="px-3 py-2 font-bold text-gray-900">{s.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceExportSystem;