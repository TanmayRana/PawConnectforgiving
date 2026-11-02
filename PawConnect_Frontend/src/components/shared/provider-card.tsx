"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { SafeImage } from "./safe-image";
import { MapPin, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FALLBACK_PRACTITIONER_IMAGE =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80";

export interface ProviderCardProps {
  id: string;
  name: string;
  title: string;
  specialty?: string;
  location: string;
  rating: number;
  reviewCount: number;
  fee: number;
  feeLabel?: string;
  nextAvailable: string;
  availableToday?: boolean;
  image?: string;
  badges?: string[];
  bio?: string;
  detailsHref?: string;
  onSelect?: () => void;
  className?: string;
}

export function ProviderCard({
  name,
  title,
  specialty,
  location,
  rating,
  reviewCount,
  fee,
  feeLabel = "Consultation",
  nextAvailable,
  availableToday = false,
  image,
  badges = [],
  bio,
  detailsHref,
  onSelect,
  className,
}: ProviderCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const practitionerImage = image || FALLBACK_PRACTITIONER_IMAGE;

  const initials = React.useMemo(() => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "DR"
    );
  }, [name]);

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.012 }}
      transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] border border-border/70 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:will-change-transform",
        className
      )}
    >
      <div className="flex flex-col flex-1">
        {/* Header: Photo + Quick Info */}
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-primary/10 border border-border/60">
            {image ? (
              detailsHref ? (
                <Link href={detailsHref} className="relative block w-full h-full">
                  <SafeImage
                    src={image}
                    fallbackSrc={FALLBACK_PRACTITIONER_IMAGE}
                    alt={name}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                  />
                </Link>
              ) : (
                <SafeImage
                  src={image}
                  fallbackSrc={FALLBACK_PRACTITIONER_IMAGE}
                  alt={name}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                />
              )
            ) : detailsHref ? (
              <Link
                href={detailsHref}
                className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-xl select-none hover:bg-primary/20 transition-colors"
              >
                {initials}
              </Link>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-xl select-none">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {detailsHref ? (
                <Link href={detailsHref} className="hover:underline">
                  <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {name}
                </h3>
              )}
              <CheckCircle2
                className="h-4 w-4 text-emerald-500 shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-label="Verified Specialist"
              />
            </div>

            <p className="text-xs font-semibold text-primary line-clamp-1">
              {title}
            </p>

            {specialty && (
              <p className="text-[11px] text-muted-foreground truncate">
                {specialty}
              </p>
            )}

            <div className="pt-0.5">
              <RatingStars rating={rating} reviewCount={reviewCount} size="sm" />
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {badges.map((b) => {
              const isToday = b.toLowerCase().includes("today");
              return (
                <Badge
                  key={b}
                  variant={isToday ? "success" : "secondary"}
                  size="sm"
                  className={cn(
                    "text-[10px] transition-colors motion-reduce:transition-none",
                    isToday && "relative pl-2.5"
                  )}
                >
                  {isToday && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {b}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Bio / Description */}
        {bio ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground min-h-[2rem]">
            {bio}
          </p>
        ) : (
          <div className="mt-3 min-h-[2rem]" />
        )}

        {/* Location & Availability Details */}
        <div className="mt-4 space-y-1.5 rounded-2xl bg-surface/70 p-3 text-xs dark:bg-muted/40 transition-colors group-hover:bg-primary-soft/20">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Next slot:</span>
            </span>
            <span
              className={cn(
                "font-medium",
                availableToday
                  ? "text-emerald-600 font-semibold dark:text-emerald-400"
                  : "text-foreground"
              )}
            >
              {nextAvailable}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Fee & Booking CTA */}
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{feeLabel}</span>
          <div className="text-xl font-extrabold text-foreground">
            ₹{fee}
          </div>
        </div>

        {onSelect ? (
          <Button
            onClick={onSelect}
            size="sm"
            className="rounded-full shadow-sm px-4 group/btn active:scale-95 transition-transform"
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:rotate-6" />
            Book Slot
          </Button>
        ) : detailsHref ? (
          <Button
            asChild
            size="sm"
            className="rounded-full shadow-sm px-4 group/btn active:scale-95 transition-transform"
          >
            <Link href={detailsHref}>
              <Calendar className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:rotate-6" />
              Book Slot
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full shadow-sm px-4 group/btn active:scale-95 transition-transform"
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:rotate-6" />
            Book Slot
          </Button>
        )}
      </div>
    </motion.div>
  );
}
