"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "default" | "light" | "compact" | "icon";
  animate?: boolean;
  href?: string | null;
  className?: string;
}

/**
 * Custom handcrafted vector paw print icon.
 * Clean, rounded, premium geometry designed to remain crisp at all scales.
 */
export function PawSymbol({
  className,
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* 4 Toe Pads */}
      <ellipse cx="6.5" cy="8.2" rx="2.2" ry="3" transform="rotate(-18 6.5 8.2)" />
      <ellipse cx="10.2" cy="5.8" rx="2.2" ry="3.2" transform="rotate(-6 10.2 5.8)" />
      <ellipse cx="14.8" cy="5.8" rx="2.2" ry="3.2" transform="rotate(6 14.8 5.8)" />
      <ellipse cx="18.5" cy="8.2" rx="2.2" ry="3" transform="rotate(18 18.5 8.2)" />
      {/* Central Pad */}
      <path d="M7.8 14.8c-.8 1.6-.2 3.6 1.4 4.5 1.5.9 3.8.4 5.6.4 1.8 0 4.1.5 5.6-.4 1.6-.9 2.2-2.9 1.4-4.5-.9-1.9-2.9-2.8-4.9-2.8-.8 0-1.5.2-2.1.5-.6-.3-1.3-.5-2.1-.5-2 0-4 .9-4.9 2.8z" />
    </svg>
  );
}

export function BrandLogo({
  variant = "default",
  animate = true,
  href = "/",
  className,
}: BrandLogoProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animate && !shouldReduceMotion;

  // Color styles
  const isLight = variant === "light";
  const textColor = isLight ? "text-white" : "text-[#272727] dark:text-[#FBFBFB]";
  const pawColor = isLight ? "text-[#FFDADA]" : "text-[#E78585]";

  // Size styling
  const isCompact = variant === "compact";
  const isIconOnly = variant === "icon";

  const content = (
    <div
      className={cn(
        "inline-flex items-center select-none group",
        isCompact ? "gap-1" : "gap-1.5",
        className
      )}
    >
      {isIconOnly ? (
        <motion.div
          initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
          className={cn(
            "flex items-center justify-center rounded-2xl p-2",
            isLight ? "bg-white/10" : "bg-primary-soft/40"
          )}
        >
          <PawSymbol className="h-6 w-6 text-primary" />
        </motion.div>
      ) : (
        <div className="flex items-center tracking-tight font-extrabold">
          {/* "Paw" prefix */}
          <motion.span
            initial={shouldAnimate ? { opacity: 0, x: -4 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={cn(
              "font-bold tracking-tight",
              textColor,
              isCompact ? "text-lg" : "text-2xl"
            )}
          >
            Paw
          </motion.span>

          {/* Central Animated Paw Print Symbol */}
          <motion.div
            initial={shouldAnimate ? { scale: 0.4, opacity: 0, rotate: -15 } : false}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: 8 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            className={cn(
              "inline-flex items-center justify-center transition-transform",
              isCompact ? "mx-0.5" : "mx-1"
            )}
          >
            <PawSymbol
              className={cn(
                pawColor,
                isCompact ? "h-4.5 w-4.5" : "h-6 w-6"
              )}
            />
          </motion.div>

          {/* "Connect" suffix */}
          <motion.span
            initial={shouldAnimate ? { opacity: 0, x: 4 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className={cn(
              "font-bold tracking-tight",
              textColor,
              isCompact ? "text-lg" : "text-2xl"
            )}
          >
            Connect
          </motion.span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="PawConnect Home"
        className={cn(
          "inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return content;
}
