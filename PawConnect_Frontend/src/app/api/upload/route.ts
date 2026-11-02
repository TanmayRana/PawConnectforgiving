import { NextResponse } from "next/server";
import {
  getStorageProvider,
  isValidCategory,
  MAX_UPLOAD_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  type UploadCategory,
} from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawFolder = (formData.get("folder") as string) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was uploaded. Please attach a valid image file." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          error: `Unsupported file type (${file.type || "unknown"}). Allowed formats are JPEG, PNG, WEBP, GIF, SVG, and AVIF.`,
        },
        { status: 400 }
      );
    }

    // Validate File Size
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`,
        },
        { status: 413 }
      );
    }

    // Validate and sanitize folder category
    const folder: UploadCategory = isValidCategory(rawFolder) ? rawFolder : "general";

    // Perform upload through active storage provider
    const provider = getStorageProvider();
    const result = await provider.upload(file, folder);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Upload API] File upload failed:", error);
    const message = error instanceof Error ? error.message : "Internal server error during upload.";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
