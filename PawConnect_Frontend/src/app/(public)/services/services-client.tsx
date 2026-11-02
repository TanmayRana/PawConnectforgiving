"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/shared/provider-card";
import { EmptyState } from "@/components/shared/states";
import {
  FadeInView,
  StaggerView,
  StaggerItem,
} from "@/lib/animations/motion-components";
import { Stethoscope, Scissors, Award, ArrowRight, Check } from "lucide-react";
import {
  usePublicVeterinarians,
  usePublicServiceProviders,
  type BackendPublicVeterinarian,
  type BackendPublicServiceProvider,
} from "@/lib/api/hooks";

interface ServicesClientProps {
  initialVets?: BackendPublicVeterinarian[];
  initialGroomers?: BackendPublicServiceProvider[];
  initialTrainers?: BackendPublicServiceProvider[];
}

export function ServicesClient({
  initialVets,
  initialGroomers,
  initialTrainers,
}: ServicesClientProps = {}) {
  const { data: vets = initialVets || [] } = usePublicVeterinarians();
  const { data: groomers = initialGroomers || [] } = usePublicServiceProviders({
    providerType: "GROOMER",
  });
  const { data: trainers = initialTrainers || [] } = usePublicServiceProviders({
    providerType: "TRAINER",
  });

  return (
    <div className="flex flex-col gap-16 py-10 sm:gap-24 sm:py-16">
      {/* ─── Page Hero ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView aboveTheFold className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="cream" className="text-xs">Certified Specialists</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Complete pet care services under one roof
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Tailored medical, grooming, and behavioral care
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every specialist on PawConnect is fully verified, licensed, and dedicated
            to fear-free handling. Discover our three pillars of pet health and wellness below.
          </p>
        </FadeInView>

        {/* 3 Pillar Summary Cards with Staggered Entrance */}
        <StaggerView className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerItem>
            <div className="rounded-[32px] border border-border/70 bg-primary-soft/30 p-8 flex flex-col justify-between h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:will-change-transform motion-reduce:transition-none">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Veterinary Medicine</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Comprehensive physical exams, vaccinations, dental procedures, surgery, and urgent care triage.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Licensed doctors & emergency triage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Real-time appointment slots</span>
                  </li>
                </ul>
              </div>
              <Button asChild size="sm" className="mt-6 rounded-full self-start shadow-sm active:scale-95 transition-transform">
                <Link href="/services/veterinary" className="flex items-center gap-1.5">
                  <span>Browse Veterinarians</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-[32px] border border-border/70 bg-cream/50 p-8 flex flex-col justify-between h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:will-change-transform motion-reduce:transition-none">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow-sm">
                  <Scissors className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Grooming & Spas</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Breed styling haircuts, organic oatmeal soaks, high-velocity blowout de-shedding, and hygienic paw trims.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                    <span>Fear-free handling certified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                    <span>Clean, sanitized private suites</span>
                  </li>
                </ul>
              </div>
              <Button asChild size="sm" className="mt-6 rounded-full self-start bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95 transition-transform">
                <Link href="/services/grooming" className="flex items-center gap-1.5">
                  <span>Browse Salons</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem className="sm:col-span-2 lg:col-span-1">
            <div className="rounded-[32px] border border-border/70 bg-blue-soft/40 p-8 flex flex-col justify-between h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:will-change-transform motion-reduce:transition-none">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400 text-sky-950 shadow-sm">
                  <Award className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Positive Training</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Puppy foundational obedience, leash aggression resets, separation anxiety rehab, and agility obstacle courses.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-sky-600" />
                    <span>100% positive reinforcement only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-sky-600" />
                    <span>Private and group class options</span>
                  </li>
                </ul>
              </div>
              <Button asChild size="sm" className="mt-6 rounded-full self-start bg-sky-600 hover:bg-sky-700 text-white shadow-sm active:scale-95 transition-transform">
                <Link href="/services/training" className="flex items-center gap-1.5">
                  <span>Browse Trainers</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </StaggerItem>
        </StaggerView>
      </section>

      {/* ─── 1. Veterinary Services Preview ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Veterinary Health</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Clinical care & wellness checks</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full self-start md:self-auto">
            <Link href="/services/veterinary" className="flex items-center gap-1.5">
              <span>View All Veterinary Doctors ({vets.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </FadeInView>

        {vets.length === 0 ? (
          <EmptyState
            title="Veterinary Clinicians Joining Soon"
            description="Licensed veterinary doctors and clinics are currently completing verification. Check back shortly or browse other services."
            icon={<Stethoscope className="h-7 w-7 text-primary" />}
            action={
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/services/veterinary">View Veterinary Details</Link>
              </Button>
            }
          />
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vets.slice(0, 3).map((vet) => (
              <StaggerItem key={`vet-${vet.id}`}>
                <ProviderCard
                  id={String(vet.id)}
                  name={vet.name}
                  title={vet.specialization || "Licensed Veterinarian"}
                  specialty={vet.qualification || vet.specialization}
                  location={vet.clinicName || vet.clinicAddress || "Veterinary Practice"}
                  rating={vet.rating || 0}
                  reviewCount={vet.reviewCount || 0}
                  fee={vet.consultationFee || 500}
                  feeLabel="Consultation"
                  nextAvailable={vet.isAvailableToday ? "Available Today" : "Book Online"}
                  availableToday={vet.isAvailableToday}
                  image="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80"
                  badges={[
                    ...(vet.specialization ? [vet.specialization] : []),
                    ...(vet.experienceYears ? [`${vet.experienceYears}y exp`] : []),
                  ]}
                  bio={vet.bio}
                  detailsHref="/services/veterinary"
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>

      {/* ─── 2. Grooming Services Preview ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-5 w-5 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Grooming & Hygiene</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Gentle spa baths & styling</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full self-start md:self-auto">
            <Link href="/services/grooming" className="flex items-center gap-1.5">
              <span>View Grooming Salons ({groomers.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </FadeInView>

        {groomers.length === 0 ? (
          <EmptyState
            title="Grooming Salons Joining Soon"
            description="Certified fear-free groomers and luxury salons are completing onboarding. Visit our grooming directory for details."
            icon={<Scissors className="h-7 w-7 text-amber-600" />}
            action={
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/services/grooming">Explore Grooming Packages</Link>
              </Button>
            }
          />
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groomers.slice(0, 3).map((provider) => (
              <StaggerItem key={`groom-${provider.id}`}>
                <ProviderCard
                  id={String(provider.id)}
                  name={provider.name}
                  title={provider.businessName}
                  specialty={provider.description || "Grooming & Spa"}
                  location={provider.address || "Certified Salon"}
                  rating={provider.rating || 0}
                  reviewCount={provider.reviewCount || 0}
                  fee={800}
                  feeLabel="Starting at"
                  nextAvailable="Book Online"
                  availableToday={true}
                  image="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80"
                  badges={["Grooming"]}
                  detailsHref="/services/grooming"
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>

      {/* ─── 3. Training Services Preview ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Canine Coaching</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Positive behavioral programs</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full self-start md:self-auto">
            <Link href="/services/training" className="flex items-center gap-1.5">
              <span>View Certified Trainers ({trainers.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </FadeInView>

        {trainers.length === 0 ? (
          <EmptyState
            title="Positive Trainers Joining Soon"
            description="Certified behavioral specialists and puppy coaches are completing their profiles."
            icon={<Award className="h-7 w-7 text-sky-600" />}
            action={
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/services/training">View Training Details</Link>
              </Button>
            }
          />
        ) : (
          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.slice(0, 3).map((provider) => (
              <StaggerItem key={`train-${provider.id}`}>
                <ProviderCard
                  id={String(provider.id)}
                  name={provider.name}
                  title={provider.businessName}
                  specialty={provider.description || "Positive Canine Coaching"}
                  location={provider.address || "Training Facility"}
                  rating={provider.rating || 0}
                  reviewCount={provider.reviewCount || 0}
                  fee={1200}
                  feeLabel="Starting at"
                  nextAvailable="Book Online"
                  availableToday={true}
                  image="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"
                  badges={["Trainer"]}
                  detailsHref="/services/training"
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </section>
    </div>
  );
}
