'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  Users,
} from 'lucide-react';
import { fetchAllPerformance, StudentPerformance, WeekRecord } from '@/lib/performance';
import ExcelJS from 'exceljs';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { getAllWeeksInOrder } from '@/services/materials-tracking';

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
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [availableGens, setAvailableGens] = useState<string[]>([]);

  const { roadmapData } = useRoadmap();
  const weeksFromRoadmap = useMemo(() => getAllWeeksInOrder(roadmapData), [roadmapData]);
  // Include all weeks from the roadmap (up to Node and beyond)
  const TOTAL_WEEKS = weeksFromRoadmap.length;

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
        setAvailableGens(['all', ...sortedGroups.map(g => g.gen)]);
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
    const id = setInterval(exportToExcel, 3_600_000);
    return () => clearInterval(id);
  }, [autoSync, data]);

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
    const weeks = weeksFromRoadmap.slice(0, TOTAL_WEEKS);
    const headers: { subject: string; weekLabel: string }[] = weeks.map((w, idx) => ({
      subject: w.subject,
      weekLabel: `Week ${idx + 1} (${w.subject})`,
    }));
    return headers;
  };

  const flattenWeeklyData = (weeks: WeekRecord[]) =>
    weeks.flatMap((w) => [
      formatCell(w.attendance),
      formatCell(w.classExercise),
      formatCell(w.assignment),
      formatCell(w.project),
      formatCell(w.hundredDays),
    ]);

  const exportExcelWorkbook = async (perf: StudentPerformance[]) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Gradebook');

    // Freeze ID/Name/Gen/Active and top header rows
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 3 }];

    // Column widths for first columns
    ws.getColumn(1).width = 14; // Student ID
    ws.getColumn(2).width = 24; // Name
    ws.getColumn(3).width = 10; // Gen
    ws.getColumn(4).width = 6;  // Yes

    // Build dynamic header groups from roadmap
    const weekHeaders = generateWeekHeaders();
    const categories = ['Att', 'Ex', 'As', 'Pr', '100D'];

    const startCol = 5; // weekly data starts after first 4 columns

    // Row 1: Subject groups
    let colCursor = startCol;
    let weekIndex = 0;
    while (weekIndex < Math.min(TOTAL_WEEKS, weekHeaders.length)) {
      const currentSubject = weekHeaders[weekIndex].subject;
      let weeksInSubject = 0;
      while (
        weekIndex + weeksInSubject < weekHeaders.length &&
        weekHeaders[weekIndex + weeksInSubject].subject === currentSubject &&
        weekIndex + weeksInSubject < TOTAL_WEEKS
      ) {
        weeksInSubject++;
      }

      const subjectStart = colCursor;
      const subjectEnd = colCursor + weeksInSubject * categories.length - 1;
      if (subjectStart <= subjectEnd) {
        ws.mergeCells(1, subjectStart, 1, subjectEnd);
        const cell = ws.getCell(1, subjectStart);
        cell.value = currentSubject;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        const fillColor = subjectColors[currentSubject] || 'FF374151';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Color the whole merged range background
        for (let c = subjectStart; c <= subjectEnd; c++) {
          ws.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        }
      }

      colCursor = subjectEnd + 1;
      weekIndex += weeksInSubject;
    }

    // Row 2: Week labels (merged across 5 categories)
    colCursor = startCol;
    for (let i = 0; i < Math.min(TOTAL_WEEKS, weekHeaders.length); i++) {
      const weekStart = colCursor;
      const weekEnd = colCursor + categories.length - 1;
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
      colCursor += categories.length;
    }

    // Row 3: Category headers
    ws.getCell(3, 1).value = 'Student ID';
    ws.getCell(3, 2).value = 'Student Name';
    ws.getCell(3, 3).value = 'Gen';
    ws.getCell(3, 4).value = 'Yes';
    ws.getRow(3).font = { bold: true };
    colCursor = startCol;
    for (let i = 0; i < Math.min(TOTAL_WEEKS, weekHeaders.length); i++) {
      for (const cat of categories) {
        const cell = ws.getCell(3, colCursor);
        cell.value = cat;
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, color: { argb: 'FF111827' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        colCursor++;
      }
    }

    // Data rows
    const rowsStart = 4;
    const weekCellFormatter = (w: WeekRecord) => [
      formatCell(w.attendance),
      formatCell(w.classExercise),
      formatCell(w.assignment),
      formatCell(w.project),
      formatCell(w.hundredDays),
    ];

    perf.forEach((s, idx) => {
      const rowIdx = rowsStart + idx;
      ws.getCell(rowIdx, 1).value = s.studentId;
      ws.getCell(rowIdx, 2).value = s.studentName;
      ws.getCell(rowIdx, 3).value = s.gen;
      ws.getCell(rowIdx, 4).value = 'Yes';

      let c = startCol;
      const weeksToWrite = Math.min(TOTAL_WEEKS, s.weeks.length, weekHeaders.length);
      for (let w = 0; w < weeksToWrite; w++) {
        const values = weekCellFormatter(s.weeks[w]);
        for (const val of values) {
          const cell = ws.getCell(rowIdx, c++);
          cell.value = val;
          cell.alignment = { horizontal: 'center' };
        }
      }
      // Total points at end
      const totalCol = startCol + Math.min(TOTAL_WEEKS, weekHeaders.length) * categories.length;
      ws.getCell(3, totalCol).value = 'Points';
      ws.getCell(3, totalCol).font = { bold: true };
      ws.getCell(rowIdx, totalCol).value = s.totalPoints;
      ws.getColumn(totalCol).width = 10;
    });

    // Alternate row shading for readability
    for (let r = rowsStart; r < rowsStart + perf.length; r++) {
      if ((r - rowsStart) % 2 === 1) {
        for (let c = 1; c <= ws.columnCount; c++) {
          const cell = ws.getCell(r, c);
          cell.fill = cell.fill || { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
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

        <div className="flex items-stretch">
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