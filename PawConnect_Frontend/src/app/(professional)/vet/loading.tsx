import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function VetLoading() {
  return (
    <div
      className="space-y-8 pb-16 animate-in fade-in duration-200"
      role="status"
      aria-label="Loading veterinary dashboard"
      aria-busy="true"
    >
      <PageHeader
        title="Veterinary Clinical Operations"
        description="Clinical appointments, patient triage, and practitioner duty schedule."
      />
      <DashboardSkeleton />
    </div>
  );
}
