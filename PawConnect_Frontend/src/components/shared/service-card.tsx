"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceItem } from "@/lib/mock/data";

interface ServiceCardProps {
  service: ServiceItem;
  variant?: "default" | "compact" | "highlight";
  href?: string;
  onBook?: (service: ServiceItem) => void;
  className?: string;
}

export function ServiceCard({
  service,
  variant = "default",
  href,
  onBook,
  className,
}: ServiceCardProps) {
  const targetHref = href || `/services/${service.category}`;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.012 }}
      transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-border/60 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:will-change-transform dark:bg-card",
        variant === "highlight" && "border-primary/30 bg-primary-soft/20",
        className
      )}
    >
      <div>
        {/* Image & Badges */}
        <div className="relative mb-5 h-48 w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src={service.image}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant="cream" className="capitalize shadow-xs backdrop-blur-xs">
              {service.category}
            </Badge>
            {service.badge && (
              <Badge variant="default" className="bg-primary text-primary-foreground shadow-xs">
                {service.badge}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-xs backdrop-blur-sm">
            <span className="flex items-center gap-1 text-foreground">
              <Clock className="h-3 w-3 text-primary" />
              {service.durationMinutes} mins
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {service.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {service.description}
          </p>
        </div>

        {/* Feature bullets */}
        {service.features && service.features.length > 0 && (
          <ul className="my-5 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            {service.features.slice(0, 3).map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span className="truncate">{feat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer / Pricing & Action */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div>
          <span className="text-xs text-muted-foreground">Starts at</span>
          <div className="text-2xl font-bold text-foreground">
            ₹{service.price}
          </div>
        </div>

        {onBook ? (
          <Button
            size="sm"
            onClick={() => onBook(service)}
            className="rounded-full shadow-sm active:scale-95 transition-transform"
          >
            Book Slot
          </Button>
        ) : (
          <Button asChild size="sm" className="rounded-full shadow-sm group/btn">
            <Link href={targetHref} className="flex items-center gap-1.5">
              <span>Explore</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
