import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key');

// Initialize real client if configured, otherwise fallback placeholder client
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export const BUCKET_NAME = 'study_materials';

/**
 * Generates a signed URL for a file in the private study_materials bucket.
 * Expiring in 60 minutes (3600 seconds)
 */
export async function getSignedFileUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!storagePath) return null;
  if (!isSupabaseConfigured) {
    // In mock/demo mode, return a dummy blob or fallback URL
    return storagePath.startsWith('http') ? storagePath : `https://example.com/${storagePath}`;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed URL:', err);
    return null;
  }
}

/**
 * Uploads a file to the private study_materials bucket
 */
export async function uploadFileToStorage(
  file: File,
  folder: 'syllabus' | 'resources'
): Promise<{ storagePath: string; fileName: string; fileSize: number } | null> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `${folder}/${timestamp}_${sanitizedName}`;

  if (!isSupabaseConfigured) {
    // Simulated upload for offline/demo verification
    return {
      storagePath: filePath,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }

  return {
    storagePath: filePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Deletes a file from the private study_materials bucket
 */
export async function deleteFileFromStorage(storagePath: string): Promise<boolean> {
  if (!storagePath || !isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Storage deletion failed:', err);
    return false;
  }
}
