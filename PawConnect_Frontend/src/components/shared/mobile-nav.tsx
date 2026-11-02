"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthModal } from "@/stores/auth-modal.store";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: { label: string; href: string }[];
  showAuthButtons?: boolean;
}

export function MobileNav({
  isOpen,
  onClose,
  navigation,
  showAuthButtons = false,
}: MobileNavProps) {
  const { openLogin, openRegister } = useAuthModal();

  const handleLogin = () => {
    onClose();
    openLogin();
  };

  const handleRegister = () => {
    onClose();
    openRegister();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <BrandLogo variant="compact" animate={false} />
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>
        <nav className="p-4 space-y-1" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center px-3 py-3 text-base font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {showAuthButtons && (
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={handleLogin}>
                Login
              </Button>
              <Button className="w-full" onClick={handleRegister}>
                Sign Up
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}