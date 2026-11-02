"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { RatingStars } from "./rating-stars";
import { Badge } from "@/components/ui/badge";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/mock/data";

interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}

export function TestimonialCard({ testimonial, className }: TestimonialCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.012 }}
      transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
      className={cn(
        "group relative flex flex-col justify-between rounded-[32px] border border-border/60 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:will-change-transform dark:bg-card",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft/40 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Quote className="h-5 w-5 fill-primary/20" />
          </div>
          <Badge variant="cream" size="sm" className="shadow-2xs">
            {testimonial.serviceType}
          </Badge>
        </div>

        <div className="mb-3">
          <RatingStars rating={testimonial.rating} size="sm" showValue={false} />
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-muted">
          <Image
            src={testimonial.avatar}
            alt={testimonial.author}
            fill
            sizes="44px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {testimonial.author}
          </h4>
          <p className="text-xs text-muted-foreground">
            {testimonial.petName} ({testimonial.petBreed})
          </p>
        </div>
      </div>
    </motion.div>
  );
}
