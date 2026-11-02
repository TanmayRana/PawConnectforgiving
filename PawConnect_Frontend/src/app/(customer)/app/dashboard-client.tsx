"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { BookingCard } from "@/components/shared/booking-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PetFormModal } from "@/components/customer/pet-form-modal";
import {
  useCustomerProfile,
  usePets,
  useBookings,
  useOrders,
  useCustomerNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useCreatePet,
  useCancelBooking,
} from "@/lib/api/hooks";
import { formatMoney } from "@/lib/utils/money";
import {
  Stethoscope,
  Scissors,
  Award,
  ShoppingBag,
  ArrowRight,
  Plus,
  PawPrint,
  Clock,
  Sparkles,
  Package,
  Bell,
  CheckCheck,
  Calendar,
  HeartPulse,
  Info,
  CalendarDays,
  Truck,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80";
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80";

export function CustomerDashboardClient() {
  const shouldReduceMotion = useReducedMotion();
  const { data: profile } = useCustomerProfile();
  const { data: pets = [] } = usePets();
  const { data: bookings = [] } = useBookings();
  const { data: orders = [] } = useOrders();
  const { data: notifications = [] } = useCustomerNotifications();

  const createPetMutation = useCreatePet();
  const cancelBookingMutation = useCancelBooking();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [addPetOpen, setAddPetOpen] = React.useState(false);

  // Greeting based on time of day
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const upcomingBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return (
        s === "scheduled" ||
        s === "confirmed" ||
        s === "in-progress" ||
        s === "in_progress" ||
        s === "pending" ||
        s === "upcoming"
      );
    });
  }, [bookings]);

  const pastBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => (b.status || "").toLowerCase() === "completed"
    );
  }, [bookings]);

  const activeOrders = React.useMemo(() => {
    return orders.filter(
      (o) => o.status === "confirmed" || o.status === "packed" || o.status === "shipped"
    );
  }, [orders]);

  const unreadNotifications = React.useMemo(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const modules = [
    {
      id: "vet",
      title: "Veterinary Medicine",
      tagline: "Clinical exams, diagnostics, vaccinations & dental care",
      href: "/app/services/veterinary",
      icon: Stethoscope,
      bgClass: "bg-primary-soft/30 hover:bg-primary-soft/50 border-primary/20",
      iconBg: "bg-primary text-primary-foreground",
      badge: "Clinical Care",
    },
    {
      id: "grooming",
      title: "Grooming & Spas",
      tagline: "Hydro-baths, hypoallergenic coat soaks & styling",
      href: "/app/services/grooming",
      icon: Scissors,
      bgClass: "bg-cream/60 hover:bg-cream/90 border-cream-border",
      iconBg: "bg-amber-500 text-white",
      badge: "Fear-Free",
    },
    {
      id: "training",
      title: "Positive Training",
      tagline: "Humane puppy manners, leash reset & obedience",
      href: "/app/services/training",
      icon: Award,
      bgClass: "bg-blue-soft/50 hover:bg-blue-soft/80 border-blue-border",
      iconBg: "bg-sky-500 text-white",
      badge: "100% Force-Free",
    },
    {
      id: "shop",
      title: "In-House Pet Shop",
      tagline: "Direct fresh organic food, treats & orthopedic beds",
      href: "/app/shop",
      icon: ShoppingBag,
      bgClass: "bg-surface hover:bg-muted/80 border-border",
      iconBg: "bg-foreground text-background",
      badge: "Direct In-House",
    },
  ];

  const handleCancelBooking = async (booking: { id: string }) => {
    try {
      await cancelBookingMutation.mutateAsync(booking.id);
      showSuccess("Booking cancelled", "Your scheduled appointment has been released.");
    } catch {
      showError("Failed to cancel booking", "Unable to cancel booking at this time. Please try again.");
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      // silent fallback
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      showSuccess("All read", "All notifications have been marked as read.");
    } catch {
      showError("Error", "Could not mark notifications as read.");
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* ─── 1. Welcome Greeting & Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Pet Parent Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
            {greeting}, {profile?.firstName || "Pet Parent"}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Your family dashboard for pet wellness appointments, health milestones, in-house orders, and records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setAddPetOpen(true)}
            className="rounded-full shadow-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Pet</span>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5">
            <Link href="/app/services/veterinary">
              <CalendarDays className="h-4 w-4" />
              <span>Book Visit</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5">
            <Link href="/app/shop">
              <ShoppingBag className="h-4 w-4" />
              <span>Shop Essentials</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── 2. Key Metrics Overview (4 Pillars) ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Pets */}
        <Link
          href="/app/pets"
          className="group rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">My Pets</span>
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <PawPrint className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {pets.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {pets.length > 0
                ? pets.map((p) => p.name).join(", ")
                : "No pets registered yet"}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-primary">
            <span>Manage Profiles</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Upcoming Appointments */}
        <Link
          href="/app/bookings"
          className="group rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Upcoming Visits</span>
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {upcomingBookings.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {upcomingBookings[0]
                ? `${upcomingBookings[0].date} (${upcomingBookings[0].time})`
                : "All caught up on care"}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <span>View Schedule</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Active Orders */}
        <Link
          href="/app/orders"
          className="group rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Orders</span>
            <div className="h-9 w-9 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {activeOrders.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {activeOrders[0]
                ? `Order #${activeOrders[0].orderNumber}`
                : `${orders.length} past orders placed`}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            <span>Track Deliveries</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Notifications & Reminders */}
        <div className="group rounded-3xl border border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Alerts & Care</span>
            <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
              <span>{unreadNotifications.length}</span>
              {unreadNotifications.length > 0 && (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {unreadNotifications.length > 0
                ? "Unread reminders & updates"
                : "No pending reminders"}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {unreadNotifications.length > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            ) : (
              <span>All caught up</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. Explore Certified Care Services Modules ──────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Explore Services</h2>
          <span className="text-xs text-muted-foreground">Certified in-house network</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.id}
                whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.015 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Link
                  href={m.href}
                  className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border p-6 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none shadow-xs hover:shadow-md ${m.bgClass}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs ${m.iconBg}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" size="sm" className="bg-background/80 text-[10px] font-semibold">
                        {m.badge}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {m.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    <span>Explore Now</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. Primary Two-Column Operations Layout ─────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Appointments & Orders (7 cols) */}
        <div className="space-y-8 lg:col-span-7">
          {/* Section: Upcoming Care Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Upcoming Appointments</h2>
              </div>
              <Link
                href="/app/bookings"
                className="text-xs font-semibold text-primary hover:underline"
              >
                All bookings ({bookings.length})
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <EmptyState
                title="No upcoming visits scheduled"
                description="Your pets are all caught up! Book a veterinary wellness exam, hydro-bath grooming session, or positive behavior training."
                action={
                  <Button asChild size="sm" className="rounded-full shadow-xs">
                    <Link href="/app/services/veterinary">Browse Specialists</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 2).map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section: In-House Orders Overview */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Recent In-House Orders</h2>
              </div>
              <Link
                href="/app/orders"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all ({orders.length})
              </Link>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                title="No product orders placed yet"
                description="Order authentic veterinary kibble, resilient toys, and grooming essentials delivered directly from our climate-controlled fulfillment hub."
                action={
                  <Button asChild size="sm" className="rounded-full shadow-xs">
                    <Link href="/app/shop">Explore Pet Shop</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card shadow-xs transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product thumbnail preview stack */}
                      <div className="flex -space-x-2 shrink-0 py-1">
                        {ord.items.slice(0, 2).map((it, idx) => (
                          <div
                            key={`${it.productId}-${idx}`}
                            className="relative h-11 w-11 rounded-xl overflow-hidden border-2 border-background bg-surface shadow-2xs shrink-0"
                            title={it.name}
                          >
                            <Image
                              src={it.image || FALLBACK_PRODUCT_IMAGE}
                              alt={it.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {ord.items.length > 2 && (
                          <div className="relative h-11 w-11 rounded-xl border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-2xs shrink-0">
                            +{ord.items.length - 2}
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            #{ord.orderNumber}
                          </span>
                          <StatusBadge status={ord.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {ord.items.length} {ord.items.length === 1 ? "item" : "items"} • {formatMoney(ord.total)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                          <Truck className="h-3 w-3 text-primary" />
                          <span>Est. Delivery: {ord.estimatedDelivery || "2–3 days"}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-9 shrink-0 gap-1 font-semibold"
                    >
                      <Link href={`/app/orders/${ord.id}`}>
                        <span>Track Order</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pets Family & Notifications (5 cols) */}
        <div className="space-y-8 lg:col-span-5">
          {/* Section: My Fur Family (Pets) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">My Fur Family ({pets.length})</h2>
              </div>
              <Link
                href="/app/pets"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {pets.length === 0 ? (
              <EmptyState
                title="No pets added yet"
                description="Register your companion to access personalized healthcare, vaccinations, and appointment bookings."
                action={
                  <Button
                    size="sm"
                    onClick={() => setAddPetOpen(true)}
                    className="rounded-full shadow-xs gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Pet</span>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {pets.slice(0, 3).map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/app/pets/${pet.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border shrink-0 bg-surface">
                        <Image
                          src={pet.photo || pet.photoUrl || FALLBACK_PET_IMAGE}
                          alt={pet.name}
                          fill
                          sizes="48px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {pet.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {pet.breed || pet.species} • {pet.age} {pet.age === 1 ? "yr" : "yrs"}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={pet.gender?.toUpperCase() === "MALE" ? "secondary" : "default"}
                      size="sm"
                      className="text-[10px] shrink-0"
                    >
                      {pet.gender}
                    </Badge>
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => setAddPetOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 py-3 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-card/50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add another pet</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Notifications & Care Reminders */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Care Alerts & Updates</h2>
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center text-xs text-muted-foreground space-y-1">
                <CheckCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                <p className="font-semibold text-foreground">You are all caught up!</p>
                <p>No unread reminders, appointment updates, or delivery notifications.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 4).map((notif) => {
                  const isBooking = notif.type === "booking";
                  const isOrder = notif.type === "order";
                  const isHealth = notif.type === "health";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                      className={`relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-xs ${
                        notif.read
                          ? "border-border/60 bg-card/60 opacity-80"
                          : "border-primary/30 bg-primary-soft/20 shadow-xs cursor-pointer"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isBooking
                            ? "bg-amber-500/15 text-amber-600"
                            : isOrder
                            ? "bg-sky-500/15 text-sky-600"
                            : isHealth
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isBooking ? (
                          <Calendar className="h-4 w-4" />
                        ) : isOrder ? (
                          <Package className="h-4 w-4" />
                        ) : isHealth ? (
                          <HeartPulse className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground truncate">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11px]">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-1"
                          >
                            <span>View details</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>

                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5. Recent Completed Care History ───────────────────────────────── */}
      {pastBookings.length > 0 && (
        <section className="space-y-4 border-t border-border/60 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Completed Care</h2>
            <Link href="/app/bookings" className="text-xs font-semibold text-primary hover:underline">
              View care history
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastBookings.slice(0, 3).map((pb) => (
              <div
                key={pb.id}
                className="flex items-start justify-between rounded-2xl border border-border/70 bg-card p-4 text-xs shadow-xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-foreground">{pb.serviceTitle}</span>
                  <p className="text-muted-foreground">
                    {pb.petName} with {pb.providerName}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Completed on {pb.date}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="h-8 text-xs rounded-full">
                  <Link href={`/app/bookings/${pb.id}`}>Summary</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Pet Modal */}
      <PetFormModal
        open={addPetOpen}
        onOpenChange={setAddPetOpen}
        mode="create"
        onSubmit={async (data) => {
          const created = await createPetMutation.mutateAsync(data);
          showSuccess(
            `Welcome to PawConnect, ${created.name || data.name}!`,
            "Pet profile registered successfully."
          );
        }}
      />
    </div>
  );
}
