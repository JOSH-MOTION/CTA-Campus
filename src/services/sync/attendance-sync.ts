// src/services/sync/attendance-sync.ts
export async function syncAttendanceToMongoDB(attendance: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendance),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync attendance to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing attendance to MongoDB:', error);
    throw error;
  }
}
