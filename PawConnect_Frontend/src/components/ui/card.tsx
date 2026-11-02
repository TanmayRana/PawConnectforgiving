import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card flex flex-col overflow-hidden bg-card text-card-foreground transition-[transform,box-shadow,border-color,background-color] duration-300 hover:will-change-transform motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "rounded-2xl border border-border/80 shadow-xs hover:shadow-card",
        service:
          "radius-service bg-surface p-8 border border-border/60 shadow-xs hover:bg-primary-soft/40 hover:-translate-y-1 hover:shadow-hover hover:border-primary/30",
        product:
          "radius-product bg-surface border border-border/70 overflow-hidden shadow-xs hover:shadow-hover hover:-translate-y-1 hover:border-primary/30",
        dashboard: "radius-dashboard bg-card border border-border/80 shadow-xs",
        interactive:
          "radius-dashboard bg-card border border-border/80 shadow-xs hover:shadow-card hover:border-primary/50 cursor-pointer",
        compact: "radius-compact bg-card border border-border/80 p-4 shadow-2xs",
        elevated: "radius-dashboard bg-card shadow-card hover:shadow-hover border border-border/40",
        stat: "radius-dashboard bg-card border border-border/80 shadow-xs p-6",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-content" className={cn("flex-1", className)} {...props} />
  );
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center pt-4 border-t border-border", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};