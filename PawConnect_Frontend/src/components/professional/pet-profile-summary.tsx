import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, ShieldCheck, HeartPulse, Weight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetProfileSummaryProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    gender: "Male" | "Female";
    weight: number;
    photo: string;
    color?: string;
    microchipId?: string;
    vaccinations?: { name: string; date: string; nextDue: string }[];
    medicalHistory?: { date: string; type: string; description: string }[];
  };
  className?: string;
}

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

export function PetProfileSummary({ pet, className }: PetProfileSummaryProps) {
  return (
    <Card className={cn("p-5 sm:p-6 rounded-2xl border-border/80 shadow-xs space-y-5", className)}>
      {/* Primary header */}
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border/60">
          <Image
            src={pet.photo || FALLBACK_PET_IMAGE}
            alt={pet.name || "Pet"}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover"
          />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-foreground truncate">{pet.name}</h3>
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
              {pet.species}
            </Badge>
            <Badge variant="outline" className="text-xs font-medium">
              {pet.gender}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground font-medium truncate">
            {pet.breed}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {pet.age} {pet.age === 1 ? "year" : "years"} old
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Weight className="h-3.5 w-3.5 text-primary" />
              {pet.weight} kg
            </span>
            {pet.color && (
              <>
                <span>•</span>
                <span>Color: {pet.color}</span>
              </>
            )}
          </div>

          {pet.microchipId && (
            <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
              Microchip: {pet.microchipId}
            </p>
          )}
        </div>
      </div>

      {/* Vaccinations overview if available */}
      {pet.vaccinations && pet.vaccinations.length > 0 && (
        <div className="pt-3 border-t border-border/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Immunization Record</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pet.vaccinations.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-surface/60 px-3 py-1.5 text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-foreground">{v.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  Due: {v.nextDue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical history highlights if available */}
      {pet.medicalHistory && pet.medicalHistory.length > 0 && (
        <div className="pt-3 border-t border-border/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <HeartPulse className="h-3.5 w-3.5 text-primary" />
            <span>Clinical History</span>
          </div>
          <div className="space-y-1.5">
            {pet.medicalHistory.map((m, i) => (
              <div
                key={i}
                className="text-xs rounded-xl bg-surface/50 p-2.5 border border-border/50 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"
              >
                <span className="font-medium text-foreground">{m.description}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{m.date} ({m.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
