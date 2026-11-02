import type { Metadata } from "next";
import { CustomerDashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard - PawConnect Pet Parent Portal",
  description: "View upcoming veterinary visits, manage your pets, and explore trusted pet care modules.",
};

export default function CustomerDashboardPage() {
  return <CustomerDashboardClient />;
}
