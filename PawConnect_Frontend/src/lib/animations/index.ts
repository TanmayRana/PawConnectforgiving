import type { Variants, Transition } from "motion/react";

// ─── 1. ANIMATION DURATION TOKENS ─────────────────────────────────────────────
export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  medium: 0.4,
  slow: 0.7,
} as const;

// ─── 2. EASING CURVES & SPRINGS ───────────────────────────────────────────────
export const EASING = {
  easeOut: [0.215, 0.61, 0.355, 1],
  easeInOut: [0.645, 0.045, 0.355, 1],
  gentle: [0.25, 0.1, 0.25, 1],
} as const;

export const SPRINGS = {
  smooth: { type: "spring", stiffness: 380, damping: 30 } as Transition,
  bouncy: { type: "spring", stiffness: 420, damping: 22 } as Transition,
  subtle: { type: "spring", stiffness: 300, damping: 35 } as Transition,
} as const;

// ─── 3. REUSABLE MOTION VARIANTS ──────────────────────────────────────────────

/** Smooth fade-up for section headers, cards, and paragraphs */
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASING.easeOut,
    },
  },
};

/** Simple gentle opacity fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
};

/** Scale + fade for badges, modals, and spotlight cards */
export const fadeScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.medium,
      ease: EASING.easeOut,
    },
  },
};

/** Slide in from side or bottom */
export const slideIn = (direction: "left" | "right" | "bottom" = "bottom"): Variants => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -24 : direction === "right" ? 24 : 0,
    y: direction === "bottom" ? 24 : 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASING.easeOut,
    },
  },
});

/** Container that staggers its child elements automatically */
export const staggerContainer = (staggerDelay = 0.08, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

/** Individual item inside a staggered container */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASING.easeOut,
    },
  },
};

/** Gentle lift & scale hover effect for cards */
export const hoverLift = {
  rest: {
    y: 0,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASING.easeOut },
  },
  hover: {
    y: -6,
    scale: 1.015,
    transition: { duration: DURATION.normal, ease: EASING.easeOut },
  },
};

/** Soft button compression on press */
export const buttonTap = {
  tap: { scale: 0.97 },
};

/** Page enter transition */
export const pageEnter: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeInOut,
    },
  },
};

/** Floating decorative elements animation */
export const floatingMotion = (deltaY = 8, duration = 4): Variants => ({
  animate: {
    y: [-deltaY, deltaY, -deltaY],
    transition: {
      duration,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
});

export { PortalPageTransition } from "./portal-transition";

