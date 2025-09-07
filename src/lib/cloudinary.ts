// src/lib/cloudinary.ts

const CLOUDINARY_CONFIG = {
  cloudName: 'dfff3hdrf',
  uploadPreset: 'foodApp',
  apiKey: '253477856255366',
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Cloudinary upload error:', errorData);
    throw new Error('Failed to upload image to Cloudinary.');
  }

  return response.json();
};
