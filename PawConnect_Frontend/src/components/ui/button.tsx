"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { PawSpinner } from "./paw-spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted border border-border shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0",
        outline: "border-2 border-primary text-primary hover:bg-primary-soft/60 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "text-foreground hover:bg-muted/80 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0",
        cream: "bg-cream text-cream-foreground border border-cream-border hover:brightness-95 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0",
        blue: "bg-blue-soft text-blue-foreground border border-blue-border hover:brightness-95 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0",
        // shadcn compat aliases
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs gap-1.5",
        md: "h-11 px-4 text-sm gap-2",
        lg: "h-13 px-6 text-base gap-2.5",
        xl: "h-15 px-8 text-lg gap-3",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-13 w-13",
        // shadcn compat
        default: "h-11 px-4 text-sm gap-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  pawLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, loading, pawLoading, disabled, asChild = false, children, ...props },
    ref
  ) {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLButtonElement>}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading || pawLoading}
        aria-busy={loading || pawLoading ? "true" : undefined}
        ref={ref}
        {...props}
      >
        {pawLoading ? (
          <PawSpinner size="sm" className="shrink-0" />
        ) : loading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };