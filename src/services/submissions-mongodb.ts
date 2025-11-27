// src/services/submissions-mongodb.ts
/**
 * Updated submissions service that uses MongoDB via API routes
 * Gradually replace the old Firestore version with these functions
 */

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionLink?: string;
  submissionNotes: string;
  submittedAt: Date;
  pointCategory: string;
  grade?: string;
  feedback?: string;
  imageUrl?: string;
  gradedBy?: string;
  graderName?: string;
  gradedAt?: Date;
}

export interface NewSubmissionData {
  studentId: string;
  studentName: string;
  studentGen: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionLink?: string;
  submissionNotes: string;
  pointCategory: string;
  imageUrl?: string;
}

/**
 * Create a new submission (MongoDB version)
 */
export async function addSubmissionMongo(data: NewSubmissionData): Promise<{ id: string }> {
  try {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to create submission');
    }

    return { id: result.submission._id };
  } catch (error: any) {
    console.error('Error adding submission:', error);
    throw error;
  }
}

/**
 * Fetch all submissions (MongoDB version)
 */
export async function getAllSubmissionsMongo(): Promise<Submission[]> {
  try {
    const response = await fetch('/api/submissions');
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch submissions');
    }

    return result.submissions.map((s: any) => ({
      ...s,
      id: s._id,
      submittedAt: new Date(s.submittedAt),
      gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

/**
 * Fetch submissions for a specific student (MongoDB version)
 */
export async function getSubmissionsForStudentMongo(studentId: string): Promise<Submission[]> {
  try {
    const response = await fetch(`/api/submissions?studentId=${studentId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch submissions');
    }

    return result.submissions.map((s: any) => ({
      ...s,
      id: s._id,
      submittedAt: new Date(s.submittedAt),
      gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching student submissions:', error);
    throw error;
  }
}

/**
 * Fetch submissions for a specific assignment (MongoDB version)
 */
export async function getSubmissionsForAssignmentMongo(assignmentId: string): Promise<Submission[]> {
  try {
    const response = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch submissions');
    }

    return result.submissions.map((s: any) => ({
      ...s,
      id: s._id,
      submittedAt: new Date(s.submittedAt),
      gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error);
    throw error;
  }
}

/**
 * Grade a submission (MongoDB version)
 */
export async function gradeSubmissionMongo(
  submissionId: string,
  gradeData: {
    grade?: string;
    feedback?: string;
    gradedBy: string;
    graderName: string;
    idToken: string;
  }
): Promise<void> {
  try {
    const response = await fetch(`/api/submissions/${submissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gradeData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to grade submission');
    }
  } catch (error: any) {
    console.error('Error grading submission:', error);
    throw error;
  }
}

/**
 * Delete a submission (MongoDB version)
 */
export async function deleteSubmissionMongo(submissionId: string, idToken: string): Promise<void> {
  try {
    const response = await fetch(`/api/submissions/${submissionId}?idToken=${idToken}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete submission');
    }
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    throw error;
  }
}