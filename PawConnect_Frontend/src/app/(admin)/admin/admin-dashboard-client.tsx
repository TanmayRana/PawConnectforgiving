"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useAdminAnalytics,
  useAdminOrders,
  useAdminBookings,
  useAuditLogs,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminAnalyticsCharts } from "@/components/admin/admin-analytics-charts";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils/money";
import {
  Users,
  PawPrint,
  Stethoscope,
  Briefcase,
  CalendarDays,
  ShoppingBag,
  ShoppingCart,
  IndianRupee,
  ArrowRight,
  ShieldAlert,
  ClipboardList,
  Layers,
  Package,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

type ActivityTab = "orders" | "bookings";

export function AdminDashboardClient() {
  const { data: analytics, isLoading, isFetching, isError, refetch } = useAdminAnalytics();
  const { data: orders = [] } = useAdminOrders();
  const { data: bookings = [] } = useAdminBookings();
  const { data: auditLogs = [] } = useAuditLogs();

  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>("orders");

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16">
        <PageHeader
          title="Platform Command & Operations"
          description="Global oversight across clinical practices, pet wellness providers, catalog fulfillment, and platform governance."
        />
        <LoadingState variant="dashboard" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="py-12 sm:py-16">
        <ErrorState
          title="Could not load platform metrics"
          description="Failed to retrieve live operational data. Please verify network or retry."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { kpis } = analytics;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      {/* Header */}
      <PageHeader
        title="Platform Command & Operations"
        description="Global oversight across clinical practices, pet wellness providers, catalog fulfillment, and platform governance."
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Syncing telemetry..." />
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9 gap-1.5 font-medium flex-1 sm:flex-initial justify-center">
            <Link href="/admin/audit-logs">
              <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Audit Log</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-9 gap-1.5 flex-1 sm:flex-initial justify-center">
            <Link href="/admin/reports">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Active Reports</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Users"
          value={kpis.totalUsers}
          description="Platform members & staff"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Registered Pets"
          value={kpis.totalPets}
          description="Active canine & feline profiles"
          icon={<PawPrint className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Veterinarians"
          value={kpis.totalVeterinarians}
          description="Clinical practitioners"
          icon={<Stethoscope className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          label="Service Providers"
          value={kpis.totalProviders}
          description="Grooming & training studios"
          icon={<Briefcase className="h-4 w-4 text-sky-600" />}
        />
        <StatCard
          label="Care Sessions"
          value={kpis.totalBookings}
          description="Clinical & salon bookings"
          icon={<CalendarDays className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="In-House Products"
          value={kpis.totalProducts}
          description="Catalogue inventory items"
          icon={<ShoppingBag className="h-4 w-4 text-amber-600" />}
        />
        <StatCard
          label="Customer Orders"
          value={kpis.totalOrders}
          description="Storefront retail receipts"
          icon={<ShoppingCart className="h-4 w-4 text-sky-600" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatMoney(kpis.totalRevenue)}
          description="Net retail & care volume"
          icon={<IndianRupee className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      {/* In-House Marketplace Governance Banner */}
      <Card className="rounded-2xl sm:rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border border-primary/30 text-xs px-2.5 py-0.5 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 shrink-0" />
                Verified In-House Marketplace
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">100% Direct Fulfillment</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              PawConnect Curated Inventory & Fulfillment Control
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              All marketplace catalog products are sourced, stocked, and dispatched directly by PawConnect operations. No external vendor accounts, merchant registrations, or third-party listings are permitted on this platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9 bg-card w-full sm:w-auto justify-center">
              <Link href="/admin/orders">
                <Package className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span>Storefront Orders ({orders.length})</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-9 w-full sm:w-auto justify-center">
              <Link href="/admin/products">
                <ShoppingBag className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span>Manage In-House Products</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Admin Management Navigation Hub */}
      <div className="space-y-4">
        <SectionHeader
          title="Management Hub & Operations Navigation"
          description="Fast access to role-based directories, marketplace stock controls, and regulatory moderation tools."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Directory & User Administration */}
          <Card className="rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2.5 text-primary">
              <Users className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-bold text-foreground">Member & Provider Governance</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify practitioner licenses, oversee pet owners, and manage platform staff permissions.
            </p>
            <div className="space-y-1 pt-1 border-t border-border/60 text-xs">
              <Link
                href="/admin/users"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">All Users ({kpis.totalUsers})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/veterinarians"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Veterinarian Clinics ({kpis.totalVeterinarians})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/service-providers"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Care Providers ({kpis.totalProviders})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            </div>
          </Card>

          {/* Card 2: In-House Marketplace */}
          <Card className="rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2.5 text-amber-600">
              <ShoppingBag className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-bold text-foreground">In-House Storefront & Logistics</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Control stock units, set retail pricing in ₹, track packaging, and handle customer returns.
            </p>
            <div className="space-y-1 pt-1 border-t border-border/60 text-xs">
              <Link
                href="/admin/products"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">In-House Products ({kpis.totalProducts})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Storefront Orders ({orders.length})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/categories"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Catalog Categories</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            </div>
          </Card>

          {/* Card 3: Network Governance & Moderation */}
          <Card className="md:col-span-2 lg:col-span-1 rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2.5 text-sky-600">
              <Layers className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-bold text-foreground">Care Operations & Compliance</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review cross-network appointments, moderate public client reviews, and resolve user reports.
            </p>
            <div className="space-y-1 pt-1 border-t border-border/60 text-xs">
              <Link
                href="/admin/bookings"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Care Bookings ({bookings.length})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/reviews"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Reviews & Moderation</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-secondary/70 transition-colors text-foreground font-medium"
              >
                <span className="truncate mr-2">Incident Reports</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <AdminAnalyticsCharts analytics={analytics} />

      {/* Recent Activity & Operational Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Recent Orders & Bookings with Tabs */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SectionHeader
              title="Recent Operations Telemetry"
              description="Live stream of storefront transactions and client care sessions."
            />
            <div className="w-full sm:w-auto">
              <Tabs
                value={activeActivityTab}
                onValueChange={(val) => setActiveActivityTab(val as ActivityTab)}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-9 p-1 rounded-2xl bg-secondary/80">
                  <TabsTrigger value="orders" className="rounded-xl text-xs px-3 font-semibold justify-center">
                    Orders ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger value="bookings" className="rounded-xl text-xs px-3 font-semibold justify-center">
                    Bookings ({bookings.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {activeActivityTab === "orders" ? (
            orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
                title="No retail orders recorded"
                description="Orders placed on the in-house marketplace catalog will stream here in real time."
              />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:border-primary/40 transition-colors text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-foreground shrink-0 text-primary mt-0.5 sm:mt-0">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-mono font-bold text-foreground text-xs">
                            {order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <p className="text-muted-foreground truncate">
                          Recipient: <span className="font-medium text-foreground">{order.deliveryAddress?.recipientName}</span> • {order.items?.length || 0} items
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <span className="font-black text-foreground text-sm">
                        {formatMoney(order.total)}
                      </span>
                      <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8.5 font-medium">
                        <Link href={`/admin/orders/${order.id}`}>Review Order</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary font-semibold h-9 rounded-2xl">
                  <Link href="/admin/orders">
                    View All Orders ({orders.length})
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )
          ) : (
            bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8 text-muted-foreground" />}
                title="No care bookings recorded"
                description="Veterinary and wellness service appointments will stream here in real time."
              />
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:border-primary/40 transition-colors text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-secondary flex items-center justify-center font-bold text-foreground shrink-0 mt-0.5 sm:mt-0">
                        {booking.type === "veterinary" ? (
                          <Stethoscope className="h-4 w-4 text-primary" />
                        ) : (
                          <Briefcase className="h-4 w-4 text-sky-600" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-bold text-foreground text-xs truncate max-w-[200px] sm:max-w-none">{booking.serviceTitle}</span>
                          <StatusBadge status={booking.status} size="sm" />
                        </div>
                        <p className="text-muted-foreground truncate">
                          Patient: <span className="font-semibold text-foreground">{booking.petName}</span> ({booking.petSpecies}) • Owner: {booking.customerName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Provider: {booking.providerName} • {booking.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto">
                        <span className="text-[11px] text-muted-foreground sm:hidden font-medium">Session Fee</span>
                        <div className="text-right">
                          <span className="font-black text-foreground block text-sm">{formatMoney(booking.price)}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:block">{booking.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary font-semibold h-9 rounded-2xl">
                  <Link href="/admin/bookings">
                    View All Care Bookings ({bookings.length})
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>

        {/* Right Column: Live Audit Activity Trail & Governance Summary */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-6">
          {/* Audit Trail Card */}
          <Card className="rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">Operational Audit Log</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-primary p-0 font-medium hover:bg-transparent">
                <Link href="/admin/audit-logs">All Logs</Link>
              </Button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No system events logged today.
              </p>
            ) : (
              <div className="space-y-3.5 text-xs">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="space-y-1 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider rounded-md py-0 px-1.5 border-border/80 shrink-0">
                        {log.module}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-foreground/90 font-medium leading-snug text-xs break-words">
                      {log.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Actor: {log.actorName} ({log.actorRole})
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button asChild variant="outline" size="sm" className="w-full rounded-2xl text-xs h-9 font-medium">
              <Link href="/admin/audit-logs">View Complete Audit Log</Link>
            </Button>
          </Card>

          {/* Quick Compliance Card */}
          <Card className="rounded-2xl sm:rounded-3xl border-border/80 bg-surface/50 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Platform Integrity Status</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              All transactions and credential verifications conform to veterinary care board compliance and PCI-DSS requirements. All orders are fulfilled through certified in-house supply centers.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
