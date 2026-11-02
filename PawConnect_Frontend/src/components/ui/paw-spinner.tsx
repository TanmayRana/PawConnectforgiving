"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PawSpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "pulse" | "spin" | "bounce";
  label?: string;
}

export function PawSpinner({
  size = "sm",
  variant = "pulse",
  label = "Loading...",
  className,
  ...props
}: PawSpinnerProps) {
  const sizeClasses = {
    xs: "h-3.5 w-3.5 text-[11px]",
    sm: "h-4 w-4 text-xs",
    md: "h-5 w-5 text-sm",
    lg: "h-6 w-6 text-base",
  };

  const animClasses = {
    pulse: "animate-pulse",
    spin: "animate-spin",
    bounce: "animate-bounce",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center select-none shrink-0 motion-reduce:animate-none",
        sizeClasses[size],
        animClasses[variant],
        className
      )}
      role="status"
      aria-label={label}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-full w-full"
        aria-hidden="true"
      >
        {/* Main large pad */}
        <ellipse cx="12" cy="16.5" rx="5.2" ry="4.2" />
        {/* Outer left toe */}
        <ellipse cx="5.2" cy="10.2" rx="2.2" ry="3" transform="rotate(-20 5.2 10.2)" />
        {/* Inner left toe */}
        <ellipse cx="9.5" cy="6.8" rx="2.3" ry="3.2" transform="rotate(-8 9.5 6.8)" />
        {/* Inner right toe */}
        <ellipse cx="14.5" cy="6.8" rx="2.3" ry="3.2" transform="rotate(8 14.5 6.8)" />
        {/* Outer right toe */}
        <ellipse cx="18.8" cy="10.2" rx="2.2" ry="3" transform="rotate(20 18.8 10.2)" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface RefreshIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  isRefreshing: boolean;
  label?: string;
  className?: string;
}

export function RefreshIndicator({
  isRefreshing,
  label = "Updating...",
  className,
  ...props
}: RefreshIndicatorProps) {
  if (!isRefreshing) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 rounded-full shadow-xs animate-in fade-in duration-200",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <PawSpinner size="xs" variant="pulse" label="" />
      <span>{label}</span>
    </div>
  );
}

export function InlinePawLoading({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
      role="status"
      aria-label={label}
    >
      <PawSpinner size="sm" variant="pulse" />
      <span>{label}</span>
    </div>
  );
}
