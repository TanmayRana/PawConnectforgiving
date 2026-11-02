"use client";

import React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      <AdminSidebar />
      <div
        className={cn(
          "transition-[padding] duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none flex flex-col min-h-screen",
          isSidebarCollapsed ? "md:pl-16" : "md:pl-56"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
          <RoleGuard allowedRoles={["ADMIN"]}>{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
