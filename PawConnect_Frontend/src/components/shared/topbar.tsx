"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { UserMenu } from "@/components/shared/user-menu";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface TopbarProps {
  title?: string;
  className?: string;
}

function usePathBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return [];

  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));
}

export function Topbar({ title, className }: TopbarProps) {
  const { toggleMobileNav } = useUIStore();
  const crumbs = usePathBreadcrumbs();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-md shadow-2xs px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-1 rounded-lg hover:bg-muted transition-colors"
        onClick={toggleMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs or title */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        ) : (
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {i === crumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {i < crumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationDropdown />
        <UserMenu />
      </div>
    </header>
  );
}
