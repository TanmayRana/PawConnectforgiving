"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import {
  fadeIn,
  staggerContainer,
  staggerItem,
  DURATION,
} from "./index";

interface FadeInViewProps extends Omit<HTMLMotionProps<"div">, "whileInView" | "transition"> {
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
  children: React.ReactNode;
  aboveTheFold?: boolean;
}

/**
 * Accessible viewport reveal component. Server-renders with visible content (initial={false})
 * so HTML is visible without waiting for hydration. Animates only on client after mount for
 * below-the-fold sections, and disables translation under prefers-reduced-motion.
 */
export function FadeInView({
  delay = 0,
  duration = DURATION.medium,
  direction = "up",
  distance = 18,
  className,
  children,
  aboveTheFold = false,
  initial,
  ...props
}: FadeInViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const initialY = shouldReduceMotion ? 0 : direction === "up" ? distance : direction === "down" ? -distance : 0;
  const initialX = shouldReduceMotion ? 0 : direction === "left" ? distance : direction === "right" ? -distance : 0;

  // On server and before client mount, use initial={false} so SSR HTML has no opacity 0
  // For above-the-fold content, maintain initial={false} to avoid flash
  const shouldAnimate = isMounted && !shouldReduceMotion && !aboveTheFold && initial !== false;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: initialY, x: initialX } : false}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerViewProps extends Omit<HTMLMotionProps<"div">, "whileInView" | "variants"> {
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  children: React.ReactNode;
  aboveTheFold?: boolean;
}

/**
 * Container that reveals child items with a pleasant stagger cascade when entering viewport.
 * Server-renders visible content without hiding it until hydration.
 */
export function StaggerView({
  staggerDelay = 0.08,
  delayChildren = 0.05,
  className,
  children,
  aboveTheFold = false,
  initial,
  ...props
}: StaggerViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldAnimate = isMounted && !shouldReduceMotion && !aboveTheFold && initial !== false;

  return (
    <motion.div
      initial={shouldAnimate ? "hidden" : false}
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={shouldReduceMotion ? fadeIn : staggerContainer(staggerDelay, delayChildren)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child item to be placed inside a StaggerView.
 */
export function StaggerItem({
  className,
  children,
  ...props
}: Omit<HTMLMotionProps<"div">, "variants">) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? fadeIn : staggerItem}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface FloatingProps extends Omit<HTMLMotionProps<"div">, "animate" | "transition"> {
  deltaY?: number;
  duration?: number;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Subtle organic floating movement for decorative background elements.
 * Fully ceases animation when prefers-reduced-motion is active.
 */
export function FloatingElement({
  deltaY = 8,
  duration = 4.5,
  delay = 0,
  className,
  children,
  ...props
}: FloatingProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileInView={{
        y: [-deltaY, deltaY, -deltaY],
      }}
      viewport={{ once: false }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

