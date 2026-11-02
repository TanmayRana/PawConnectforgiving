import type { Metadata } from "next";
import { AdminProvidersClient } from "./admin-providers-client";

export const metadata: Metadata = {
  title: "Service Providers Verification - Admin Portal",
  description: "Audit grooming salons, behavioral academies, certifications, and service standards.",
};

export default function AdminServiceProvidersPage() {
  return <AdminProvidersClient />;
}
