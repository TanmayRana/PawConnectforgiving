import { Badge } from "@/components/ui/badge";
import { Skeleton, CardGridSkeleton } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div
      className="flex flex-col gap-16 py-10 sm:gap-24 sm:py-16 animate-in fade-in duration-200"
      role="status"
      aria-label="Loading pet care services"
      aria-busy="true"
    >
      {/* ─── Page Hero matching services-client.tsx ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="cream" className="text-xs">
            Certified Specialists
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Complete pet care services under one roof
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Tailored medical, grooming, and behavioral care
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every specialist on PawConnect is fully verified, licensed, and dedicated
            to fear-free handling. Discover our three pillars of pet health and wellness below.
          </p>
        </div>

        {/* 3 Pillar Summary Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[32px] border border-border/70 bg-card p-8 flex flex-col justify-between h-72 shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Catalog Services Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <CardGridSkeleton count={3} columns={3} />
      </section>
      <span className="sr-only">Loading services...</span>
    </div>
  );
}
