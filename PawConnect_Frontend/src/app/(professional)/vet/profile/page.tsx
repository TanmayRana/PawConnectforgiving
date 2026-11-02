import type { Metadata } from "next";
import { VetProfileClient } from "./vet-profile-client";

export const metadata: Metadata = {
  title: "Practitioner Profile - Veterinarian Portal",
  description: "View and update your clinical qualifications, practice location, and credentials.",
};

export default function VetProfilePage() {
  return <VetProfileClient />;
}
