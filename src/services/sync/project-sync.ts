// src/services/sync/project-sync.ts
export async function syncProjectToMongoDB(project: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync project to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing project to MongoDB:', error);
    throw error;
  }
}

export async function updateProjectInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update project in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating project in MongoDB:', error);
    throw error;
  }
}

export async function deleteProjectFromMongoDB(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete project from MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting project from MongoDB:', error);
    throw error;
  }
}
