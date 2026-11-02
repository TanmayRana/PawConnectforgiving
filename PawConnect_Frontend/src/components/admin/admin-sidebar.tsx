"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PawPrint,
  LayoutDashboard,
  Users,
  Stethoscope,
  Briefcase,
  CalendarDays,
  ShoppingBag,
  FolderOpen,
  ShoppingCart,
  CreditCard,
  Star,
  BarChart3,
  Bell,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { Tooltip } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/shared/brand-logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Veterinarians", href: "/admin/veterinarians", icon: Stethoscope },
  { label: "Service Providers", href: "/admin/service-providers", icon: Briefcase },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Promo Codes", href: "/admin/promo-codes", icon: Ticket },
  { label: "Payments & Ledger", href: "/admin/payments", icon: CreditCard },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileNavOpen, closeMobileNav } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-sidebar transition-[width] duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none overflow-hidden",
          isSidebarCollapsed ? "w-16" : "w-56"
        )}
        aria-label="Admin navigation"
      >
        {/* Brand Logo with entrance */}
        <div className="flex h-14 items-center border-b border-border px-3 shrink-0 overflow-hidden whitespace-nowrap">
          {isSidebarCollapsed ? (
            <div className="flex w-full items-center justify-center">
              <BrandLogo variant="icon" animate={true} href="/admin" />
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <BrandLogo variant="compact" animate={true} href="/admin" />
              <span className="text-[9px] text-primary font-bold uppercase tracking-wider pl-0.5 pt-0.5 truncate leading-none">
                Platform Admin
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 overflow-x-hidden">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return isSidebarCollapsed ? (
              <Tooltip key={item.href} content={item.label} side="right">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-xl transition-colors overflow-hidden whitespace-nowrap",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-2xs"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </Tooltip>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-medium transition-colors overflow-hidden whitespace-nowrap",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-2xs"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border p-2 overflow-hidden">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-full items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors overflow-hidden whitespace-nowrap"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium overflow-hidden whitespace-nowrap">
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Collapse Navigation</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isMobileNavOpen} onOpenChange={(open) => !open && closeMobileNav()}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-border">
          <SheetHeader className="h-16 px-4 border-b border-border flex flex-row items-center justify-between text-left">
            <div className="flex flex-col min-w-0">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <BrandLogo variant="default" animate={true} href="/admin" />
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider pl-0.5 pt-0.5">
                Admin Portal
              </span>
            </div>
          </SheetHeader>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileNav}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-2xs"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
