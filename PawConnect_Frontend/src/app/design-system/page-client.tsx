"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { PawSpinner, RefreshIndicator } from "@/components/ui/paw-spinner";
import { PetLoadingScreen } from "@/components/ui/pet-loading-screen";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormModal, FormDrawer } from "@/components/shared/form-shells";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ServiceCard } from "@/components/shared/service-card";
import { ProductCard } from "@/components/shared/product-card";
import { StaggerView, StaggerItem, FloatingElement } from "@/lib/animations/motion-components";
import { VETERINARY_CATALOG_SERVICES } from "@/lib/constants/services";
import { useAuthModal } from "@/stores/auth-modal.store";
import { Heart, Star, ShoppingBag, Users, Stethoscope, PawPrint, Sparkles } from "lucide-react";
import { toast } from "@/lib/utils/toast";

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 py-8 border-b border-border last:border-0">
      <h2 className="text-xl font-bold text-foreground sticky top-[57px] bg-background/95 backdrop-blur-sm py-2 z-10">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children, wrap = false }: { children: React.ReactNode; wrap?: boolean }) {
  return (
    <div className={`flex ${wrap ? "flex-wrap" : "flex-row"} items-start gap-3`}>
      {children}
    </div>
  );
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TABLE_DATA = [
  { id: "1", name: "Max", species: "Dog", breed: "Labrador", status: "active" },
  { id: "2", name: "Whiskers", species: "Cat", breed: "Persian", status: "inactive" },
  { id: "3", name: "Tweety", species: "Bird", breed: "Canary", status: "active" },
];

const DEMO_TABLE_COLUMNS = [
  { key: "name", header: "Name" },
  { key: "species", header: "Species" },
  { key: "breed", header: "Breed" },
  {
    key: "status",
    header: "Status",
    cell: (row: typeof DEMO_TABLE_DATA[0]) => <StatusBadge status={row.status} />,
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = React.useState(false);
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const { openLogin, openRegister } = useAuthModal();

  return (
    <div className="min-h-screen bg-background">
      {/* TOC sidebar */}
      <div className="flex">
        <aside className="hidden xl:block w-56 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sections</p>
          <nav className="space-y-1" aria-label="Design system sections">
            {[
              "branding",
              "animation",
              "typography",
              "colors",
              "buttons",
              "toasts",
              "badges",
              "cards",
              "inputs",
              "tabs",
              "accordion",
              "tables",
              "skeletons",
              "states",
              "dialogs",
              "navigation",
              "layouts",
            ].map((s) => (
              <a key={s} href={`#${s}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1 capitalize">
                {s}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 max-w-5xl mx-auto px-4 md:px-8 pb-16">
          <div className="py-8 border-b border-border mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">PawConnect Design System</h1>
            <p className="text-muted-foreground">
              Visual reference for all reusable components. All components use centralized theme tokens and consistent Motion foundations.
            </p>
          </div>

          {/* ─── Brand Logo & Variants ───────────────────────────────────────── */}
          <Section id="branding" title="Brand Logo & Identity">
            <p className="text-sm text-muted-foreground mb-4">
              Custom SVG vector wordmark integrating the central Paw print symbol between &quot;Paw&quot; and &quot;Connect&quot;.
              Features smooth entrance choreography and full light/dark/compact adaptability.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Default Variant</span>
                <div className="py-2">
                  <BrandLogo variant="default" />
                </div>
                <span className="text-xs text-muted-foreground">Public navigation & headers</span>
              </Card>

              <Card className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Compact Variant</span>
                <div className="py-2">
                  <BrandLogo variant="compact" />
                </div>
                <span className="text-xs text-muted-foreground">Mobile drawers & topbars</span>
              </Card>

              <Card className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Icon Variant</span>
                <div className="py-2">
                  <BrandLogo variant="icon" />
                </div>
                <span className="text-xs text-muted-foreground">App icon & small badges</span>
              </Card>

              <Card className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-[#272727] text-white dark:bg-card">
                <span className="text-xs font-semibold text-white/70 uppercase">Light Variant</span>
                <div className="py-2">
                  <BrandLogo variant="light" />
                </div>
                <span className="text-xs text-white/70">Dark surfaces & hero overlays</span>
              </Card>
            </div>
          </Section>

          {/* ─── Animation & Motion System ───────────────────────────────────── */}
          <Section id="animation" title="Animation & Motion System">
            <p className="text-sm text-muted-foreground mb-4">
              Motion foundations built on Motion React (<code className="font-mono text-xs">motion/react</code>).
              Provides consistent timing curves, spring dynamics, accessible reduced-motion fallbacks, and micro-interactions.
            </p>

            {/* Motion Tokens */}
            <SectionHeader title="Duration Tokens & Principles" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card variant="compact">
                <p className="font-semibold text-foreground">Fast (150ms)</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">DURATION.fast</p>
                <p className="text-xs text-muted-foreground mt-1">Button taps, icon nudges, micro-states</p>
              </Card>
              <Card variant="compact">
                <p className="font-semibold text-foreground">Normal (250ms)</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">DURATION.normal</p>
                <p className="text-xs text-muted-foreground mt-1">Hover transitions, dialog pops, tabs</p>
              </Card>
              <Card variant="compact">
                <p className="font-semibold text-foreground">Medium (400ms)</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">DURATION.medium</p>
                <p className="text-xs text-muted-foreground mt-1">Section entries, card reveals, drawers</p>
              </Card>
              <Card variant="compact">
                <p className="font-semibold text-foreground">Slow (700ms)</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">DURATION.slow</p>
                <p className="text-xs text-muted-foreground mt-1">Hero staggered sequences, major reveals</p>
              </Card>
            </div>

            {/* Interactive Card Hover Demo */}
            <SectionHeader title="Interactive Card Motion (Hover & Tap)" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {VETERINARY_CATALOG_SERVICES[0] && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">ServiceCard Hover</p>
                  <ServiceCard service={VETERINARY_CATALOG_SERVICES[0]} />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">ProductCard Hover & Cart</p>
                <ProductCard
                  product={{
                    id: "demo-prod-1",
                    name: "Wild Alaskan Salmon & Sweet Potato Kibble",
                    category: "Pet Food",
                    description: "Veterinarian-formulated hypoallergenic formula with wild caught salmon.",
                    price: 48.99,
                    originalPrice: 54.99,
                    rating: 0,
                    reviewCount: 0,
                    images: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80"],
                    stock: 24,
                    petType: "dog",
                  }}
                  onAddToCart={(p) => toast.success(`Added ${p.name}`)}
                />
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 rounded-[32px] border border-border/70 bg-surface/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Reduced Motion Support</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every animated component respects <code className="font-mono text-xs">prefers-reduced-motion</code>. When enabled at the OS level, transforms are omitted while maintaining a gentle opacity transition.
                </p>
                <FloatingElement deltaY={6} duration={3} className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Floating decorative element test</span>
                </FloatingElement>
              </div>
            </div>

            {/* Stagger Viewport Reveal Demo */}
            <SectionHeader title="Stagger Viewport Reveal" />
            <StaggerView className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((num) => (
                <StaggerItem key={num}>
                  <Card className="p-4 text-center">
                    <p className="text-sm font-semibold text-foreground">Stagger Item #{num}</p>
                    <p className="text-xs text-muted-foreground">Cascaded viewport reveal</p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerView>
          </Section>

          {/* ─── Typography ──────────────────────────────────────────────────── */}
          <Section id="typography" title="Typography">
            <div className="space-y-3">
              <div className="font-decorative text-5xl text-foreground">Just Another Hand — Decorative</div>
              <h1 className="text-5xl font-bold text-foreground">H1 — Display (62px)</h1>
              <h2 className="text-4xl font-bold text-foreground">H2 — Heading (56px)</h2>
              <h3 className="text-3xl font-semibold text-foreground">H3 — Subheading (48px)</h3>
              <h4 className="text-2xl font-medium text-foreground">H4 — Card Title</h4>
              <h5 className="text-xl font-medium text-foreground">H5 — Section Title</h5>
              <p className="text-base text-foreground">Body text — Inter 16px/400. The quick brown fox jumps over the lazy dog.</p>
              <p className="text-sm text-muted-foreground">Muted body — 14px. Used for descriptions and secondary information.</p>
              <p className="text-xs text-muted-foreground">Caption — 12px. Used for labels, timestamps, and micro-copy.</p>
            </div>
          </Section>

          {/* ─── Colors ──────────────────────────────────────────────────────── */}
          <Section id="colors" title="Color Palette">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: "Background", cls: "bg-background border" },
                { name: "Foreground", cls: "bg-foreground" },
                { name: "Primary", cls: "bg-primary" },
                { name: "Primary Soft", cls: "bg-primary-soft border" },
                { name: "Cream", cls: "bg-cream border border-cream-border" },
                { name: "Blue Soft", cls: "bg-blue-soft border border-blue-border" },
                { name: "Surface", cls: "bg-surface" },
                { name: "Muted", cls: "bg-muted" },
                { name: "Destructive", cls: "bg-destructive" },
                { name: "Pink Soft", cls: "bg-pink-soft" },
                { name: "Border", cls: "bg-border" },
                { name: "Card", cls: "bg-card border" },
              ].map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className={`h-16 rounded-xl ${c.cls}`} />
                  <p className="text-xs text-muted-foreground text-center">{c.name}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ─── Buttons ─────────────────────────────────────────────────────── */}
          <Section id="buttons" title="Buttons">
            <SectionHeader title="Variants" />
            <Row wrap>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="cream">Cream</Button>
              <Button variant="blue">Blue</Button>
            </Row>
            <SectionHeader title="Sizes" />
            <Row wrap>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
              <Button size="icon" aria-label="Favorite"><Heart className="h-4 w-4" /></Button>
            </Row>
            <SectionHeader title="States" />
            <Row wrap>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button onClick={() => openLogin()}>Open Auth Modal</Button>
            </Row>
          </Section>

          {/* ─── Toasts ───────────────────────────────────────────────────────── */}
          <Section id="toasts" title="Toast Notifications (Unified Global System)">
            <p className="text-sm text-muted-foreground">
              Standardized, accessible notification toasts with brand-harmonized color glows, WCAG AA contrast, and sleek Lucide status badges.
            </p>
            <Row wrap>
              <Button
                variant="outline"
                className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                onClick={() =>
                  toast.success("Appointment Confirmed!", {
                    description: "Dr. Sarah will meet Buster on Thursday, Oct 24 at 2:30 PM.",
                  })
                }
              >
                Success Toast
              </Button>

              <Button
                variant="outline"
                className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() =>
                  toast.error("Payment Authorization Failed", {
                    description: "Your card was declined by the issuer. Please check balance or use another card.",
                  })
                }
              >
                Error Toast
              </Button>

              <Button
                variant="outline"
                className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                onClick={() =>
                  toast.warning("Limited Stock Remaining", {
                    description: "Only 2 units of Organic Salmon Crunchies remain in inventory.",
                  })
                }
              >
                Warning Toast
              </Button>

              <Button
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10"
                onClick={() =>
                  toast.info("PawConnect Care Tip", {
                    description: "Buster's annual rabies vaccination booster is recommended within 14 days.",
                  })
                }
              >
                Info / Brand Toast
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  toast("Removed from Saved Items", {
                    description: "Orthopedic Memory Foam Pet Bed was removed.",
                    action: {
                      label: "Undo",
                      onClick: () =>
                        toast.success("Item Restored", {
                          description: "Pet bed has been re-added to your saved list.",
                        }),
                    },
                  })
                }
              >
                Toast with Action
              </Button>

              <Button
                variant="default"
                onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 2000)),
                    {
                      loading: "Uploading Vaccination Certificate...",
                      success: "Certificate verified and securely attached to pet profile!",
                      error: "Could not process certificate. Please try again.",
                    }
                  );
                }}
              >
                Promise Toast (Async)
              </Button>
            </Row>
          </Section>

          {/* ─── Badges ──────────────────────────────────────────────────────── */}
          <Section id="badges" title="Badges">
            <Row wrap>
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="ghost">Ghost</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="pending">Pending</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="cream">Cream</Badge>
            </Row>
            <SectionHeader title="Status Badges" className="mt-4" />
            <Row wrap>
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="confirmed" />
              <StatusBadge status="shipped" />
              <StatusBadge status="delivered" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="pending" />
              <StatusBadge status="scheduled" />
              <StatusBadge status="completed" />
              <StatusBadge status="verified" />
            </Row>
          </Section>

          {/* ─── Cards ───────────────────────────────────────────────────────── */}
          <Section id="cards" title="Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Standard card with border and shadow</CardDescription>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Card body content goes here.</p></CardContent>
                <CardFooter><Button size="sm">Action</Button></CardFooter>
              </Card>

              <Card variant="service" padding="none">
                <CardContent className="p-8">
                  <Stethoscope className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="mb-2">Service Card</CardTitle>
                  <CardDescription>Large rounded, hover lifts</CardDescription>
                </CardContent>
              </Card>

              <Card variant="product" padding="none">
                <div className="h-40 bg-surface flex items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardContent className="p-4">
                  <CardTitle className="text-base mb-1">Product Card</CardTitle>
                  <p className="text-sm font-semibold text-primary">₹29.99</p>
                </CardContent>
              </Card>

              <Card variant="dashboard">
                <CardHeader>
                  <CardTitle>Dashboard Card</CardTitle>
                  <CardDescription>Admin/professional card style</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="interactive">
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Hover to see border highlight</CardDescription>
                </CardHeader>
              </Card>

              <Card variant="compact">
                <p className="text-sm font-medium">Compact Card</p>
                <p className="text-xs text-muted-foreground">Dense, tight padding</p>
              </Card>
            </div>

            <SectionHeader title="Stat Cards" className="mt-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Users" value="1,234" trend={{ value: 12, label: "this month" }} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Active Bookings" value="89" trend={{ value: -3, label: "vs last week" }} icon={<Star className="h-5 w-5" />} />
              <StatCard title="Products" value="456" description="12 low stock" icon={<ShoppingBag className="h-5 w-5" />} />
              <StatCard title="Revenue" value="₹12,890" trend={{ value: 8.4, label: "this quarter" }} loading={false} />
            </div>
          </Section>

          {/* ─── Inputs ──────────────────────────────────────────────────────── */}
          <Section id="inputs" title="Form Inputs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <Input label="Default Input" placeholder="Enter text..." id="ds-input-default" />
              <Input label="With Hint" placeholder="you@example.com" hint="We'll never share your email." id="ds-input-hint" />
              <Input label="With Error" placeholder="Username" error="This username is taken" id="ds-input-error" />
              <Input label="Disabled" placeholder="Can't edit this" disabled id="ds-input-disabled" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="ds-switch"
                  checked={switchChecked}
                  onCheckedChange={setSwitchChecked}
                  aria-label="Toggle notifications"
                />
                <label htmlFor="ds-switch" className="text-sm font-medium cursor-pointer">
                  Switch {switchChecked ? "(On)" : "(Off)"}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ds-checkbox"
                  checked={checkboxChecked}
                  onCheckedChange={(c) => setCheckboxChecked(c === true)}
                />
                <label htmlFor="ds-checkbox" className="text-sm font-medium cursor-pointer">
                  Checkbox {checkboxChecked ? "(Checked)" : "(Unchecked)"}
                </label>
              </div>
            </div>
          </Section>

          {/* ─── Tabs ────────────────────────────────────────────────────────── */}
          <Section id="tabs" title="Tabs">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <Card><CardContent><p className="text-sm text-muted-foreground">Overview tab content</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <Card><CardContent><p className="text-sm text-muted-foreground">Analytics tab content</p></CardContent></Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <Card><CardContent><p className="text-sm text-muted-foreground">Settings tab content</p></CardContent></Card>
              </TabsContent>
            </Tabs>
          </Section>

          {/* ─── Accordion ───────────────────────────────────────────────────── */}
          <Section id="accordion" title="Accordion">
            <div className="max-w-2xl">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>What services does PawConnect offer?</AccordionTrigger>
                  <AccordionContent>
                    PawConnect offers veterinary consultations, pet grooming, training sessions, and an in-house pet product shop.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I book an appointment?</AccordionTrigger>
                  <AccordionContent>
                    Simply browse available veterinarians or service providers, select a time slot, and confirm your booking. You&apos;ll need to be logged in.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is there a cancellation policy?</AccordionTrigger>
                  <AccordionContent>
                    Yes. You can cancel up to 24 hours before your appointment for a full refund.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </Section>

          {/* ─── Tables ──────────────────────────────────────────────────────── */}
          <Section id="tables" title="Tables">
            <FilterBar
              searchPlaceholder="Search pets..."
              activeFilters={[{ key: "species", label: "Species", value: "Dog", displayValue: "Dog" }]}
              onRemoveFilter={() => {}}
              onClearAll={() => {}}
            />
            <div className="mt-3">
              <DataTable
                columns={DEMO_TABLE_COLUMNS}
                data={DEMO_TABLE_DATA}
                getRowKey={(row) => row.id}
              />
            </div>
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                  <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationNext href="#" /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </Section>

          {/* ─── Skeletons & Spinners ─────────────────────────────────────────── */}
          <Section id="skeletons" title="PawConnect Loading System (3 Variants)">
            <div className="space-y-6">
              {/* Variant 1: Branded Pet Character Loading Screen */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Variant 1: Full-Page / Major Segment Pet Animation
                </span>
                <div className="rounded-3xl border border-border overflow-hidden bg-card shadow-sm">
                  <PetLoadingScreen
                    fullScreen={false}
                    message="Fetching the best care for your furry friends..."
                  />
                </div>
              </div>

              {/* Variant 2: Compact Paw Spinners & Refresh Indicators */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Variant 2: Compact Paw Spinner & Refresh Indicator
                </span>
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sizes:</span>
                    <PawSpinner size="xs" />
                    <PawSpinner size="sm" />
                    <PawSpinner size="md" />
                    <PawSpinner size="lg" />
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Variants:</span>
                    <PawSpinner size="sm" variant="pulse" />
                    <PawSpinner size="sm" variant="spin" />
                    <PawSpinner size="sm" variant="bounce" />
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <RefreshIndicator isRefreshing={true} label="Live Background Sync" />
                  <Button pawLoading={true} size="sm" className="rounded-full">
                    Saving Profile...
                  </Button>
                </div>
              </div>

              {/* Variant 3: Skeleton Placeholders */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Variant 3: Composite Skeletons (Cards & Tables)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardSkeleton />
                  <TableSkeleton rows={3} cols={4} />
                </div>
              </div>
            </div>
          </Section>

          {/* ─── States ──────────────────────────────────────────────────────── */}
          <Section id="states" title="Data States">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <EmptyState
                  title="No pets yet"
                  description="Add your first pet to get started."
                  icon={<PawPrint className="h-8 w-8" />}
                  action={<Button size="sm">Add Pet</Button>}
                />
              </Card>
              <Card>
                <LoadingState variant="cards" count={2} columns={2} />
              </Card>
              <Card>
                <ErrorState
                  title="Failed to load"
                  description="Could not fetch data. Check your connection."
                  action={<Button size="sm" variant="outline">Retry</Button>}
                />
              </Card>
            </div>
          </Section>

          {/* ─── Dialogs ─────────────────────────────────────────────────────── */}
          <Section id="dialogs" title="Dialogs, Modals & Drawers">
            <Row wrap>
              <Button onClick={() => setConfirmOpen(true)}>Open Confirm Dialog</Button>
              <Button variant="outline" onClick={() => setFormModalOpen(true)}>Open Form Modal</Button>
              <Button variant="secondary" onClick={() => setFormDrawerOpen(true)}>Open Form Drawer</Button>
              <Button variant="ghost" onClick={openLogin}>Open Auth — Login</Button>
              <Button variant="ghost" onClick={openRegister}>Open Auth — Register</Button>
            </Row>

            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete this item?"
              description="This action cannot be undone. The item will be permanently deleted."
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={() => { setConfirmOpen(false); toast.success("Item deleted"); }}
            />

            <FormModal
              open={formModalOpen}
              onOpenChange={setFormModalOpen}
              title="Add New Pet"
              description="Fill in the details to add a pet to your account."
              onSubmit={() => { setFormModalOpen(false); toast.success("Pet added!"); }}
              submitLabel="Add Pet"
            >
              <div className="space-y-3">
                <Input label="Pet name" placeholder="e.g. Buddy" id="ds-pet-name" />
                <Input label="Species" placeholder="e.g. Dog" id="ds-species" />
                <Input label="Breed" placeholder="e.g. Labrador" id="ds-breed" />
              </div>
            </FormModal>

            <FormDrawer
              open={formDrawerOpen}
              onOpenChange={setFormDrawerOpen}
              title="Edit Pet Details"
              description="Update the information for your pet."
              onSubmit={() => { setFormDrawerOpen(false); toast.success("Changes saved!"); }}
              submitLabel="Save Changes"
            >
              <div className="space-y-3">
                <Input label="Pet name" placeholder="Buddy" id="ds-drawer-name" />
                <Input label="Age (years)" placeholder="2" id="ds-drawer-age" type="number" />
              </div>
            </FormDrawer>
          </Section>

          {/* ─── Navigation ──────────────────────────────────────────────────── */}
          <Section id="navigation" title="Navigation">
            <SectionHeader title="Breadcrumbs" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/admin">Admin</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Products</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <SectionHeader title="Page Header" className="mt-6" />
            <PageHeader title="All Pets" description="Manage pets across the platform.">
              <Button size="sm">Add Pet</Button>
              <Button size="sm" variant="outline">Export</Button>
            </PageHeader>
          </Section>

          {/* ─── Layouts ─────────────────────────────────────────────────────── */}
          <Section id="layouts" title="Layout Previews">
            <p className="text-sm text-muted-foreground mb-3">
              Layout shells are rendered in their respective route groups:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                { name: "Public", path: "(public)/layout.tsx", desc: "PublicHeader + PublicFooter" },
                { name: "Customer", path: "(customer)/layout.tsx", desc: "CustomerTopbar only" },
                { name: "Admin", path: "(admin)/layout.tsx", desc: "AdminSidebar + Topbar" },
              ].map((l) => (
                <Card key={l.name} variant="compact">
                  <p className="font-semibold text-foreground">{l.name} Layout</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{l.path}</p>
                  <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                </Card>
              ))}
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
