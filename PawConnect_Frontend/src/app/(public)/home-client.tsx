"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestimonialCard } from "@/components/shared/testimonial-card";
import { ProviderCard } from "@/components/shared/provider-card";
import { ProductCard } from "@/components/shared/product-card";
import { SafeImage } from "@/components/shared/safe-image";
import { PawSymbol } from "@/components/shared/brand-logo";
import {
  FadeInView,
  StaggerView,
  StaggerItem,
  FloatingElement,
} from "@/lib/animations/motion-components";
import {
  Stethoscope,
  Scissors,
  Award,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Clock,
  Sparkles,
  CheckCircle2,
  PackageCheck,
  FileText,
  ChevronDown,
  MessageSquareHeart,
} from "lucide-react";
import {
  usePublicReviews,
  usePublicVeterinarians,
  usePublicServiceProviders,
  useProducts,
  type BackendPublicVeterinarian,
  type BackendPublicServiceProvider,
  type EnrichedProductItem,
  type ProductItem,
} from "@/lib/api/hooks";

interface HomeClientProps {
  initialVets?: BackendPublicVeterinarian[];
  initialProviders?: BackendPublicServiceProvider[];
  initialProducts?: EnrichedProductItem[];
}

export function HomeClient({
  initialVets,
  initialProviders,
  initialProducts,
}: HomeClientProps = {}) {
  const shouldReduceMotion = useReducedMotion();
  const { data: realReviews = [] } = usePublicReviews();
  const { data: backendVets = initialVets || [] } = usePublicVeterinarians();
  const { data: backendProviders = initialProviders || [] } = usePublicServiceProviders();
  const { data: backendProducts = initialProducts || [] } = useProducts();

  const [activeFaq, setActiveFaq] = React.useState<number | null>(0);
  const [selectedPetCategory, setSelectedPetCategory] = React.useState<string>("all");

  return (
    <div className="flex flex-col gap-10 pb-12 sm:gap-12 sm:pb-14 lg:gap-14 lg:pb-16 overflow-x-hidden">
      {/* ─── 1. HERO SECTION (MODERN, WARM & ENGAGING) ─────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-rose-50/25 to-background dark:from-stone-900/60 dark:via-background dark:to-background pt-6 sm:pt-10 pb-8 sm:pb-10 lg:pb-12 border-b border-border/40">
        {/* Subtle Decorative Ambient Glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 select-none" aria-hidden="true">
          <div
            className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-12 right-[-5%] h-[32rem] w-[32rem] rounded-full opacity-35 blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--cream) 0%, transparent 70%)",
            }}
          />
          <FloatingElement
            deltaY={6}
            duration={5}
            delay={0.5}
            className="absolute top-1/4 left-[5%] hidden lg:block opacity-25 text-primary"
          >
            <PawSymbol className="h-10 w-10 rotate-[-15deg]" />
          </FloatingElement>
          <FloatingElement
            deltaY={8}
            duration={5.5}
            delay={1.2}
            className="absolute bottom-16 right-[8%] hidden lg:block opacity-25 text-primary"
          >
            <PawSymbol className="h-12 w-12 rotate-[20deg]" />
          </FloatingElement>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Heading, Value Proposition & Actions */}
            <div className="space-y-4 sm:space-y-5 text-center lg:col-span-7 lg:text-left">
              {/* Trust Badge */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-background/90 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>India&apos;s Trusted Pet-Care &amp; In-House Supply Network</span>
              </motion.div>

              {/* Headings */}
              <div className="space-y-3">
                <motion.h1
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.18 }}
                  className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-6xl sm:leading-[1.12]"
                >
                  Compassionate, certified care for your best friend.
                </motion.h1>

                <motion.p
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.26 }}
                  className="font-decorative text-3xl font-bold text-primary sm:text-5xl"
                >
                  Everything your pet needs, all in one place
                </motion.p>
              </div>

              {/* Value Proposition */}
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.34 }}
                className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
              >
                Connect with verified veterinarians, book stress-free grooming and positive trainers,
                and shop guaranteed genuine pet nutrition and essentials with transparent Indian Rupee (₹) pricing.
              </motion.p>

              {/* Interactive Quick Category Selector */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.38 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1"
              >
                {[
                  { id: "all", label: "🐾 All Services", href: "/services" },
                  { id: "vets", label: "🩺 Veterinarians", href: "/services/veterinary" },
                  { id: "grooming", label: "✂️ Grooming & Spa", href: "/services/grooming" },
                  { id: "training", label: "🎾 Dog Training", href: "/services/training" },
                  { id: "shop", label: "🛍️ In-House Shop", href: "/shop" },
                ].map((chip) => (
                  <Link
                    key={chip.id}
                    href={chip.href}
                    onClick={() => setSelectedPetCategory(chip.id)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                      selectedPetCategory === chip.id
                        ? "bg-primary text-primary-foreground shadow-xs scale-105"
                        : "bg-surface text-muted-foreground border border-primary/30 hover:border-primary hover:bg-primary-soft/25 hover:text-foreground"
                    }`}
                  >
                    {chip.label}
                  </Link>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.44 }}
                className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center lg:justify-start"
              >
                <Button
                  asChild
                  size="lg"
                  className="rounded-full shadow-md px-7 group/btn"
                >
                  <Link href="/services/veterinary" className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>Find a Veterinarian</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-7 shadow-xs border-2 border-primary text-foreground hover:bg-primary-soft/30 hover:border-primary transition-all duration-300"
                >
                  <Link href="/services/grooming" className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary" />
                    <span>Book Grooming Spa</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-7 group/shop"
                >
                  <Link href="/shop" className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary transition-transform duration-200 group-hover/shop:scale-110" />
                    <span>Shop Essentials</span>
                  </Link>
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex flex-nowrap items-center justify-center gap-2.5 sm:gap-4 lg:gap-4 xl:gap-5 pt-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground lg:justify-start whitespace-nowrap overflow-x-auto no-scrollbar"
              >
                <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% Verified Specialists</span>
                </div>
                <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Direct In-House Stock</span>
                </div>
                <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Consultations from ₹500</span>
                </div>
                <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Digital Health Passport</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Hero Visual Showcase with Layered Floating Cards */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.22, ease: [0.215, 0.61, 0.355, 1] }}
              className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none"
            >
              <div className="relative aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/3.2] max-h-[380px] overflow-hidden rounded-[32px] border border-border/80 bg-surface shadow-2xl dark:border-border/40">
                <Image
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1000&q=80"
                  alt="Happy, healthy pet companion receiving loving care"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />

                {/* Floating Interactive Badge 1: Real-time Doctor Availability */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, duration: 0.4 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                  className="absolute bottom-5 left-5 rounded-2xl bg-background/95 p-3.5 shadow-lg backdrop-blur-md border border-border/70 transition-shadow cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">Doctor Availability</p>
                      <p className="text-sm font-bold text-foreground">Real-Time Booking</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Interactive Badge 2: Certified Fear-Free */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56, duration: 0.4 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                  className="absolute right-5 top-5 rounded-2xl bg-background/95 p-3.5 shadow-lg backdrop-blur-md border border-border/70 transition-shadow cursor-default"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">100% Fear-Free</p>
                      <p className="text-[10px] text-muted-foreground">Certified Protocol</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Pill: Pricing Transparency */}
                <div className="absolute top-5 left-5 rounded-full bg-primary/95 text-primary-foreground px-3.5 py-1 text-[11px] font-bold shadow-md backdrop-blur-sm">
                  Consultations from ₹500
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. PRIMARY CARE MODULES (ATTRACTIVE VISUAL SERVICE CARDS) ───────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="text-center space-y-2 mb-8 sm:mb-10">
          <Badge variant="primary" className="text-xs px-3 py-1">Care Modules</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            What does your companion need today?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Select a specialized care discipline or shop directly from our verified in-house temperature-controlled inventory.
          </p>
        </FadeInView>

        <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {/* Card 1: Veterinary Medicine */}
          <StaggerItem>
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
              <div className="relative h-48 w-full overflow-hidden bg-surface shrink-0">
                <SafeImage
                  src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80"
                  fallbackSrc="https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80"
                  alt="Veterinary examination with stethoscope"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" size="sm" className="bg-background/90 backdrop-blur-sm font-semibold shadow-xs">
                    Clinical Care
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1.5 text-white backdrop-blur-md border border-white/10 shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 block leading-none">From</span>
                  <p className="text-base font-bold leading-tight">₹500</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <Stethoscope className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      Veterinary Medicine
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground min-h-[2.5rem] line-clamp-2">
                    Physical health checkups, booster vaccines, digital pet passport records, and rapid diagnostics.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-border/60">
                  <Button
                    asChild
                    size="sm"
                    className="relative w-full overflow-hidden rounded-full font-semibold shadow-xs hover:shadow-lg hover:shadow-rose-300/40 dark:hover:shadow-rose-950/40 hover:ring-2 hover:ring-primary-soft/60 transition-all duration-300 group/btn bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
                  >
                    <Link
                      href="/services/veterinary"
                      className="relative flex items-center justify-center gap-2 overflow-hidden py-2"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-300/0 via-pink-200/25 to-pink-300/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-pink-200/80 via-[#FFDADA]/90 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 text-white font-semibold">Find a Clinic</span>
                      <ArrowRight className="relative z-10 h-3.5 w-3.5 text-white transition-transform duration-300 ease-out group-hover/btn:translate-x-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 2: Luxury Grooming Spa */}
          <StaggerItem>
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
              <div className="relative h-48 w-full overflow-hidden bg-surface shrink-0">
                <SafeImage
                  src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80"
                  alt="Pet grooming spa"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="cream" size="sm" className="font-semibold shadow-xs">
                    Spa &amp; Hygiene
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1.5 text-white backdrop-blur-md border border-white/10 shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 block leading-none">From</span>
                  <p className="text-base font-bold leading-tight">₹800</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                      <Scissors className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      Luxury Grooming Spa
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground min-h-[2.5rem] line-clamp-2">
                    Breed-specific styling, soothing oatmeal baths, de-shedding treatments, and fear-free hygiene.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-border/60">
                  <Button
                    asChild
                    size="sm"
                    className="relative w-full overflow-hidden rounded-full font-semibold shadow-xs hover:shadow-lg hover:shadow-rose-300/40 dark:hover:shadow-rose-950/40 hover:ring-2 hover:ring-primary-soft/60 transition-all duration-300 group/btn bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
                  >
                    <Link
                      href="/services/grooming"
                      className="relative flex items-center justify-center gap-2 overflow-hidden py-2"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-300/0 via-pink-200/25 to-pink-300/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-pink-200/80 via-[#FFDADA]/90 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 text-white font-semibold">Book Grooming</span>
                      <ArrowRight className="relative z-10 h-3.5 w-3.5 text-white transition-transform duration-300 ease-out group-hover/btn:translate-x-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 3: Dog Training & Coaching */}
          <StaggerItem>
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
              <div className="relative h-48 w-full overflow-hidden bg-surface shrink-0">
                <SafeImage
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"
                  alt="Dog training session"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="pending" size="sm" className="font-semibold shadow-xs">
                    Positive Behavior
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1.5 text-white backdrop-blur-md border border-white/10 shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 block leading-none">From</span>
                  <p className="text-base font-bold leading-tight">₹1,200</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 shrink-0">
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      Positive Coaching
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground min-h-[2.5rem] line-clamp-2">
                    Humane reinforcement methods, puppy socialization, loose-leash training, and reactivity coaching.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-border/60">
                  <Button
                    asChild
                    size="sm"
                    className="relative w-full overflow-hidden rounded-full font-semibold shadow-xs hover:shadow-lg hover:shadow-rose-300/40 dark:hover:shadow-rose-950/40 hover:ring-2 hover:ring-primary-soft/60 transition-all duration-300 group/btn bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
                  >
                    <Link
                      href="/services/training"
                      className="relative flex items-center justify-center gap-2 overflow-hidden py-2"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-300/0 via-pink-200/25 to-pink-300/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-pink-200/80 via-[#FFDADA]/90 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 text-white font-semibold">Meet Trainers</span>
                      <ArrowRight className="relative z-10 h-3.5 w-3.5 text-white transition-transform duration-300 ease-out group-hover/btn:translate-x-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Card 4: In-House Pet Shop */}
          <StaggerItem>
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
              <div className="relative h-48 w-full overflow-hidden bg-surface shrink-0">
                <SafeImage
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80"
                  alt="Pet store essentials"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="default" size="sm" className="bg-primary text-primary-foreground font-semibold shadow-xs">
                    In-House Store
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-3 py-1.5 text-white backdrop-blur-md border border-white/10 shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90 block leading-none">From</span>
                  <p className="text-base font-bold leading-tight">₹249</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground shrink-0">
                      <ShoppingBag className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      In-House Essentials
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground min-h-[2.5rem] line-clamp-2">
                    100% genuine pet food, veterinary-approved supplements, durable chew toys, and orthopedic bedding.
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-border/60">
                  <Button
                    asChild
                    size="sm"
                    className="relative w-full overflow-hidden rounded-full font-semibold shadow-xs hover:shadow-lg hover:shadow-rose-300/40 dark:hover:shadow-rose-950/40 hover:ring-2 hover:ring-primary-soft/60 transition-all duration-300 group/btn bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
                  >
                    <Link
                      href="/shop"
                      className="relative flex items-center justify-center gap-2 overflow-hidden py-2"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-300/0 via-pink-200/25 to-pink-300/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-pink-200/80 via-[#FFDADA]/90 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 text-white font-semibold">Shop Essentials</span>
                      <ArrowRight className="relative z-10 h-3.5 w-3.5 text-white transition-transform duration-300 ease-out group-hover/btn:translate-x-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerView>
      </section>

      {/* ─── 3. HOW PAWCONNECT WORKS (SEAMLESS 3-STEP JOURNEY) ──────────────── */}
      <section className="bg-surface/60 py-16 dark:bg-muted/15 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center space-y-3 mb-12">
            <Badge variant="secondary" className="text-xs px-3 py-1">Effortless Care</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              How PawConnect simplifies pet parenting
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              A transparent, streamlined experience from your first appointment booking to in-house doorstep delivery.
            </p>
          </FadeInView>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative rounded-[28px] border border-border/70 bg-card p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg mb-5 shadow-xs">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground">Choose Your Care Specialty</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Browse licensed veterinary clinics, certified fear-free groomers, positive trainers, or curated nutrition.
              </p>
            </div>

            <div className="relative rounded-[28px] border border-border/70 bg-card p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold text-lg mb-5 shadow-xs">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground">Book with Transparent ₹ Pricing</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Select real-time calendar slots with instant confirmation. Zero phone tag, no hidden consultation add-ons.
              </p>
            </div>

            <div className="relative rounded-[28px] border border-border/70 bg-card p-7 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg mb-5 shadow-xs">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground">Unified Digital Pet Passport</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Prescriptions, vaccination reminders, booking statuses, and direct in-house orders remain organized in your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURED PET PRODUCTS (DYNAMIC IN-HOUSE CATALOGUE) ──────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-1.5">
            <Badge variant="primary" className="text-xs px-3 py-1">In-House Quality</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Featured Pet Essentials
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Guaranteed genuine food, supplements, and accessories stored and fulfilled directly by PawConnect.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full shrink-0 group/shop self-start sm:self-auto">
            <Link href="/shop" className="flex items-center gap-1.5">
              <span>Browse Complete Store</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/shop:translate-x-1" />
            </Link>
          </Button>
        </FadeInView>

        {backendProducts.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-border/80 bg-surface/40 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
              <PackageCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">In-House Inventory Dispatching Soon</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Our temperature-controlled warehouse stock is currently being indexed. Visit the store catalogue to explore categories, healthcare supplies, and upcoming items.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/shop">Open Pet Shop</Link>
            </Button>
          </div>
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {backendProducts.slice(0, 4).map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                  href={`/app/shop/products/${product.id}`}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>

      {/* ─── 5. VERIFIED SPECIALISTS (DYNAMIC VETS & CARE PROVIDERS) ────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-1.5">
            <Badge variant="primary" className="text-xs px-3 py-1">Verified Practitioners</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Certified Care Specialists
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Book consultations and spa sessions with licensed veterinarians and certified trainers.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full shrink-0 group/all self-start sm:self-auto">
            <Link href="/services" className="flex items-center gap-1.5">
              <span>Explore All Practitioners</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/all:translate-x-1" />
            </Link>
          </Button>
        </FadeInView>

        {backendVets.length === 0 && backendProviders.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-border/80 bg-surface/40 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Certified Specialists Joining Soon</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Veterinary doctors, groomers, and trainers are undergoing verification. Check back shortly or browse services to see category availability.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/services">Browse Care Services</Link>
            </Button>
          </div>
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {backendVets.slice(0, 2).map((vet, idx) => (
              <StaggerItem key={`vet-${vet.id}`}>
                <ProviderCard
                  id={String(vet.id)}
                  name={vet.name}
                  title={vet.specialization || "Licensed Veterinarian"}
                  specialty={vet.qualification || (vet.experienceYears ? `${vet.experienceYears}y clinical practice` : "Veterinary Medicine")}
                  location={vet.clinicName || vet.clinicAddress || "Veterinary Practice"}
                  rating={vet.rating || 0}
                  reviewCount={vet.reviewCount || 0}
                  fee={vet.consultationFee || 500}
                  feeLabel="Consultation"
                  nextAvailable={vet.isAvailableToday ? "Available Today" : "Book Online"}
                  availableToday={vet.isAvailableToday ?? false}
                  image={
                    vet.profileImageUrl ||
                    vet.photo ||
                    vet.profileImage ||
                    (idx === 0
                      ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"
                      : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80")
                  }
                  badges={[
                    ...(vet.specialization ? [vet.specialization.split(",")[0].trim()] : ["Veterinarian"]),
                    ...(vet.experienceYears ? [`${vet.experienceYears}y exp`] : ["Licensed"]),
                  ]}
                  bio={vet.bio}
                  detailsHref={`/app/services/veterinary/${vet.id}`}
                />
              </StaggerItem>
            ))}
            {backendProviders.slice(0, 2).map((provider) => (
              <StaggerItem key={`prov-${provider.id}`}>
                <ProviderCard
                  id={String(provider.id)}
                  name={provider.name}
                  title={provider.businessName || (provider.providerType === "GROOMER" ? "Grooming & Spa" : "Canine Coaching")}
                  specialty={
                    provider.description ||
                    (provider.providerType === "GROOMER" ? "Luxury Grooming Spa" : "Positive Behavior Coaching")
                  }
                  location={provider.address || "Certified Facility"}
                  rating={provider.rating || 0}
                  reviewCount={provider.reviewCount || 0}
                  fee={provider.providerType === "GROOMER" ? 800 : 1200}
                  feeLabel="Starting at"
                  nextAvailable="Book Online"
                  availableToday={true}
                  image={
                    provider.profileImageUrl ||
                    provider.photo ||
                    provider.profileImage ||
                    (provider.providerType === "GROOMER"
                      ? "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80"
                      : "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80")
                  }
                  badges={[provider.providerType === "GROOMER" ? "Groomer" : "Trainer"]}
                  detailsHref={
                    provider.providerType === "GROOMER"
                      ? `/app/services/grooming/${provider.id}`
                      : `/app/services/training/${provider.id}`
                  }
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>

      {/* ─── 6. TRUST PILLARS (WHY PET PARENTS CHOOSE PAWCONNECT) ────────────── */}
      <section className="bg-surface/50 py-16 dark:bg-muted/15 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center space-y-3 mb-14">
            <Badge variant="secondary" className="text-xs">Peace Of Mind</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Why pet owners trust PawConnect
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              A modern pet-care ecosystem built with transparency, clinical safety, and genuine care at its core.
            </p>
          </FadeInView>

          <StaggerView className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <div className="h-full rounded-[28px] border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Strict Clinical Vetting</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Every doctor, clinic, and groomer completes identity verification, medical licensing review, and safety checks.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="h-full rounded-[28px] border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-5">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Digital Pet Passport</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Preserve vaccinations, prescription logs, dietary preferences, and appointment records in one unified place.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="h-full rounded-[28px] border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-5">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Zero Counterfeit Stock</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No unauthorized third-party dropshippers. All products are verified, stored, and fulfilled directly by PawConnect.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="h-full rounded-[28px] border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 mb-5">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Instant Slot Booking</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Transparent pricing in Indian Rupees (₹) with real-time specialist calendars, instant confirmations, and zero phone tag.
                </p>
              </div>
            </StaggerItem>
          </StaggerView>
        </div>
      </section>

      {/* ─── 7. AUTHENTIC REVIEWS & TESTIMONIALS (DYNAMIC ONLY) ──────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="text-center space-y-3 mb-12">
          <Badge variant="primary" className="text-xs">Client Feedback</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Verified Pet Parent Reviews
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Honest feedback from pet owners who completed veterinary visits, grooming sessions, and coaching programs.
          </p>
        </FadeInView>

        {realReviews.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-border/80 bg-surface/40 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
              <MessageSquareHeart className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Be the First to Review</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Authentic reviews from verified pet parents appear here once appointments, grooming sessions, and product orders are completed.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link href="/services">Book a Service</Link>
            </Button>
          </div>
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {realReviews.slice(0, 4).map((rev) => (
              <StaggerItem key={rev.id}>
                <TestimonialCard
                  testimonial={{
                    id: String(rev.id),
                    author: rev.reviewerName,
                    petName: rev.targetTitle || "Companion Pet",
                    petBreed: "Verified Client",
                    quote: rev.reviewText,
                    rating: rev.rating,
                    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                    serviceType: rev.targetType ? rev.targetType.replace("_", " ") : "Pet Care",
                  }}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>

      {/* ─── 8. FREQUENTLY ASKED QUESTIONS (ACCORDION FAQ) ───────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="text-center space-y-3 mb-12">
          <Badge variant="secondary" className="text-xs">Got Questions?</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Clear answers about specialist verification, transparent pricing in ₹, and in-house fulfillment.
          </p>
        </FadeInView>

        <div className="space-y-3">
          {[
            {
              q: "How are veterinarians and groomers verified on PawConnect?",
              a: "Every doctor and care professional must provide verified medical credentials, state veterinary council registration, facility safety audits, and agree to our Fear-Free animal handling code of conduct before their calendar is enabled.",
            },
            {
              q: "Who fulfills and ships pet products ordered from the shop?",
              a: "All pet food, treats, toys, and healthcare supplies are directly stocked, quality-checked, and dispatched from PawConnect's temperature-controlled fulfillment centers. We do not host unvetted third-party dropshippers.",
            },
            {
              q: "How do appointment bookings and payments work?",
              a: "You select a verified doctor or salon, choose an available date and slot, and complete payment securely in Indian Rupees (₹). You receive an instant booking confirmation code and automated visit reminder.",
            },
            {
              q: "What should I do in a pet medical emergency?",
              a: "For acute emergencies, visit our Veterinary portal to locate 24/7 emergency clinics nearby or call our emergency triage helpline. Doctor slots marked 'Available Today' provide immediate appointments.",
            },
            {
              q: "What is your return policy for pet shop items?",
              a: "We offer an unconditional 30-day money-back guarantee on unopened pet food, accessories, and toys. If your pet is not satisfied, our support team will replace or refund promptly.",
            },
          ].map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-foreground text-sm sm:text-base"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 9. CALL TO ACTION BANNER (VIBRANT GRADIENT CARD) ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-primary via-primary/95 to-amber-600/90 p-8 text-white sm:p-14 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <p className="font-decorative text-3xl font-bold text-cream sm:text-4xl">
              Give your pet the royal treatment
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Ready to book your first consultation or order healthy meals?
            </h2>
            <p className="text-sm leading-relaxed text-white/90 sm:text-base">
              Join thousands of pet owners who enjoy stress-free appointments,
              verified local clinics, and premium in-house nutrition delivered to their door.
            </p>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90 px-7 shadow-md font-semibold">
                <Link href="/services">Find Local Services</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/50 text-white hover:bg-white/10 px-7 font-semibold">
                <Link href="/shop">Explore In-House Shop</Link>
              </Button>
            </div>
          </div>

          <FloatingElement
            deltaY={6}
            duration={5}
            className="pointer-events-none absolute -bottom-6 -right-6 hidden sm:block text-white/15"
          >
            <PawSymbol className="h-64 w-64 rotate-[15deg]" />
          </FloatingElement>
        </FadeInView>
      </section>
    </div>
  );
}
