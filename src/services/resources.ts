// src/services/resources.ts (MIGRATED TO MONGODB)
// Note: This service is now redundant as ResourcesContext handles everything
// Keeping it for backward compatibility, but it just wraps the API calls

import { ResourceData } from '@/contexts/ResourcesContext';

export const addResource = async (data: ResourceData): Promise<void> => {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        createdAt: new Date().toISOString(),
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
};

export const updateResource = async (
  id: string, 
  updates: Partial<ResourceData>
): Promise<void> => {
  try {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};