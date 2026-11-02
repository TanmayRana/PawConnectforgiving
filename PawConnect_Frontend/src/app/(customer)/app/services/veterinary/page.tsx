import type { Metadata } from "next";
import { VeterinaryClient } from "./veterinary-client";

export const metadata: Metadata = {
  title: "Veterinary Services | PawConnect",
  description: "Browse licensed veterinarians, clinics, and book medical appointments for your pet.",
};

export default function CustomerVeterinaryPage() {
  return <VeterinaryClient />;
}
