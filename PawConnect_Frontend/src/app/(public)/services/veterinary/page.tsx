import type { Metadata } from "next";
import { VeterinaryClient } from "./veterinary-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Veterinary Doctors & Urgent Care - PawConnect",
  description:
    "Find and book appointments with board-certified veterinary doctors, surgeons, dermatologists, and dentists near you.",
};

export default function VeterinaryPage() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
            Veterinary Medicine
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Certified Veterinary Doctors
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Compassionate diagnostics & surgical excellence
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Browse our network of licensed veterinary practitioners. Filter by specialty,
            inspect credentials, and choose convenient appointment slots.
          </p>
        </div>

        {/* Interactive Client Discovery */}
        <VeterinaryClient />
      </div>
    </div>
  );
}
