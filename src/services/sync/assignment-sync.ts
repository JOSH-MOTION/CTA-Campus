// src/services/sync/assignment-sync.ts
export async function syncAssignmentToMongoDB(assignment: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync assignment to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing assignment to MongoDB:', error);
    throw error;
  }
}

export async function updateAssignmentInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update assignment in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating assignment in MongoDB:', error);
    throw error;
  }
}

export async function deleteAssignmentFromMongoDB(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/assignments/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete assignment from MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting assignment from MongoDB:', error);
    throw error;
  }
}