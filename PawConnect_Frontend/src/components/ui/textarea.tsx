import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  label?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, required, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : generatedId);
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          className={cn(
            "flex min-h-[100px] w-full rounded-2xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y",
            hasError && "border-destructive focus:ring-destructive",
            !hasError && "border-input hover:border-muted-foreground/50",
            className
          )}
          {...props}
        />
        {hint && !hasError && (
          <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="mt-1.5 text-xs text-destructive" role="alert">
            {typeof error === "string" ? error : "Invalid input"}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };