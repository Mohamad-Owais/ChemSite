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

/** Max upload size in bytes (50 MB) */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/**
 * Generates a signed URL for a file in the private study_materials bucket.
 * Expiring in 60 minutes (3600 seconds) by default.
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

export interface UploadResult {
  storagePath: string;
  fileName: string;
  fileSize: number;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
}

/**
 * Validates a file before upload. Throws a descriptive error if invalid.
 */
export function validateUploadFile(file: File, folder: 'syllabus' | 'resources'): void {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    if (folder === 'resources' && file.type === 'application/pdf') return;
    if (folder === 'resources') {
      // also allow PDFs for resources (keep strict PDF-only for syllabus)
    }
    throw new Error('Only PDF files are supported. Please select a valid PDF document.');
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File too large (${mbSize} MB). Maximum allowed size is 50 MB.`);
  }
  if (file.size === 0) {
    throw new Error('The selected file appears to be empty. Please choose a valid PDF.');
  }
}

/**
 * Uploads a file to the private study_materials bucket with progress reporting.
 * Uses XMLHttpRequest under the hood when Supabase is configured, for real progress.
 * Falls back to the standard Supabase SDK when no progress callback is needed.
 */
export async function uploadFileToStorage(
  file: File,
  folder: 'syllabus' | 'resources',
  options?: UploadOptions
): Promise<UploadResult | null> {
  validateUploadFile(file, folder);

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const filePath = `${folder}/${timestamp}_${sanitizedName}`;

  if (!isSupabaseConfigured) {
    // Simulate progress for offline demo mode
    if (options?.onProgress) {
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 80));
        options.onProgress(p);
      }
    }
    return { storagePath: filePath, fileName: file.name, fileSize: file.size };
  }

  // Get a signed upload URL for progress tracking via XHR
  if (options?.onProgress) {
    return uploadWithProgress(file, filePath, options.onProgress);
  }

  // Standard SDK upload (no progress needed)
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

  return { storagePath: filePath, fileName: file.name, fileSize: file.size };
}

/**
 * Uploads a file using XMLHttpRequest to get real upload progress events.
 */
async function uploadWithProgress(
  file: File,
  filePath: string,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  // Use the Supabase storage upload endpoint directly via XHR
  // Obtain access token from the current Supabase session
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token || supabaseAnonKey}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Cache-Control', '3600');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve({ storagePath: filePath, fileName: file.name, fileSize: file.size });
      } else {
        let msg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp.error || resp.message) msg = resp.error || resp.message;
        } catch {
          /* ignore parse error */
        }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

    // Send as multipart form
    const formData = new FormData();
    formData.append('', file, file.name);
    xhr.send(formData);
  });
}

/**
 * Deletes a file from the private study_materials bucket.
 * Returns true on success or if not configured (offline mode).
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
