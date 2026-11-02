import type { Metadata } from "next";
import { GroomingClient } from "./grooming-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pet Grooming Salons & Mobile Spas - PawConnect",
  description:
    "Book stress-free, certified pet grooming. Full spa haircuts, de-shedding baths, and nail trimming by fear-free professionals.",
};

export default function GroomingPage() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cream" className="text-xs">
            Grooming & Hygiene
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Stress-Free Pet Grooming
          </h1>
          <p className="font-decorative text-2xl font-bold text-amber-600 sm:text-3xl">
            Gentle care, fresh coats, and wagging tails
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From breed-specific scissors work to warm oatmeal de-shedding soaks,
            treat your dog or cat to a luxury pampering session in calm, sanitized environments.
          </p>
        </div>

        {/* Interactive Client Discovery */}
        <GroomingClient />
      </div>
    </div>
  );
}
