"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, PawPrint, Shield, Stethoscope, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { showSuccess } from "@/lib/utils/toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu() {
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, primaryRole, logout } = useAuthStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    showSuccess("Signed Out", "You have been securely signed out.");
    router.push("/");
  };

  const currentUser = mounted ? user : null;
  const currentRole = mounted ? primaryRole : null;

  const displayName = currentUser
    ? currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "My Account";
  const displayEmail = currentUser?.email || "Signed in";
  const avatarUrl =
    currentUser?.profileImage ||
    ((currentUser as Record<string, unknown> | null)?.avatar as string | undefined) ||
    ((currentUser as Record<string, unknown> | null)?.profileImageUrl as string | undefined);

  return (
    <div ref={ref} className="relative">
      <button
        className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {currentUser?.firstName ? currentUser.firstName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-popover shadow-lg z-50 py-1">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar className="h-10 w-10 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {currentUser?.firstName ? currentUser.firstName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              {currentRole && (
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {currentRole.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            {currentRole === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Admin Console
              </Link>
            )}

            {currentRole === "VETERINARIAN" && (
              <Link
                href="/vet"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Stethoscope className="h-4 w-4" />
                Veterinary Portal
              </Link>
            )}

            {currentRole === "SERVICE_PROVIDER" && (
              <Link
                href="/provider"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Specialist Portal
              </Link>
            )}

            <Link
              href="/app/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile & Addresses
            </Link>
            <Link
              href="/app/pets"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <PawPrint className="h-4 w-4" />
              My Pets
            </Link>
            <Link
              href="/app/bookings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              My Bookings
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
