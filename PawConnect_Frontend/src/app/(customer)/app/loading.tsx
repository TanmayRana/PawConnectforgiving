import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerAppLoading() {
  return (
    <div
      className="space-y-10 pb-16 animate-in fade-in duration-200"
      role="status"
      aria-label="Loading pet parent dashboard"
      aria-busy="true"
    >
      {/* 1. Header Greeting & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-9 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-7 w-72 sm:w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      {/* 2. 4 Service Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[30px] border border-border/70 bg-card p-6 space-y-4 shadow-xs h-48 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
              </div>
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Two Column Grid: My Pets & Upcoming Bookings */}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-xs"
              >
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-3.5 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/70 bg-card p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/2 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard, please wait...</span>
    </div>
  );
}
