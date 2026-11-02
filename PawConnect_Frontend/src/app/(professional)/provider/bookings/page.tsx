import type { Metadata } from "next";
import { ProviderBookingsClient } from "./provider-bookings-client";

export const metadata: Metadata = {
  title: "Client Bookings - Service Provider Portal",
  description: "Manage grooming appointments, behavioral training programs, and client sessions.",
};

export default function ProviderBookingsPage() {
  return <ProviderBookingsClient />;
}
