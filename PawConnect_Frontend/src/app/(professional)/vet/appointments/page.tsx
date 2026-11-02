import type { Metadata } from "next";
import { VetAppointmentsClient } from "./vet-appointments-client";

export const metadata: Metadata = {
  title: "Appointments Schedule - Veterinarian Portal",
  description: "Manage patient examinations, surgery follow-ups, and diagnostics appointments.",
};

export default function VetAppointmentsPage() {
  return <VetAppointmentsClient />;
}
