"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { PawSpinner } from "@/components/ui/paw-spinner";
import { PetLoadingScreen } from "@/components/ui/pet-loading-screen";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
  ListSkeleton,
  DetailSkeleton,
} from "@/components/ui/skeleton";

import { PawSymbol } from "@/components/shared/brand-logo";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No results found",
  description = "Try adjusting your search or filters.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-[28px] border border-dashed border-border/80 bg-surface/30 backdrop-blur-xs max-w-lg mx-auto my-4 transition-all duration-300",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary border border-primary/10 shadow-xs">
        {icon || <PawSymbol className="h-8 w-8 text-primary" />}
      </div>
      <h3 className="text-base font-bold text-foreground sm:text-lg">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface LoadingStateProps {
  message?: string;
  title?: string;
  description?: string;
  variant?:
    | "spinner"
    | "paw"
    | "pet"
    | "card"
    | "cards"
    | "provider-cards"
    | "product-cards"
    | "table"
    | "dashboard"
    | "profile"
    | "list"
    | "detail";
  count?: number;
  columns?: 2 | 3 | 4;
  cardType?: "provider" | "product";
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message,
  title,
  description,
  variant = "cards",
  count,
  columns,
  cardType,
  fullScreen,
  className,
}: LoadingStateProps) {
  const displayMsg = message || title || description || "Loading...";

  if (variant === "pet") {
    return (
      <PetLoadingScreen
        fullScreen={fullScreen ?? false}
        message={displayMsg}
        className={className}
      />
    );
  }

  if (
    variant === "cards" ||
    variant === "card" ||
    variant === "provider-cards" ||
    variant === "product-cards"
  ) {
    const determinedType =
      variant === "product-cards"
        ? "product"
        : variant === "provider-cards"
        ? "provider"
        : (cardType ?? "provider");

    return (
      <div className={cn("space-y-4", className)}>
        {message && (
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground px-1 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>{message}</span>
          </div>
        )}
        <CardGridSkeleton
          count={count ?? 6}
          columns={columns}
          type={determinedType}
        />
      </div>
    );
  }

  if (variant === "table") {
    return <TableSkeleton rows={count ?? 5} className={className} />;
  }

  if (variant === "dashboard") {
    return <DashboardSkeleton className={className} />;
  }

  if (variant === "profile") {
    return <ProfileSkeleton className={className} />;
  }

  if (variant === "list") {
    return <ListSkeleton count={count ?? 4} className={className} />;
  }

  if (variant === "detail") {
    return <DetailSkeleton className={className} />;
  }

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center py-16 px-4 gap-3",
          className
        )}
        role="status"
        aria-label={displayMsg}
        aria-busy="true"
      >
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{displayMsg}</p>
      </div>
    );
  }

  // Default "paw" variant
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 gap-4",
        className
      )}
      role="status"
      aria-label={displayMsg}
      aria-busy="true"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
        <PawSpinner size="lg" variant="pulse" label="" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{displayMsg}</p>
        <p className="text-xs text-muted-foreground">Fetching your PawConnect details...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void | Promise<unknown>;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  action,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
      role="alert"
    >
      <div className="mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action ? (
        <div className="mt-4">{action}</div>
      ) : onRetry ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void onRetry()}
          >
            Try Again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
