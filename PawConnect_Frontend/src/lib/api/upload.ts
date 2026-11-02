import type { UploadCategory, UploadResult } from "@/lib/storage/types";

export interface UploadOptions {
  folder?: UploadCategory;
  onProgress?: (progress: number) => void;
}

/**
 * Uploads an image file to the PawConnect upload API endpoint.
 * Automatically delegates to local storage (in development or default production)
 * or Cloudinary (if configured).
 */
export async function uploadImageFile(
  file: File,
  folder: UploadCategory = "general"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `Upload failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) {
        errorMessage = data.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  const result: UploadResult = await res.json();
  return result;
}
