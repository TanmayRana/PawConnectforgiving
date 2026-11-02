"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { PawPrint } from "lucide-react";

export interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc,
  fallbackIcon,
  className,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-surface text-muted-foreground",
          className
        )}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || <PawPrint className="h-8 w-8 text-muted-foreground/40" />}
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
