// src/services/sync/notification-sync.ts
export async function syncNotificationToMongoDB(notification: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync notification to MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing notification to MongoDB:', error);
    throw error;
  }
}

export async function updateNotificationInMongoDB(id: string, updates: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update notification in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating notification in MongoDB:', error);
    throw error;
  }
}

export async function markAllNotificationsReadInMongoDB(userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notifications as read in MongoDB');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking notifications as read in MongoDB:', error);
    throw error;
  }
}