"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { MobileNav } from "./mobile-nav";
import { Menu, ShoppingBag } from "lucide-react";
import { useAuthModal } from "@/stores/auth-modal.store";
import { useAuthStore } from "@/stores/auth.store";
import { useGlobalCart } from "@/providers/CartProvider";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated, primaryRole } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();
  const { cartCount } = useGlobalCart();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Pet Shop", href: "/shop" },
    { label: "About", href: "/about" },
    { label: "FAQs", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full py-3 transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
        isScrolled
          ? "border-b border-border/80 bg-background/90 shadow-xs backdrop-blur-md"
          : "border-b border-transparent bg-background/70 backdrop-blur-xs",
        className
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Brand Logo with entrance */}
        <BrandLogo variant="default" animate={true} />

        {/* Desktop Navigation Links with animated indicator */}
        <div
          className="hidden md:flex md:items-center md:gap-1 lg:gap-2"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const isHovered = hoveredNav === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHoveredNav(item.href)}
                className={cn(
                  "relative px-3.5 py-1.5 text-sm font-medium transition-colors rounded-full",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active / Hover Animated Background Pill */}
                {isActive && !shouldReduceMotion && (
                  <motion.span
                    layoutId="header-active-nav"
                    className="absolute inset-0 rounded-full bg-primary-soft/40 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {isHovered && !isActive && !shouldReduceMotion && (
                  <motion.span
                    layoutId="header-hover-nav"
                    className="absolute inset-0 rounded-full bg-surface -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Action Buttons & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shopping Cart Link */}
          <Link
            href="/app/shop/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/80 transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View shopping cart (${cartCount} items)`}
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {mounted && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground shadow-xs animate-in zoom-in-75 duration-200">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href={
                    primaryRole === "ADMIN"
                      ? "/admin"
                      : primaryRole === "VETERINARIAN"
                      ? "/vet"
                      : primaryRole === "SERVICE_PROVIDER"
                      ? "/provider"
                      : "/app"
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Dashboard
                </Link>
                <UserMenu />
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openLogin}
                  className="rounded-full px-4 text-xs font-semibold"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={openRegister}
                  className="rounded-full px-5 text-xs font-semibold shadow-xs"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
        showAuthButtons={true}
      />
    </header>
  );
}