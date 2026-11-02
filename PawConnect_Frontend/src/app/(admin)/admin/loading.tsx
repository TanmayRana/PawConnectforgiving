import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div
      className="space-y-8 pb-16 animate-in fade-in duration-200"
      role="status"
      aria-label="Loading platform command dashboard"
      aria-busy="true"
    >
      <PageHeader
        title="Platform Command & Operations"
        description="Global oversight across clinical practices, pet wellness providers, catalog fulfillment, and platform governance."
      />
      <DashboardSkeleton />
    </div>
  );
}
