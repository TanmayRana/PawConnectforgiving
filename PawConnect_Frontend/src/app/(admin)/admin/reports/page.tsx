import type { Metadata } from "next";
import { AdminReportsClient } from "./admin-reports-client";

export const metadata: Metadata = {
  title: "Reports & Safety - Admin Portal",
  description: "Investigate flagged content, service grievances, catalog discrepancies, and safety reports.",
};

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
