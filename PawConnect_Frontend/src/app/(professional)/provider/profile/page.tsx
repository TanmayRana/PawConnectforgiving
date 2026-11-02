import type { Metadata } from "next";
import { ProviderProfileClient } from "./provider-profile-client";

export const metadata: Metadata = {
  title: "Provider Profile - Service Provider Portal",
  description: "View and update your grooming and training business profile, specialties, and credentials.",
};

export default function ProviderProfilePage() {
  return <ProviderProfileClient />;
}
