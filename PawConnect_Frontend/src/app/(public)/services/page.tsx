import type { Metadata } from "next";
import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Professional Pet Care Services - PawConnect",
  description:
    "Explore our complete range of certified veterinary medicine, stress-free grooming salons, and humane positive dog training programs.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
