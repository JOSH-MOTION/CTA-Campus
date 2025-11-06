// src/lib/performance.ts
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface WeekRecord {
  attendance: { completed: boolean; points: number };
  classExercise: { completed: boolean; points: number };
  assignment: { completed: boolean; points: number };
  project: { completed: boolean; points: number };
  hundredDays: { completed: boolean; points: number }; // NEW
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  gen: string;
  weeks: WeekRecord[];
  totalPoints: number;
}

/* ------------------------------------------------------------------
   CONFIG
   ------------------------------------------------------------------ */
// NOTE: Total weeks will be derived from the provided roadmap ordering
// Helper function (keep existing)
function getWeekFromStart(date: Date, start: Date, totalWeeks: number): number {
  const millisecondsSinceStart = date.getTime() - start.getTime();
  const weekIndex = Math.floor(millisecondsSinceStart / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(weekIndex, totalWeeks));
}


/**
 * Build student performance aligned to a provided roadmap ordering.
 * weeksOrdered must be in the exact order you want columns rendered.
 */
// PART 1: Fix for src/lib/performance.ts
// Replace the entire fetchAllPerformance function with this updated version:

export async function fetchAllPerformance(
  weeksOrdered: Array<{ subject: string; week: string }>
): Promise<StudentPerformance[]> {
  const TOTAL_WEEKS = weeksOrdered.length;

  const weekIndexByKey = new Map<string, number>();
  weeksOrdered.forEach((w, idx) => {
    weekIndexByKey.set(`${w.subject}-${w.week}`, idx + 1);
  });

  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'student'))
  );

  const students = usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      id: String(data.id || data.schoolId || doc.id),
      name: data.displayName || data.name || 'Unknown',
      gen: data.gen || 'Unknown',
      totalPoints: data.totalPoints || 0,
    };
  });

  if (students.length === 0) return [];

  // Build uid->gen map
  const uidToGen = new Map<string, string>();
  students.forEach((s) => {
    uidToGen.set(s.uid, s.gen);
  });

  // Attendance tracking
  const attSnap = await getDocs(collection(db, 'attendance'));
  const attendanceEvents: Array<{ uid: string; date: Date; weekIdx?: number }> = [];
  attSnap.forEach((snap) => {
    const d = snap.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    const classId: string | undefined = d.classId;
    const mappedWeek = classId ? weekIndexByKey.get(classId) : undefined;
    if (uid && ts?.toDate) attendanceEvents.push({ uid, date: ts.toDate(), weekIdx: mappedWeek });
  });

  // Submissions tracking
  const subSnap = await getDocs(collection(db, 'submissions'));
  type SubEvent = { 
    uid: string; 
    date: Date; 
    cat: string; 
    assignmentId: string; 
    title: string;
    subject?: string;
    week?: string;
  };
  const submissionEvents: SubEvent[] = [];
  const assignmentIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const projectIds = new Set<string>();

  subSnap.forEach((snap) => {
    const d = snap.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    const cat: string | undefined = d.pointCategory;
    const assignmentId: string | undefined = d.assignmentId;
    const title: string | undefined = d.assignmentTitle;
    
    if (uid && ts?.toDate && cat && assignmentId) {
      submissionEvents.push({ 
        uid, 
        date: ts.toDate(), 
        cat, 
        assignmentId, 
        title: title || '' 
      });
      
      if (cat.includes('Assignment')) assignmentIds.add(assignmentId);
      else if (cat.includes('Exercise')) exerciseIds.add(assignmentId);
      else if (cat.includes('Project')) projectIds.add(assignmentId);
    }
  });

  // Load metadata for assignments, exercises, and projects
  const idToSubjectWeek = new Map<string, { subject?: string; week?: string }>();

  const loadDocsByIds = async (colName: 'assignments' | 'exercises' | 'projects', ids: Set<string>) => {
    const loaders = Array.from(ids).map(async (id) => {
      try {
        const snap = await getDoc(doc(db, colName, id));
        const d: any = snap.data();
        if (d && d.subject && d.week) {
          idToSubjectWeek.set(`${colName}:${id}`, { subject: d.subject, week: d.week });
        }
      } catch (err) {
        console.warn(`Could not load ${colName} document ${id}:`, err);
      }
    });
    await Promise.all(loaders);
  };

  await Promise.all([
    loadDocsByIds('assignments', assignmentIds),
    loadDocsByIds('exercises', exerciseIds),
    loadDocsByIds('projects', projectIds),
  ]);

  // Derive cohort start dates
  const earliestByStudent = new Map<string, Date>();
  const earliestByGen = new Map<string, Date>();
  
  const updateEarliest = (uid: string, date: Date) => {
    const curr = earliestByStudent.get(uid);
    if (!curr || date < curr) earliestByStudent.set(uid, date);
    const gen = uidToGen.get(uid);
    if (gen) {
      const currGen = earliestByGen.get(gen);
      if (!currGen || date < currGen) earliestByGen.set(gen, date);
    }
  };
  
  attendanceEvents.forEach((e) => updateEarliest(e.uid, e.date));
  submissionEvents.forEach((e) => updateEarliest(e.uid, e.date));

  // Build attendance map
  const attMap = new Map<string, Set<number>>();
  attendanceEvents.forEach(({ uid, date, weekIdx }) => {
    const gen = uidToGen.get(uid);
    const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
    const w = weekIdx ?? getWeekFromStart(date, start, TOTAL_WEEKS);
    const bounded = Math.max(1, Math.min(w, TOTAL_WEEKS));
    if (!attMap.has(uid)) attMap.set(uid, new Set());
    attMap.get(uid)!.add(bounded);
  });

  // Build submissions map with proper week mapping
  const subMap = new Map<
    string,
    Map<number, { exercise: boolean; assignment: boolean; project: boolean; hundredDays: boolean }>
  >();

  submissionEvents.forEach(({ uid, date, cat, assignmentId, title }) => {
    let w: number | undefined;

    // Determine week index based on category
    if (cat.includes('100 Days of Code')) {
      const gen = uidToGen.get(uid);
      const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
      w = getWeekFromStart(date, start, TOTAL_WEEKS);
    } else {
      // Try to get subject/week from metadata
      let meta: { subject?: string; week?: string } | undefined;
      
      if (cat.includes('Assignment')) {
        meta = idToSubjectWeek.get(`assignments:${assignmentId}`);
      } else if (cat.includes('Exercise')) {
        meta = idToSubjectWeek.get(`exercises:${assignmentId}`);
      } else if (cat.includes('Project')) {
        meta = idToSubjectWeek.get(`projects:${assignmentId}`);
      }

      // If we have subject and week, map to roadmap
      if (meta?.subject && meta.week) {
        const weekKey = `${meta.subject}-${meta.week}`;
        w = weekIndexByKey.get(weekKey);
        
        // Debug log for exercises specifically
        if (cat.includes('Exercise')) {
          console.log(`Exercise mapping: ${assignmentId}`, {
            subject: meta.subject,
            week: meta.week,
            weekKey,
            mappedWeek: w,
            gen: uidToGen.get(uid)
          });
        }
      }

      // Fallback to cohort-relative week if no mapping found
      if (!w) {
        const gen = uidToGen.get(uid);
        const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
        w = getWeekFromStart(date, start, TOTAL_WEEKS);
      }
    }

    const bounded = Math.max(1, Math.min(w!, TOTAL_WEEKS));

    if (!subMap.has(uid)) subMap.set(uid, new Map());
    const weekMap = subMap.get(uid)!;
    if (!weekMap.has(bounded))
      weekMap.set(bounded, { exercise: false, assignment: false, project: false, hundredDays: false });

    const entry = weekMap.get(bounded)!;
    if (cat.includes('Exercise')) entry.exercise = true;
    else if (cat.includes('Assignment')) entry.assignment = true;
    else if (cat.includes('Project')) entry.project = true;
    else if (cat.includes('100 Days of Code')) entry.hundredDays = true;
  });

  // Build final performance data
  return students.map((s) => {
    const weeks: WeekRecord[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const w = i + 1;
      const att = attMap.get(s.uid)?.has(w) ?? false;
      const subs = subMap.get(s.uid)?.get(w) ?? {
        exercise: false,
        assignment: false,
        project: false,
        hundredDays: false,
      };

      return {
        attendance: { completed: att, points: att ? 1 : 0 },
        classExercise: { completed: subs.exercise, points: subs.exercise ? 1 : 0 },
        assignment: { completed: subs.assignment, points: subs.assignment ? 1 : 0 },
        project: { completed: subs.project, points: subs.project ? 1 : 0 },
        hundredDays: { completed: subs.hundredDays, points: subs.hundredDays ? 0.5 : 0 },
      };
    });

    return {
      studentId: s.id,
      studentName: s.name,
      gen: s.gen,
      weeks,
      totalPoints: s.totalPoints,
    };
  });
}

