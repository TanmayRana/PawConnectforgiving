export type UploadCategory =
  | "pets"
  | "products"
  | "veterinarians"
  | "providers"
  | "avatars"
  | "general";

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  provider: "local" | "cloudinary";
}

export interface StorageProvider {
  upload(file: File, folder: UploadCategory): Promise<UploadResult>;
}

export const ALLOWED_UPLOAD_FOLDERS: readonly UploadCategory[] = [
  "pets",
  "products",
  "veterinarians",
  "providers",
  "avatars",
  "general",
] as const;

export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
] as const;
