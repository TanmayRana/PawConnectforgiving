"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { UserMenu } from "@/components/shared/user-menu";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Menu, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalCart } from "@/providers/CartProvider";

interface CustomerTopbarProps {
  className?: string;
}

const customerNav = [
  { label: "Home", href: "/app" },
  { label: "Services", href: "/app/services/veterinary" },
  { label: "Pet Shop", href: "/app/shop" },
  { label: "My Pets", href: "/app/pets" },
  { label: "My Bookings", href: "/app/bookings" },
  { label: "Orders", href: "/app/orders" },
  { label: "Profile", href: "/app/profile" },
];

export function CustomerTopbar({ className }: CustomerTopbarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { cartCount } = useGlobalCart();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
        isScrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
          : "border-b border-border/60 bg-background/90 backdrop-blur-sm",
        className
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
        aria-label="Customer navigation"
      >
        <BrandLogo variant="compact" animate={false} href="/app" className="flex items-center gap-2" />

        <div className="hidden lg:flex lg:items-center lg:gap-2 xl:gap-3">
          {customerNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname?.startsWith(`${item.href}`));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/shop/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/80 transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-75">
                {cartCount}
              </span>
            )}
          </Link>
          <NotificationDropdown />
          <div className="hidden sm:block">
            <UserMenu />
          </div>
          <button
            className="lg:hidden p-1.5 rounded-xl hover:bg-muted transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        navigation={customerNav}
        showAuthButtons={false}
      />
    </header>
  );
}
