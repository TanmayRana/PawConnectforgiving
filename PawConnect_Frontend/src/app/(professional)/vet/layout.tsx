"use client";

import React from "react";
import { ProfessionalSidebar } from "@/components/professional/professional-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

import { RoleGuard } from "@/components/shared/role-guard";

export default function VetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <ProfessionalSidebar role="vet" />
      <div
        className={cn(
          "transition-[padding] duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          isSidebarCollapsed ? "md:pl-16" : "md:pl-56"
        )}
      >
        <Topbar />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <RoleGuard allowedRoles={["VETERINARIAN", "ADMIN"]}>
            {children}
          </RoleGuard>
        </main>
      </div>
    </div>
  );
}
