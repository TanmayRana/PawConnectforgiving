"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── FormSection ─────────────────────────────────────────────────────────────

interface FormSectionProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  className,
  badge,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-surface/30 p-4 sm:p-5 space-y-4 transition-colors",
        className
      )}
    >
      {(title || description || icon || badge) && (
        <div className="space-y-1 pb-1 border-b border-border/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              {icon && <span className="text-primary shrink-0">{icon}</span>}
              {title && <span>{title}</span>}
            </div>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── FormGrid ────────────────────────────────────────────────────────────────

interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, cols = 2, className }: FormGridProps) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return <div className={cn("grid gap-4", colClass, className)}>{children}</div>;
}

// ─── FormFieldWrapper ────────────────────────────────────────────────────────

interface FormFieldWrapperProps {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5 w-full text-left", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-foreground tracking-wide"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground leading-normal">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive font-medium leading-normal animate-in fade-in-50 duration-150" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Focuses and scrolls the first invalid form element into view.
 */
export function scrollFirstInvalidFieldIntoView(container: HTMLElement | null) {
  if (!container) return;
  const invalidElement = container.querySelector<HTMLElement>(
    'input:invalid, select:invalid, textarea:invalid, [aria-invalid="true"]'
  );
  if (invalidElement) {
    invalidElement.scrollIntoView({ behavior: "smooth", block: "center" });
    invalidElement.focus();
  }
}
