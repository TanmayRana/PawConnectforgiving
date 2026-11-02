"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function ProductImageGallery({
  images,
  productName,
  className,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const shouldReduceMotion = useReducedMotion();

  const safeImages = images && images.length > 0 ? images : [FALLBACK_PRODUCT_IMAGE];
  const activeImage = safeImages[selectedIndex] || safeImages[0];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Main Image Frame */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative h-full w-full"
          >
            <Image
              src={activeImage}
              alt={`${productName} view ${selectedIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* In-House Authenticity watermark badge */}
        <div className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm border border-border/60">
          PawConnect In-House Exclusive
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div
          className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img + idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Show image ${idx + 1}`}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-[border-color,opacity,transform,box-shadow] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 scale-102"
                    : "border-border/60 opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
