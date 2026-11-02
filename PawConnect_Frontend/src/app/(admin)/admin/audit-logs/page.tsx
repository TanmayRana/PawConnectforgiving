import type { Metadata } from "next";
import { AdminAuditLogsClient } from "./admin-audit-logs-client";

export const metadata: Metadata = {
  title: "Audit Logs - Admin Portal",
  description: "Immutable compliance log tracking administrative updates, verification decisions, and catalog edits.",
};

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsClient />;
}
