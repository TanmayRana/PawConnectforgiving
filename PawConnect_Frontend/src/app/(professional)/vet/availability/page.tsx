import type { Metadata } from "next";
import { VetAvailabilityClient } from "./vet-availability-client";

export const metadata: Metadata = {
  title: "Clinical Duty & Availability - Veterinarian Portal",
  description: "Configure working hours, bookable clinical consult slots, and duty days.",
};

export default function VetAvailabilityPage() {
  return <VetAvailabilityClient />;
}
