import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function ProviderLoading() {
  return (
    <div
      className="space-y-8 pb-16 animate-in fade-in duration-200"
      role="status"
      aria-label="Loading provider dashboard"
      aria-busy="true"
    >
      <PageHeader
        title="Provider Operations"
        description="Service offerings, client bookings, and working schedule."
      />
      <DashboardSkeleton />
    </div>
  );
}
