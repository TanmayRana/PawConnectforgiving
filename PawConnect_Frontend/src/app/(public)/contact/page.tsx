import type { Metadata } from "next";
import { ContactClient } from "./contact-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Contact PawConnect - Customer & Veterinary Support",
  description:
    "Get in touch with the PawConnect pet care team. We are available 7 days a week to assist with appointments, orders, and clinical questions.",
};

export default function ContactPage() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cream" className="text-xs">
            We&apos;re Here to Help
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Contact PawConnect
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Friendly support for pet parents & specialists
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Have a question, feedback, or need help finding the right veterinary clinic?
            Reach out via the form below or contact our care coordinators directly.
          </p>
        </div>

        {/* Interactive Form & Contact Details */}
        <ContactClient />
      </div>
    </div>
  );
}
