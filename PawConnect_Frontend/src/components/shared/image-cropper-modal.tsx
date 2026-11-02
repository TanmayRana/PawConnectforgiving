"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crop,
  Sparkles,
  Check,
  Undo2,
  Maximize2,
  Move,
} from "lucide-react";

export interface ImageCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  cropShape?: "round" | "rect";
  aspectRatio?: number; // default 1 for square avatar
  title?: string;
  description?: string;
  onCropComplete: (croppedBlob: Blob, croppedFile: File) => void;
}

export function ImageCropperModal({
  open,
  onOpenChange,
  imageSrc,
  cropShape = "round",
  aspectRatio = 1,
  title = "Adjust & Crop Profile Photo",
  description = "Drag to reposition and use the slider to zoom in on your face.",
  onCropComplete,
}: ImageCropperModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3.5);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset in px
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport dimensions
  const CROP_SIZE = 260; // Diameter / width of the crop circle in px

  // Reset and initialize when new imageSrc is opened
  useEffect(() => {
    if (!open || !imageSrc) {
      setImageLoaded(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      return;
    }

    const img = new window.Image();
    // Allow cross-origin image loading for re-cropping external URLs
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const nw = img.naturalWidth || 600;
      const nh = img.naturalHeight || 600;
      setImgNaturalSize({ width: nw, height: nh });

      // Determine initial scale so the image covers the CROP_SIZE
      const scaleW = CROP_SIZE / nw;
      const scaleH = CROP_SIZE / nh;
      const initialCoverScale = Math.max(scaleW, scaleH);

      setMinScale(initialCoverScale * 0.8);
      setMaxScale(initialCoverScale * 4);
      setScale(initialCoverScale);

      // Default smart centering: if it's a portrait image, focus near the top (top 20% for face)
      if (nh > nw) {
        const excessHeight = (nh * initialCoverScale - CROP_SIZE) / 2;
        // Shift up slightly to capture the head/face instead of the torso
        setPosition({ x: 0, y: excessHeight * 0.6 });
      } else {
        setPosition({ x: 0, y: 0 });
      }

      setImageLoaded(true);
    };
    img.onerror = () => {
      // If CORS blocks canvas for external URL, try without crossOrigin
      img.crossOrigin = "";
      img.src = imageSrc;
    };
  }, [open, imageSrc]);

  // Pointer drag events for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(maxScale, Math.max(minScale, prev * zoomFactor)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFocusTop = () => {
    // Snap directly to the top portion of the image (ideal for portraits/headshots)
    if (imgNaturalSize.height > 0) {
      const renderedH = imgNaturalSize.height * scale;
      const excess = (renderedH - CROP_SIZE) / 2;
      setPosition((prev) => ({ x: prev.x, y: excess }));
    }
  };

  const handleCenter = () => {
    setPosition({ x: 0, y: 0 });
  };

  // Generate cropped image using HTML5 Canvas
  const handleConfirmCrop = useCallback(async () => {
    if (!imageRef.current || !imageLoaded) return;
    setIsApplying(true);

    try {
      const OUTPUT_SIZE = 512; // 512x512 high-res avatar
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to initialize canvas context");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Ratio from CROP_SIZE (260px) to OUTPUT_SIZE (512px)
      const outputScaleRatio = OUTPUT_SIZE / CROP_SIZE;

      // Center of canvas
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply user position and scale
      const drawScale = scale * outputScaleRatio;
      const drawX = position.x * outputScaleRatio;
      const drawY = position.y * outputScaleRatio;

      const drawW = imgNaturalSize.width * drawScale;
      const drawH = imgNaturalSize.height * drawScale;

      ctx.drawImage(
        imageRef.current,
        drawX - drawW / 2,
        drawY - drawH / 2,
        drawW,
        drawH
      );

      // Export canvas to WebP/JPEG blob
      canvas.toBlob(
        (blob) => {
          setIsApplying(false);
          if (blob) {
            const fileName = `avatar-${Date.now()}.webp`;
            const file = new File([blob], fileName, { type: "image/webp" });
            onCropComplete(blob, file);
            onOpenChange(false);
          }
        },
        "image/webp",
        0.92
      );
    } catch (err) {
      console.error("Cropping error:", err);
      setIsApplying(false);
    }
  }, [
    imageLoaded,
    position,
    scale,
    rotation,
    imgNaturalSize,
    onCropComplete,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default" className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-5">
          {/* Main Interactive Crop Area */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full h-[320px] bg-slate-950 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center touch-none shadow-inner"
          >
            {/* The Actual Transformed Image */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Source to crop"
                crossOrigin="anonymous"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
                className="absolute transition-transform duration-75 will-change-transform"
              />
            )}

            {/* Dark Mask Vignette with Clear Mask Cutout */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  cropShape === "round"
                    ? "radial-gradient(circle 130px at center, transparent 130px, rgba(15, 23, 42, 0.78) 131px)"
                    : "rgba(15, 23, 42, 0.65)",
              }}
            />

            {/* Crop Boundary Indicator Ring */}
            <div
              style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
              className={`absolute pointer-events-none border-2 border-white/90 shadow-2xl ${
                cropShape === "round" ? "rounded-full" : "rounded-3xl"
              }`}
            >
              {/* Subtle crosshair guides */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/20 border-dashed" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/20 border-dashed" />
            </div>

            {/* Drag hint badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-medium text-slate-200 border border-white/10 pointer-events-none">
              <Move className="w-3 h-3 text-primary" />
              <span>Drag to position face</span>
            </div>
          </div>

          {/* Quick Adjustment Controls */}
          <div className="space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(minScale, s * 0.9))}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={minScale}
                  max={maxScale}
                  step={(maxScale - minScale) / 100}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button
                type="button"
                onClick={() => setScale((s) => Math.min(maxScale, s * 1.1))}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFocusTop}
                  className="h-8 text-xs rounded-xl gap-1.5 border-border/80"
                  title="Align to Face / Top"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Align Face</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8 text-xs rounded-xl gap-1.5 border-border/80"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCenter}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  title="Reset alignment"
                >
                  <Undo2 className="w-3.5 h-3.5 mr-1" />
                  <span>Reset</span>
                </Button>
              </div>

              {/* Live Preview Avatar */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Preview:</span>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                  }}
                  className="relative rounded-full overflow-hidden border-2 border-primary shadow-xs shrink-0 bg-slate-900"
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt="Thumbnail preview"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: `${imgNaturalSize.width * scale * (36 / CROP_SIZE)}px`,
                        height: `${imgNaturalSize.height * scale * (36 / CROP_SIZE)}px`,
                        transform: `translate(-50%, -50%) translate(${
                          position.x * (36 / CROP_SIZE)
                        }px, ${position.y * (36 / CROP_SIZE)}px) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        maxWidth: "none",
                        maxHeight: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex items-center justify-end gap-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs h-9"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="rounded-xl text-xs h-9 gap-1.5 font-bold shadow-xs"
            onClick={handleConfirmCrop}
            disabled={!imageLoaded || isApplying}
          >
            <Check className="w-4 h-4" />
            <span>{isApplying ? "Cropping..." : "Crop & Save Avatar"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
