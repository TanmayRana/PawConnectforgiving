import type { StorageProvider, UploadCategory } from "./types";
import { LocalStorageProvider } from "./local-provider";
import { CloudinaryStorageProvider } from "./cloudinary-provider";

export * from "./types";
export * from "./local-provider";
export * from "./cloudinary-provider";

let activeProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (activeProvider) return activeProvider;

  const providerType = (process.env.STORAGE_PROVIDER || "").toLowerCase();
  const hasCloudinaryEnv = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

  if (providerType === "cloudinary" || hasCloudinaryEnv) {
    activeProvider = new CloudinaryStorageProvider();
  } else {
    activeProvider = new LocalStorageProvider();
  }

  return activeProvider;
}

export function isValidCategory(folder: string): folder is UploadCategory {
  const allowed = ["pets", "products", "veterinarians", "providers", "avatars", "general"];
  return allowed.includes(folder);
}
