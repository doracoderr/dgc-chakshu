const MAX_FILE_SIZE_MB = 5;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file) {
  if (!file) throw new Error('No file selected');

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
  }

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Image upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'dgc-chakshu');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
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
