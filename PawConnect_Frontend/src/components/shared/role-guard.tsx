"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useAuthModal } from "@/stores/auth-modal.store";
import { type UserRole, hasRole } from "@/lib/api/auth";
import { getStoredAccessToken, USER_STORAGE_KEY } from "@/lib/api/client";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, initialized, isLoading } = useAuthStore();
  const { openLogin } = useAuthModal();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (initialized && !isLoading && !isAuthenticated) {
      openLogin();
    }
  }, [initialized, isLoading, isAuthenticated, openLogin]);

  // Check cached user in store or localStorage only after mount
  const hasToken = mounted ? Boolean(getStoredAccessToken()) : false;
  const hasCachedUser =
    Boolean(user) ||
    (mounted && Boolean(localStorage.getItem(USER_STORAGE_KEY)));

  // Show a blocking loader only when mounted, there is no cached user AND a token exists
  const showBlockingLoader =
    mounted && ((!hasCachedUser && hasToken) || (isLoading && !hasCachedUser));

  if (showBlockingLoader) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying access...</p>
      </div>
    );
  }

  // Not authenticated & no token
  if (mounted && !hasCachedUser && !hasToken) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Authentication Required</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Please sign in to access your PawConnect portal and manage your account.
          </p>
        </div>
        <Button onClick={openLogin}>Sign In</Button>
      </div>
    );
  }

  if (user && allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((role) => hasRole(user, role));
    if (!isAllowed) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Access Restricted</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              You do not have the required permissions to view this section.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
