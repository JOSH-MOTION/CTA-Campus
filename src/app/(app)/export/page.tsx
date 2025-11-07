'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchAllPerformance, StudentPerformance, WeekRecord } from '@/lib/performance';
import ExcelJS from 'exceljs';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { getAllWeeksInOrder } from '@/services/materials-tracking';

interface GenGroup {
  gen: string;
  students: StudentPerformance[];
}

// Extend WeekRecord to support daily 100DoC (you'll need to update backend/data)
interface ExtendedWeekRecord extends WeekRecord {
  hundredDaysDaily?: boolean[]; // 7 days: Mon-Sun
}

const PerformanceExportSystem = () => {
  const [data, setData] = useState<StudentPerformance[]>([]);
  const [groupedData, setGroupedData] = useState<GenGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [availableGens, setAvailableGens] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { roadmapData } = useRoadmap();
  const weeksFromRoadmap = useMemo(() => getAllWeeksInOrder(roadmapData), [roadmapData]);
  const TOTAL_WEEKS = weeksFromRoadmap.length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const perf = await fetchAllPerformance(weeksFromRoadmap);
        setData(perf);

        const grouped = perf.reduce((acc: any, s) => {
          if (!acc[s.gen]) acc[s.gen] = [];
          acc[s.gen].push(s);
          return acc;
        }, {});

        const sortedGroups: GenGroup[] = Object.keys(grouped)
          .sort()
          .map((gen) => ({
            gen,
            students: grouped[gen].sort((a, b) => b.totalPoints - a.totalPoints),
          }));

        setGroupedData(sortedGroups);
        setAvailableGens(['all', ...sortedGroups.map(g => g.gen)]);
        setExpandedGroups(new Set(sortedGroups.map(g => g.gen)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weeksFromRoadmap]);

  const filteredData = useMemo(() => {
    if (selectedGen === 'all') return groupedData;
    return groupedData.filter(g => g.gen === selectedGen);
  }, [groupedData, selectedGen]);

  const toggleGroup = (gen: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(gen) ? next.delete(gen) : next.add(gen);
      return next;
    });
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const filtered = selectedGen === 'all' ? data : data.filter(s => s.gen === selectedGen);
      await exportExcelWorkbook(filtered);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!autoSync) return;
    const id = setInterval(exportToExcel, 3_600_000); // 1 hour
    return () => clearInterval(id);
  }, [autoSync, data, selectedGen]);

  const formatCell = (record: { completed: boolean; points: number }) =>
    record.completed ? `✓ (${record.points})` : '';

  const subjectColors: Record<string, string> = {
    Git: 'FF0EA5E9',
    HTML: 'FFEF4444',
    CSS: 'FF3B82F6',
    Tailwind: 'FF8B5CF6',
    JS: 'FFF59E0B',
    'System Design': 'FF475569',
    'Data Structures and Algorithms': 'FFF43F5E',
    React: 'FF10B981',
    Firebase: 'FFF97316',
    'Backend - NodeJS': 'FFA3E635',
    'React Native': 'FFA855F7',
    'Final Project': 'FFD946EF',
  };

  const generateWeekHeaders = () => {
    return weeksFromRoadmap.slice(0, TOTAL_WEEKS).map((w, idx) => ({
      subject: w.subject,
      weekLabel: `Week ${idx + 1} (${w.subject})`,
    }));
  };

  const exportExcelWorkbook = async (perf: StudentPerformance[]) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Gradebook');
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 3 }];

    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 24;
    ws.getColumn(3).width = 10;
    ws.getColumn(4).width = 6;

    const weekHeaders = generateWeekHeaders();
    const categories = ['Att', 'Ex', 'As', 'Pr'];
    const startCol = 5;
    let colCursor = startCol;

    // Row 1: Subject Groups
    let weekIndex = 0;
    while (weekIndex < Math.min(TOTAL_WEEKS, weekHeaders.length)) {
      const currentSubject = weekHeaders[weekIndex].subject;
      let weeksInSubject = 0;
      while (
        weekIndex + weeksInSubject < weekHeaders.length &&
        weekHeaders[weekIndex + weeksInSubject].subject === currentSubject
      ) {
        weeksInSubject++;
      }

      const subjectStart = colCursor;
      const subjectEnd = colCursor + weeksInSubject * 11 - 1; // 4 + 7 days
      if (subjectStart <= subjectEnd) {
        ws.mergeCells(1, subjectStart, 1, subjectEnd);
        const cell = ws.getCell(1, subjectStart);
        cell.value = currentSubject;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        const fillColor = subjectColors[currentSubject] || 'FF374151';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        for (let c = subjectStart; c <= subjectEnd; c++) {
          ws.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        }
      }

      colCursor = subjectEnd + 1;
      weekIndex += weeksInSubject;
    }

    // Row 2: Week Labels
    colCursor = startCol;
    for (let i = 0; i < Math.min(TOTAL_WEEKS, weekHeaders.length); i++) {
      const weekStart = colCursor;
      const weekEnd = colCursor + 10; // 11 columns per week
      ws.mergeCells(2, weekStart, 2, weekEnd);
      const fillColor = subjectColors[weekHeaders[i].subject] || 'FF6B7280';
      const cell = ws.getCell(2, weekStart);
      cell.value = weekHeaders[i].weekLabel;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      for (let c = weekStart; c <= weekEnd; c++) {
        ws.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      }
      colCursor += 11;
    }

    // Row 3: Category Headers
    ws.getCell(3, 1).value = 'Student ID';
    ws.getCell(3, 2).value = 'Student Name';
    ws.getCell(3, 3).value = 'Gen';
    ws.getCell(3, 4).value = 'Yes';
    ws.getRow(3).font = { bold: true };

    colCursor = startCol;
    for (let i = 0; i < Math.min(TOTAL_WEEKS, weekHeaders.length); i++) {
      for (const cat of categories) {
        const cell = ws.getCell(3, colCursor++);
        cell.value = cat;
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      }
      for (let d = 0; d < 7; d++) {
        const cell = ws.getCell(3, colCursor++);
        cell.value = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][d];
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, color: { argb: 'FF059669' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
    }

    // Data Rows
    const rowsStart = 4;
    perf.forEach((s, idx) => {
      const rowIdx = rowsStart + idx;
      ws.getCell(rowIdx, 1).value = s.studentId;
      ws.getCell(rowIdx, 2).value = s.studentName;
      ws.getCell(rowIdx, 3).value = s.gen;
      ws.getCell(rowIdx, 4).value = 'Yes';

      let c = startCol;
      const weeksToWrite = Math.min(TOTAL_WEEKS, s.weeks.length);
      for (let w = 0; w < weeksToWrite; w++) {
        const week = s.weeks[w] as ExtendedWeekRecord;
        [week.attendance, week.classExercise, week.assignment, week.project].forEach(rec => {
          ws.getCell(rowIdx, c++).value = formatCell(rec);
        });

        const daily100 = week.hundredDaysDaily || Array(7).fill(week.hundredDays.completed);
        daily100.forEach(completed => {
          const cell = ws.getCell(rowIdx, c++);
          cell.value = completed ? '✓' : '';
          cell.alignment = { horizontal: 'center' };
          cell.font = { color: { argb: 'FF059669' } };
        });
      }

      const totalCol = startCol + Math.min(TOTAL_WEEKS, weekHeaders.length) * 11;
      ws.getCell(3, totalCol).value = 'Points';
      ws.getCell(3, totalCol).font = { bold: true };
      ws.getCell(rowIdx, totalCol).value = s.totalPoints;
      ws.getColumn(totalCol).width = 10;
    });

    // Zebra striping
    for (let r = rowsStart; r < rowsStart + perf.length; r++) {
      if ((r - rowsStart) % 2 === 1) {
        for (let c = 1; c <= ws.columnCount; c++) {
          const cell = ws.getCell(r, c);
          if (!cell.fill || (cell.fill as any).fgColor?.argb?.startsWith('FF')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gradebook_${selectedGen === 'all' ? 'All' : selectedGen}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper: Get 7 daily 100DoC for a week
  const get100DaysForWeek = (week: ExtendedWeekRecord): boolean[] => {
    return week.hundredDaysDaily || Array(7).fill(week.hundredDays.completed);
  };

  return (
    <div className="max-w-[95vw] mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Export</h1>
          <p className="text-gray-600 mt-1">Grouped by Generation • Daily 100DoC • Real-time data</p>
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
          {exporting ? 'Exporting...' : 'Export Excel'}
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

        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={selectedGen}
          onChange={(e) => setSelectedGen(e.target.value)}
        >
          {availableGens.map((g) => (
            <option key={g} value={g}>{g === 'all' ? 'All Generations' : g}</option>
          ))}
        </select>
      </div>

      {lastSync && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          Last sync: <strong>{lastSync.toLocaleString()}</strong>
        </div>
      )}

      {/* Live Preview */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No students found.</div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((group) => {
            const isExpanded = expandedGroups.has(group.gen);
            return (
              <div key={group.gen} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.gen)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3 hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-6 w-6 text-white" /> : <ChevronDown className="h-6 w-6 text-white" />}
                  <Users className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">{group.gen}</h2>
                  <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th rowSpan={3} className="px-3 py-2 text-left sticky left-0 bg-gray-50 text-gray-900 font-medium z-20 border-r-2">ID</th>
                          <th rowSpan={3} className="px-3 py-2 text-left sticky left-16 bg-gray-50 text-gray-900 font-medium z-20 border-r-2">Name</th>
                          {weeksFromRoadmap.reduce((acc, week, idx, arr) => {
                            if (idx === 0 || week.subject !== arr[idx - 1].subject) {
                              const subjectWeeks = arr.filter(w => w.subject === week.subject).length;
                              acc.push(
                                <th key={week.subject} colSpan={subjectWeeks * 11} className="px-3 py-2 text-center border-l-2 border-r-2 text-gray-900 font-bold bg-blue-100">
                                  {week.subject}
                                </th>
                              );
                            }
                            return acc;
                          }, [] as JSX.Element[])}
                          <th rowSpan={3} className="px-3 py-2 text-center text-gray-900 font-medium sticky right-0 bg-gray-50 border-l-2 z-20">Points</th>
                        </tr>
                        <tr>
                          {weeksFromRoadmap.slice(0, TOTAL_WEEKS).map((_, i) => (
                            <th key={i} colSpan={11} className="px-3 py-2 text-center border-l text-gray-900 font-medium bg-blue-50">
                              Week {i + 1}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {weeksFromRoadmap.slice(0, TOTAL_WEEKS).map((_, i) => (
                            <React.Fragment key={i}>
                              <th className="px-2 py-1 text-xs font-medium border-l">Att</th>
                              <th className="px-2 py-1 text-xs font-medium">Ex</th>
                              <th className="px-2 py-1 text-xs font-medium">As</th>
                              <th className="px-2 py-1 text-xs font-medium">Pr</th>
                              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, di) => (
                                <th key={di} className="px-1 py-1 text-xs font-medium text-emerald-600 border-l border-emerald-200">{d}</th>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {group.students.map((s, idx) => (
                          <tr key={s.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 sticky left-0 bg-inherit font-medium text-gray-900 z-10 border-r-2">{s.studentId}</td>
                            <td className="px-3 py-2 sticky left-16 bg-inherit font-medium text-gray-900 z-10 border-r-2">{s.studentName}</td>
                            {s.weeks.slice(0, TOTAL_WEEKS).map((w, i) => {
                              const week = w as ExtendedWeekRecord;
                              const daily100 = get100DaysForWeek(week);
                              return (
                                <React.Fragment key={i}>
                                  <td className="px-2 py-2 text-center text-gray-800 border-l">{formatCell(week.attendance)}</td>
                                  <td className="px-2 py-2 text-center text-gray-800">{formatCell(week.classExercise)}</td>
                                  <td className="px-2 py-2 text-center text-gray-800">{formatCell(week.assignment)}</td>
                                  <td className="px-2 py-2 text-center text-gray-800">{formatCell(week.project)}</td>
                                  {daily100.map((completed, di) => (
                                    <td key={di} className="px-1 py-2 text-center text-emerald-600 text-xs border-l border-emerald-100">
                                      {completed ? '✓' : ''}
                                    </td>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                            <td className="px-3 py-2 font-bold text-gray-900 text-center sticky right-0 bg-inherit border-l-2">{s.totalPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PerformanceExportSystem;