import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  max?: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  reviewCount,
  size = "md",
  showValue = true,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-semibold",
  };

  if (!rating || rating === 0 || reviewCount === 0) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span className={cn("text-muted-foreground italic", textClasses[size])}>
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center" aria-label={`Rating: ${rating} out of ${max} stars`}>
        {Array.from({ length: max }, (_, index) => {
          const fillLevel = Math.max(0, Math.min(1, rating - index));
          const isFilled = fillLevel >= 0.75;
          const isHalf = fillLevel >= 0.25 && fillLevel < 0.75;

          return (
            <span key={index} className="relative inline-block">
              {isHalf ? (
                <span className="relative inline-block">
                  <Star className={cn(sizeClasses[size], "text-muted-light fill-transparent")} />
                  <span className="absolute inset-0 overflow-hidden w-[50%]">
                    <Star className={cn(sizeClasses[size], "text-amber-400 fill-amber-400")} />
                  </span>
                </span>
              ) : (
                <Star
                  className={cn(
                    sizeClasses[size],
                    isFilled
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-light fill-transparent"
                  )}
                />
              )}
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className={cn("font-medium text-foreground", textClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
