import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { StorageProvider, UploadCategory, UploadResult } from "./types";

export class LocalStorageProvider implements StorageProvider {
  async upload(file: File, folder: UploadCategory): Promise<UploadResult> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension
    const originalExt = path.extname(file.name).toLowerCase() || ".jpg";
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
    const ext = allowedExts.includes(originalExt) ? originalExt : ".jpg";

    // Clean base name
    const rawBaseName = path.basename(file.name, originalExt);
    const sanitizedBase = rawBaseName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40) || "upload";

    // Generate unique collision-resistant filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const filename = `${sanitizedBase}-${uniqueSuffix}${ext}`;

    // Target directory: public/uploads/<folder>
    const uploadsBaseDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadsBaseDir, { recursive: true });

    const filePath = path.join(uploadsBaseDir, filename);
    await writeFile(filePath, buffer);

    // Public URL path served natively by Next.js
    const publicUrl = `/uploads/${folder}/${filename}`;

    return {
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mimeType: file.type || "image/jpeg",
      provider: "local",
    };
  }
}
