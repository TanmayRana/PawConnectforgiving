"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
  Crop,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/utils/toast";
import { uploadImageFile } from "@/lib/api/upload";
import { ImageCropperModal } from "./image-cropper-modal";
import type { UploadCategory } from "@/lib/storage/types";

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: UploadCategory;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  aspectRatio?: "square" | "video" | "wide";
  allowUrlToggle?: boolean;
  enableCropping?: boolean;
  className?: string;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  aspectRatio = "video",
  allowUrlToggle = true,
  enableCropping,
  className = "",
  onUploadingChange,
}: ImageUploadProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState(value || "");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry-standard cropping support for avatars / square photos
  const shouldEnableCropping = enableCropping ?? (aspectRatio === "square");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  // Sync internal urlInput state when external value changes
  React.useEffect(() => {
    if (value) {
      setUrlInput(value);
    }
  }, [value]);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate type
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please select an image file (JPEG, PNG, WebP, GIF, SVG, AVIF).",
        });
        return;
      }

      // Validate size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File too large", {
          description: `Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 5MB.`,
        });
        return;
      }

      setIsUploading(true);
      onUploadingChange?.(true);
      setUploadProgress(10);

      try {
        const result = await uploadImageFile(file, folder);
        setUploadProgress(100);
        onChange(result.url);
        setUrlInput(result.url);

        toast.success("Image uploaded", {
          description: `Saved to ${folder} folder (${(file.size / 1024).toFixed(0)} KB).`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload image";
        toast.error("Upload error", { description: msg });
      } finally {
        setIsUploading(false);
        onUploadingChange?.(false);
        setUploadProgress(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [folder, onChange, onUploadingChange]
  );

  const processSelectedFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please select an image file (JPEG, PNG, WebP, GIF, SVG, AVIF).",
        });
        return;
      }

      if (shouldEnableCropping) {
        const reader = new FileReader();
        reader.onload = () => {
          setCropperSrc(reader.result as string);
          setCropperOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        handleFile(file);
      }
    },
    [shouldEnableCropping, handleFile]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleCropComplete = (_blob: Blob, croppedFile: File) => {
    handleFile(croppedFile);
  };

  const handleOpenCropper = (targetUrl?: string) => {
    const src = targetUrl || value;
    if (src) {
      setCropperSrc(src);
      setCropperOpen(true);
    }
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      toast.error("Invalid URL format", {
        description: "Please enter a valid URL starting with https://, http://, or /uploads/.",
      });
      return;
    }
    onChange(trimmed);
    toast.success("Image URL updated");
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyUrl = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.info("Image link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-21/9"
      : "aspect-16/9";

  const isLocalUpload = value?.startsWith("/uploads/");

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Label and Optional Mode Switch */}
      <div className="flex items-center justify-between">
        {label && (
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}

        {allowUrlToggle && (
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5 text-[11px] font-medium text-muted-foreground border border-border/50">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => setMode("file")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none ${
                mode === "file"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              <UploadCloud className="h-3 w-3" />
              Upload File
            </button>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => setMode("url")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none ${
                mode === "url"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              <LinkIcon className="h-3 w-3" />
              Image URL
            </button>
          </div>
        )}
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileInputChange}
      />

      {/* Main Container */}
      {value ? (
        /* Preview Card When Image Exists */
        aspectRatio === "square" ? (
          /* Dedicated Avatar Preview (Square / Round) */
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 1:1 Avatar Frame */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/20 bg-secondary/50 shadow-sm group">
                <Image
                  src={value}
                  alt="Avatar preview"
                  fill
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  sizes="112px"
                />

                {shouldEnableCropping && (
                  <button
                    type="button"
                    onClick={() => handleOpenCropper(value)}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-xs cursor-pointer"
                    title="Click to reposition & crop"
                  >
                    <Crop className="w-4 h-4 text-primary" />
                    <span>Adjust Face</span>
                  </button>
                )}
              </div>

              {/* Info & Action Controls */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-xs font-bold text-foreground">Avatar Ready</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      1:1 Square
                    </span>
                    {isLocalUpload ? (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FolderOpen className="h-3 w-3 text-primary" />
                        Local
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-blue-500" />
                        Cloud
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[280px] mt-0.5 font-mono">
                    {value}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {shouldEnableCropping && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCropper(value)}
                      disabled={disabled || isUploading}
                      className="h-7 px-2.5 text-[11px] rounded-lg gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-semibold"
                    >
                      <Crop className="h-3 w-3" />
                      Adjust & Crop
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="h-7 px-2.5 text-[11px] rounded-lg gap-1 border-border/80"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Change Photo
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyUrl}
                    title="Copy URL"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleClear}
                    disabled={disabled || isUploading}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-0.5" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Landscape Preview Card for banners/products */
          <div className="group relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-[border-color] duration-200 hover:border-primary/50 motion-reduce:transition-none">
            <div className={`relative w-full ${aspectClass} max-h-56 bg-secondary/50 overflow-hidden`}>
              <Image
                src={value}
                alt="Uploaded preview"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-102"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Badge overlay indicating local or remote */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-xs border border-border/50">
                {isLocalUpload ? (
                  <>
                    <FolderOpen className="h-3 w-3 text-primary" />
                    <span>Local Storage ({folder})</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3 w-3 text-blue-500" />
                    <span>External URL</span>
                  </>
                )}
              </div>

              {/* Quick Actions overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleCopyUrl}
                  title="Copy URL"
                  className="h-7 w-7 rounded-full p-0 bg-background/90 backdrop-blur-md hover:bg-background shadow-xs border border-border/50"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-foreground" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={disabled || isUploading}
                  title="Remove Image"
                  className="h-7 w-7 rounded-full p-0 bg-destructive/90 hover:bg-destructive shadow-xs text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Footer Bar with Replace Options */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-muted/30 border-t border-border/50 text-xs">
              <span className="truncate max-w-[240px] text-[11px] text-muted-foreground font-mono">
                {value}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="h-7 px-2.5 text-[11px] rounded-lg gap-1 border-border/80"
                >
                  <RefreshCw className="h-3 w-3" />
                  Change File
                </Button>
              </div>
            </div>
          </div>
        )
      ) : mode === "file" ? (
        /* File Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-[background-color,border-color,transform] duration-200 motion-reduce:transition-none cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : error
              ? "border-destructive/60 bg-destructive/5 hover:border-destructive"
              : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-foreground">
                Uploading to {folder} folder...
              </p>
              {uploadProgress !== null && (
                <div className="w-36 h-1.5 rounded-full bg-muted overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-primary transition-[width] duration-300 rounded-full motion-reduce:transition-none"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Saving locally with unique identifier
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {shouldEnableCropping
                    ? "Upload any photo — interactive face crop modal will open"
                    : "PNG, JPG, WebP, GIF, SVG or AVIF (Max 5MB)"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground mt-1">
                Folder: <span className="font-semibold text-foreground">public/uploads/{folder}</span>
              </span>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Fallback */
        <div className="space-y-2 p-3 rounded-2xl border border-border/80 bg-muted/10">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/... or /uploads/..."
              disabled={disabled || isUploading}
              className="text-xs h-9 rounded-xl flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlApply();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleUrlApply}
              disabled={disabled || !urlInput.trim()}
              className="rounded-xl h-9 px-3.5 text-xs"
            >
              Apply
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Paste any direct image link or local path. Press Apply to save.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive pt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text if no error */}
      {!error && helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}

      {/* Interactive Image Cropper Modal */}
      {shouldEnableCropping && (
        <ImageCropperModal
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={cropperSrc}
          cropShape="round"
          title="Adjust & Crop Profile Avatar"
          description="Drag to center your face inside the circle, and adjust zoom with the slider."
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
