// src/services/sync/announcement-sync.ts
export async function syncAnnouncementToMongoDB(announcement: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync announcement to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing announcement to MongoDB:', error);
    throw error;
  }
}

export async function updateAnnouncementInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update announcement in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating announcement in MongoDB:', error);
    throw error;
  }
}

export async function deleteAnnouncementFromMongoDB(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/announcements/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete announcement from MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting announcement from MongoDB:', error);
    throw error;
  }
}