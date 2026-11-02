import type { Metadata } from "next";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Operational Command - PawConnect",
  description: "Centralized executive dashboard for platform users, care operations, and e-commerce fulfillment.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
