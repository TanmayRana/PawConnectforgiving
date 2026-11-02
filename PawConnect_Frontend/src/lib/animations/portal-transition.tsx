"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface PortalPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared subtle portal page transition (180ms opacity + 6px translateY).
 * Applied exclusively to the <main> content via portal template.tsx files,
 * never affecting persistent sidebars or topbars.
 * Fully disabled under prefers-reduced-motion.
 */
export function PortalPageTransition({
  children,
  className,
}: PortalPageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
