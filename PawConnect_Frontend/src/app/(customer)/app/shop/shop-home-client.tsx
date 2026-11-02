"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProducts } from "@/lib/api/hooks";
import { useGlobalCart } from "@/providers/CartProvider";
import { ProductCard } from "@/components/shared/product-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  HeartHandshake,
  ArrowRight,
  Utensils,
  Gamepad2,
  Gem,
  Scissors,
} from "lucide-react";
import type { ProductItem } from "@/lib/mock/data";

const CATEGORY_ITEMS = [
  {
    name: "Pet Food",
    description: "Veterinarian-formulated whole nutrition",
    icon: Utensils,
    href: "/app/shop/products?category=Pet+Food",
    color: "bg-cream text-foreground border-cream-border",
    itemCount: "Healthy Kibble & Wet Meals",
  },
  {
    name: "Toys",
    description: "Mental enrichment & resilient play",
    icon: Gamepad2,
    href: "/app/shop/products?category=Toys",
    color: "bg-blue-soft text-foreground border-blue-border",
    itemCount: "Puzzles & Chew Toys",
  },
  {
    name: "Accessories",
    description: "Orthopedic comfort, harnesses & leashes",
    icon: Gem,
    href: "/app/shop/products?category=Accessories",
    color: "bg-primary-soft text-foreground border-primary-border",
    itemCount: "Beds, Bowls & Collars",
  },
  {
    name: "Grooming Products",
    description: "Hypoallergenic coat & dermal care",
    icon: Scissors,
    href: "/app/shop/products?category=Grooming+Products",
    color: "bg-secondary text-foreground border-border",
    itemCount: "Shampoos & Brushes",
  },
];

export function ShopHomeClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading } = useProducts();
  const { cartCount } = useGlobalCart();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/app/shop/products?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/app/shop/products");
    }
  };

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const popularProducts = products
    .filter((p) => p.rating >= 4.8 && !p.featured)
    .slice(0, 4);
  const trendingProducts = products.slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* SHOP HERO */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-cream/60 via-primary-soft/30 to-blue-soft/40 border border-border/70 p-6 sm:p-10 lg:p-12 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-card/80 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm shadow-xs border border-border/40">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>100% In-House Direct Fulfillment • Zero 3rd-Party Vendors</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Everything your pet needs,{" "}
              <span className="text-primary italic font-serif">from PawConnect.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Curated, certified, and quality-tested directly by our licensed veterinary team.
              Shipped fresh to your door with guaranteed freshness and safety.
            </p>
          </div>

          {/* Quick Search & Cart Nav */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 max-w-xl"
          >
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search premium food, toys, beds, brushes..."
              />
            </div>
            <Button
              type="submit"
              className="rounded-2xl h-11 px-6 font-semibold shadow-xs"
            >
              Search Shop
            </Button>
          </form>

          {/* Quick Stats / Highlights */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Veterinary Inspected</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>Free Delivery over ₹500</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              <span>Hassle-Free 30-Day Returns</span>
            </div>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </section>

      {/* CATEGORIES SECTION */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Find exactly what your fur family needs across all categories.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="font-semibold text-primary hover:text-primary gap-1.5"
          >
            <Link href="/app/shop/products">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative overflow-hidden rounded-[24px] border border-border/70 bg-card p-6 transition-[transform,box-shadow,border-color] duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 hover:will-change-transform motion-reduce:transition-none flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 border ${cat.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{cat.itemCount}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED IN-HOUSE PRODUCTS */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Veterinarian Recommended</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Essentials
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              PawConnect bestsellers loved by dogs and cats nationwide.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-medium gap-1 text-xs"
          >
            <Link href="/app/shop/products">
              Browse All ({products.length})
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-[28px] bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-[28px] border border-border/70 bg-card p-8 text-center text-xs text-muted-foreground">
            No featured essentials currently in stock. Check back soon for fresh arrivals.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                href={`/app/shop/products/${prod.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* TRUST BANNER — GUARANTEED IN-HOUSE */}
      <section className="rounded-[32px] bg-secondary/50 border border-border/70 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <HeartHandshake className="h-4 w-4" />
            <span>The PawConnect In-House Promise</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">
            No Third-Party Sellers. Guaranteed Authenticity.
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every product in our store is selected, inspected, and shipped directly from our certified climate-controlled fulfillment hub. Zero knock-offs, zero unauthorized vendor listings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Button asChild size="lg" className="rounded-2xl font-semibold shadow-xs">
            <Link href="/app/shop/products">
              Explore Catalog
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-2xl font-semibold">
            <Link href="/app/shop/cart">
              <ShoppingBag className="h-4 w-4 mr-2" />
              View Cart ({cartCount})
            </Link>
          </Button>
        </div>
      </section>

      {/* POPULAR / HIGHLY RATED PRODUCTS */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Top Customer Favorites
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consistently rated 4.8 stars or higher by verified pet parents.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-medium gap-1 text-xs"
          >
            <Link href="/app/shop/products?sort=rating">
              View Highest Rated
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-[28px] bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (popularProducts.length > 0 ? popularProducts : trendingProducts).length === 0 ? (
          <div className="rounded-[28px] border border-border/70 bg-card p-8 text-center text-xs text-muted-foreground">
            No products available in this section yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(popularProducts.length > 0 ? popularProducts : trendingProducts).map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                href={`/app/shop/products/${prod.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
