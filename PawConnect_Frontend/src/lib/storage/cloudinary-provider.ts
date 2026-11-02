import crypto from "node:crypto";
import type { StorageProvider, UploadCategory, UploadResult } from "./types";
import { LocalStorageProvider } from "./local-provider";

export class CloudinaryStorageProvider implements StorageProvider {
  private localFallback = new LocalStorageProvider();

  async upload(file: File, folder: UploadCategory): Promise<UploadResult> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    // Fall back to local if Cloudinary credentials are not provided
    if (!cloudName) {
      console.warn(
        "[Storage] CLOUDINARY_CLOUD_NAME is not set. Falling back to LocalStorageProvider."
      );
      return this.localFallback.upload(file, folder);
    }

    try {
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const cloudinaryFolder = `pawconnect/${folder}`;
      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", cloudinaryFolder);

      if (uploadPreset) {
        // Unsigned preset upload
        formData.append("upload_preset", uploadPreset);
      } else if (apiKey && apiSecret) {
        // Signed upload via HMAC-SHA1
        const timestamp = Math.floor(Date.now() / 1000).toString();
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);

        const paramsToSign = `folder=${cloudinaryFolder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");
        formData.append("signature", signature);
      } else {
        console.warn(
          "[Storage] Neither CLOUDINARY_UPLOAD_PRESET nor (CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET) is set. Falling back to local storage."
        );
        return this.localFallback.upload(file, folder);
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Storage] Cloudinary upload returned error:", errorText);
        throw new Error(`Cloudinary upload failed with status ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const secureUrl = data.secure_url || data.url;

      return {
        success: true,
        url: secureUrl,
        filename: data.original_filename || file.name,
        size: data.bytes || file.size,
        mimeType: data.format ? `image/${data.format}` : file.type,
        provider: "cloudinary",
      };
    } catch (err) {
      console.error("[Storage] Cloudinary error, falling back to local storage:", err);
      return this.localFallback.upload(file, folder);
    }
  }
}
