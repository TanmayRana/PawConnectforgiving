import type { Metadata } from "next";
import { ProviderDashboardClient } from "./provider-dashboard-client";

export const metadata: Metadata = {
  title: "Service Provider Dashboard - PawConnect Care Operations",
  description: "Manage grooming appointments, training sessions, and client booking schedules.",
};

export default function ProviderDashboardPage() {
  return <ProviderDashboardClient />;
}
