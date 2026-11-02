import type { Metadata } from "next";
import { ProviderServicesClient } from "./provider-services-client";

export const metadata: Metadata = {
  title: "Service Offerings & Packages - Service Provider Portal",
  description: "Configure grooming and behavioral training packages, session durations, and pricing.",
};

export default function ProviderServicesPage() {
  return <ProviderServicesClient />;
}
