// Generates a 24-character hex string, valid as a MongoDB ObjectId.
// Used so the client can decide an entity's _id *before* saving it,
// which lets us upload its photo to a stable, matching Cloudinary
// folder up front (no orphan folders left behind on re-upload).
export function generateId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
