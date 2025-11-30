// src/services/materials.ts (MIGRATED TO MONGODB)
export interface Material {
  id: string;
  title: string;
  videoUrl?: string;
  slidesUrl?: string;
  subject: string;
  week: string;
  order?: number;
  createdAt: string;
}

export type NewMaterialData = Omit<Material, 'id' | 'createdAt'>;

export const addMaterial = async (data: NewMaterialData): Promise<void> => {
  try {
    const response = await fetch('/api/materials', {
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
    console.error('Error adding material:', error);
    throw error;
  }
};

export const updateMaterial = async (
  id: string, 
  updates: Partial<NewMaterialData>
): Promise<void> => {
  try {
    const response = await fetch(`/api/materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
};

export const deleteMaterial = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
};

export const getMaterials = async (
  subject?: string,
  week?: string
): Promise<Material[]> => {
  try {
    let url = '/api/materials';
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (week) params.append('week', week);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) throw new Error(result.message);

    return result.materials.map((m: any) => ({
      ...m,
      id: m._id,
      createdAt: new Date(m.createdAt).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
};
