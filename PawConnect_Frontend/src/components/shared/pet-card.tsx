"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Pet } from "@/lib/mock/pets";
import { PawPrint, Calendar, Weight, ArrowRight, MoreVertical, Edit2, Trash2 } from "lucide-react";

interface PetCardProps {
  pet: Pet;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
  className?: string;
}

export function PetCard({ pet, onEdit, onDelete, className }: PetCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-border/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:bg-card ${className || ""}`}
    >
      <div>
        {/* Top Header: Image, Name & Menu */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-surface border border-border/50 shrink-0 flex items-center justify-center">
              {pet.photo || pet.photoUrl ? (
                <Image
                  src={(pet.photo || pet.photoUrl)!}
                  alt={pet.name}
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                  <PawPrint className="h-8 w-8 text-primary/70" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{pet.name}</h3>
                <Badge
                  variant={pet.gender?.toUpperCase() === "MALE" ? "secondary" : "default"}
                  size="sm"
                  className="capitalize text-[10px]"
                >
                  {pet.gender}
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {pet.breed || pet.species}
              </p>
            </div>
          </div>

          {/* Quick Actions Dropdown */}
          {(onEdit || onDelete) && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                aria-label="Pet options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border bg-popover py-1 shadow-lg z-20 text-xs">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(pet);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Edit Details</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(pet);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Pet</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pet Meta Chips */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{pet.age} {pet.age === 1 ? "year old" : "years old"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Weight className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{pet.weight} kg</span>
          </div>
        </div>

        {/* Health Record Summary */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface/70 px-3 py-2 text-[11px] text-muted-foreground">
          <PawPrint className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {pet.vaccinations.length} Vaccines • {pet.medicalRecords.length} Clinical Records
          </span>
        </div>
      </div>

      {/* Card Footer CTA */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Color: <span className="text-foreground font-medium">{pet.color}</span>
        </span>
        <Button asChild size="sm" variant="outline" className="rounded-full text-xs h-8 px-3">
          <Link href={`/app/pets/${pet.id}`} className="flex items-center gap-1">
            <span>Profile</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
