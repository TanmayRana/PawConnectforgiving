"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-lg border border-input bg-background shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground transition-colors",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

interface CheckboxFieldProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label: string;
  description?: string;
  error?: boolean | string;
}

function CheckboxField({
  label,
  description,
  error,
  id,
  className,
  ...props
}: CheckboxFieldProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");
  const descriptionId = description ? `${checkboxId}-description` : undefined;
  const errorId = error ? `${checkboxId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const hasError = !!error;

  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <Checkbox
        id={checkboxId}
        aria-describedby={describedBy}
        aria-invalid={hasError}
        {...props}
      />
      <div className="space-y-1 leading-none">
        <label
          htmlFor={checkboxId}
          className={cn(
            "text-sm font-medium select-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            hasError && "text-destructive"
          )}
        >
          {label}
        </label>
        {description && !hasError && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {typeof error === "string" ? error : "Invalid selection"}
          </p>
        )}
      </div>
    </div>
  );
}

export { Checkbox, CheckboxField };