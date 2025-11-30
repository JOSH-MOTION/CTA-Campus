// src/services/points.ts (MIGRATED TO MONGODB)
// Most points functionality is now in the User model's totalPoints
// This service provides read-only access

export interface PointEntry {
  id: string;
  points: number;
  reason: string;
  activityId: string;
  awardedAt: string;
}

/**
 * Retrieves the total points for a single user
 */
export const getPointsForStudent = async (userId: string): Promise<number> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const result = await response.json();

    if (!result.success) {
      return 0;
    }

    return result.user.totalPoints || 0;
  } catch (error) {
    console.error('Error fetching points for student:', error);
    return 0;
  }
};

/**
 * Get detailed point history for a student
 */
export const getPointHistory = async (userId: string): Promise<PointEntry[]> => {
  try {
    const response = await fetch(`/api/points?userId=${userId}`);
    const result = await response.json();

    if (!result.success) {
      return [];
    }

    return result.points.map((p: any) => ({
      id: p._id || p.id,
      points: p.points,
      reason: p.reason,
      activityId: p.activityId,
      awardedAt: new Date(p.awardedAt).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching point history:', error);
    return [];
  }
};

/**
 * Award points to a student (goes through API)
 */
export const awardPoints = async (
  userId: string,
  points: number,
  reason: string,
  activityId: string,
  awardedBy: string,
  assignmentTitle?: string,
  idToken?: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        points,
        reason,
        activityId,
        awardedBy,
        assignmentTitle,
        action: 'award',
        idToken,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
};

/**
 * Revoke points from a student
 */
export const revokePoints = async (
  userId: string,
  activityId: string,
  idToken?: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        points: 0, // Will be determined from existing record
        reason: '', // Will be determined from existing record
        activityId,
        awardedBy: '',
        action: 'revoke',
        idToken,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error revoking points:', error);
    return false;
  }
};