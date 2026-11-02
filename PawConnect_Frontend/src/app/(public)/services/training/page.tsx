import type { Metadata } from "next";
import { TrainingClient } from "./training-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dog Training & Behavior Specialists - PawConnect",
  description:
    "Explore positive reinforcement puppy training, behavioral consultation, and agility coaching from certified CPDT-KA trainers.",
};

export default function TrainingPage() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="secondary" className="text-xs">
            Positive Dog Training
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Certified Canine Coaching
          </h1>
          <p className="font-decorative text-2xl font-bold text-sky-600 sm:text-3xl">
            Humane, science-backed learning that works
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From basic puppy socialization to complex reactivity rehabilitation,
            our certified trainers build lasting harmony between you and your pet.
          </p>
        </div>

        {/* Interactive Client Discovery */}
        <TrainingClient />
      </div>
    </div>
  );
}
