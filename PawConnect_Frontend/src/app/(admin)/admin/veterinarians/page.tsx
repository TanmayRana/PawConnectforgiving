import type { Metadata } from "next";
import { AdminVetsClient } from "./admin-vets-client";

export const metadata: Metadata = {
  title: "Veterinarian Verification - Admin Portal",
  description: "Review licensing degrees, board credentials, clinical workplaces, and verification statuses.",
};

export default function AdminVeterinariansPage() {
  return <AdminVetsClient />;
}
