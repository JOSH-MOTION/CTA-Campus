// src/services/sync/resource-sync.ts
export async function syncResourceToMongoDB(resource: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync resource to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing resource to MongoDB:', error);
    throw error;
  }
}

export async function updateResourceInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update resource in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating resource in MongoDB:', error);
    throw error;
  }
}

export async function deleteResourceFromMongoDB(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/resources/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete resource from MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting resource from MongoDB:', error);
    throw error;
  }
}