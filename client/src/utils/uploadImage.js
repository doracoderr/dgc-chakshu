import api from '../api/axios';

const MAX_FILE_SIZE_MB = 5;

export async function uploadImage(file, adminKey) {
  if (!file) throw new Error('No file selected');

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
  }

  if (!adminKey) {
    throw new Error('Admin key is required to upload images');
  }

  // 1. Ask our backend for a short-lived signed upload payload.
  //    The backend holds the Cloudinary API secret, so only requests
  //    carrying a valid admin key can obtain a signature.
  const { data: signatureRes } = await api.get('/upload/signature', {
    headers: { 'x-admin-key': adminKey },
  });
  const { timestamp, signature, apiKey, cloudName, folder } = signatureRes.data;

  // 2. Upload directly to Cloudinary using that signature.
  //    These params MUST exactly match what the backend signed.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || 'Image upload failed');
  }

  const data = await res.json();
  return data.secure_url;
}
