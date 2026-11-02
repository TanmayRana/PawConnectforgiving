import type { Metadata } from "next";
import { ProviderAvailabilityClient } from "./provider-availability-client";

export const metadata: Metadata = {
  title: "Service Availability & Working Hours - Service Provider Portal",
  description: "Configure grooming and training operational hours and appointment booking slots.",
};

export default function ProviderAvailabilityPage() {
  return <ProviderAvailabilityClient />;
}
