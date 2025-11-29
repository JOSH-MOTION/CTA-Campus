// src/services/sync/exercise-sync.ts
export async function syncExerciseToMongoDB(exercise: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync exercise to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing exercise to MongoDB:', error);
    throw error;
  }
}

export async function updateExerciseInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/exercises/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update exercise in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating exercise in MongoDB:', error);
    throw error;
  }
}

export async function deleteExerciseFromMongoDB(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/exercises/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete exercise from MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting exercise from MongoDB:', error);
    throw error;
  }
}