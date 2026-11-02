import type { Metadata } from "next";
import { VetDashboardClient } from "./vet-dashboard-client";

export const metadata: Metadata = {
  title: "Veterinarian Dashboard - PawConnect Care Operations",
  description: "Review today's appointments, clinical schedules, and patient records.",
};

export default function VetDashboardPage() {
  return <VetDashboardClient />;
}
