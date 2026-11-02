import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
}) {
  if (variant === "card") {
    return (
      <div className={cn("space-y-4", className)} {...props}>
        <div className="skeleton-shimmer h-48 w-full rounded-2xl motion-reduce:animate-none" />
        <div className="space-y-3 px-2">
          <div className="skeleton-shimmer h-6 w-3/4 rounded motion-reduce:animate-none" />
          <div className="skeleton-shimmer h-4 w-1/2 rounded motion-reduce:animate-none" />
          <div className="skeleton-shimmer h-4 w-1/3 rounded motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div
        className={cn("skeleton-shimmer rounded-full motion-reduce:animate-none", className)}
        style={{ width, height }}
        {...props}
      />
    );
  }

  if (variant === "rectangular") {
    return (
      <div
        className={cn("skeleton-shimmer rounded-xl motion-reduce:animate-none", className)}
        style={{ width, height }}
        {...props}
      />
    );
  }

  // text variant with multiple lines
  if (lines && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn("skeleton-shimmer h-4 rounded motion-reduce:animate-none", i === lines - 1 && "w-3/4")}
            style={{ width: i === lines - 1 ? width : "100%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("skeleton-shimmer rounded motion-reduce:animate-none", className)}
      style={{ width, height: height || "1rem" }}
      {...props}
    />
  );
}

export function ProviderCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-border/70 bg-white p-6 shadow-xs dark:bg-card transition-shadow",
        className
      )}
      role="status"
      aria-hidden="true"
    >
      <div>
        {/* Header: Photo + Quick Info */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-2xl border border-border/40" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <div className="flex items-center gap-1 pt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3.5 w-3.5 rounded-full shrink-0" />
              ))}
              <Skeleton className="h-3 w-16 rounded-md ml-1.5" />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Bio / Description */}
        <div className="mt-3.5 space-y-1.5">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>

        {/* Location & Availability Details Container */}
        <div className="mt-4 space-y-2 rounded-2xl bg-surface/60 p-3.5 dark:bg-muted/30">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Footer: Fee & Booking CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-border/70 bg-white p-5 shadow-xs dark:bg-card transition-shadow",
        className
      )}
      role="status"
      aria-hidden="true"
    >
      <div>
        {/* Product Image Area */}
        <Skeleton className="mb-4 h-52 w-full rounded-2xl border border-border/40" />

        <div className="space-y-2.5">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-5 w-4/5 rounded-lg" />
          <Skeleton className="h-4 w-3/5 rounded" />

          {/* Rating */}
          <div className="flex items-center gap-1 pt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-3.5 rounded-full shrink-0" />
            ))}
            <Skeleton className="h-3 w-12 rounded-md ml-1" />
          </div>
        </div>
      </div>

      {/* Price & CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function CardSkeleton({
  type = "provider",
  className,
}: {
  type?: "provider" | "product";
  className?: string;
}) {
  if (type === "product") {
    return <ProductCardSkeleton className={className} />;
  }
  return <ProviderCardSkeleton className={className} />;
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  type = "provider",
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  type?: "provider" | "product";
  className?: string;
}) {
  const colClasses: Record<number, string> = {
    2: "grid grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  };

  return (
    <div
      className={cn(colClasses[columns] || colClasses[3], className)}
      role="status"
      aria-label="Loading cards"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} type={type} />
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
        className
      )}
      role="status"
      aria-label="Loading table data"
      aria-busy="true"
    >
      <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-6 py-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4 rounded",
              i === 0 ? "w-32" : i === cols - 1 ? "w-20 ml-auto" : "w-24"
            )}
          />
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={cn(
                  "flex items-center",
                  c === 0 ? "w-32 gap-3" : c === cols - 1 ? "w-20 ml-auto justify-end" : "w-24"
                )}
              >
                {c === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton
                  className={cn(
                    "h-4 rounded",
                    c === 0 ? "w-20" : c === 1 ? "w-28" : c === cols - 1 ? "w-16" : "w-16"
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading records...</span>
    </div>
  );
}

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-8", className)}
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      {/* 4 KPI stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
        ))}
      </div>
      {/* Chart + Recent Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl border border-border/70 bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-4 rounded-3xl border border-border/70 bg-card p-6 space-y-4 shadow-xs">
          <Skeleton className="h-6 w-32 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard metrics...</span>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-6 max-w-4xl mx-auto", className)}
      role="status"
      aria-label="Loading profile"
      aria-busy="true"
    >
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <Skeleton className="h-7 w-48 rounded-lg mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-36 rounded mx-auto sm:mx-0" />
          <div className="flex gap-2 pt-1 justify-center sm:justify-start">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-full shrink-0" />
      </div>
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <Skeleton className="h-6 w-40 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>
      <span className="sr-only">Loading profile information...</span>
    </div>
  );
}

export function ListSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-label="Loading list"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 flex items-center gap-4 shadow-xs"
        >
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full shrink-0 hidden sm:block" />
        </div>
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  );
}

export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-8 max-w-5xl mx-auto", className)}
      role="status"
      aria-label="Loading details"
      aria-busy="true"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5">
          <Skeleton className="aspect-square w-full rounded-3xl" />
        </div>
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/3 rounded" />
          </div>
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/6 rounded" />
          </div>
          <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading detailed view...</span>
    </div>
  );
}

export { Skeleton };