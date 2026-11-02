"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ProductCard } from "@/components/shared/product-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, ErrorState } from "@/components/shared/states";
import { FadeInView, StaggerView, StaggerItem } from "@/lib/animations/motion-components";
import { toast } from "@/lib/utils/toast";
import { Filter, PackageCheck } from "lucide-react";
import { useProducts, type EnrichedProductItem, type ProductItem } from "@/lib/api/hooks";
import { RefreshIndicator } from "@/components/ui/paw-spinner";

interface ShopClientProps {
  initialProducts?: EnrichedProductItem[];
}

const CATEGORIES = [
  "All Categories",
  "Pet Food",
  "Toys",
  "Accessories",
  "Grooming Products",
] as const;

export function ShopClient({ initialProducts }: ShopClientProps = {}) {
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All Categories");
  const [selectedPetType, setSelectedPetType] = React.useState<"all" | "dog" | "cat">("all");

  const {
    data: products = initialProducts || [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useProducts();

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Categories" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const featured = products.filter((p) => p.featured);

  return (
    <div className="space-y-12">
      {/* ─── Search & Category Filters ─────────────────────────────────────── */}
      <FadeInView aboveTheFold className="rounded-[32px] border border-border/70 bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-12 md:items-center">
          <div className="md:col-span-8">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search organic kibble, durable toys, orthopedic beds, shampoos..."
              className="w-full"
            />
          </div>

          {/* Pet type selector */}
          <div className="flex items-center gap-2 md:col-span-4 md:justify-end">
            <span className="text-xs text-muted-foreground mr-1">Filter by pet:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface border border-border/60">
              {(["all", "dog", "cat"] as const).map((type) => {
                const isActive = selectedPetType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedPetType(type)}
                    className={`relative rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                      isActive ? "text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={shouldReduceMotion ? undefined : "active-pet-type"}
                        className="absolute inset-0 rounded-full bg-foreground"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{type === "all" ? "All Pets" : type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Chips with Animated Pill Indicator */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Category:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground bg-surface hover:bg-muted"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId={shouldReduceMotion ? undefined : "active-shop-category"}
                      className="absolute inset-0 rounded-full bg-primary shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>

          {(searchQuery || selectedCategory !== "All Categories" || selectedPetType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
                setSelectedPetType("all");
              }}
              className="text-xs text-muted-foreground ml-auto"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </FadeInView>

      {/* ─── In-House Quality Assurance Banner ───────────────────────────────── */}
      <FadeInView delay={0.05} className="rounded-[28px] border border-cream-border bg-cream/50 p-4.5 px-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-foreground">
              Direct PawConnect In-House Supply
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              — 100% genuine ingredients, guaranteed freshness, no unverified third-party sellers.
            </span>
          </div>
          <Badge variant="cream" size="sm" className="shrink-0">
            30-Day Happiness Guarantee
          </Badge>
        </div>
      </FadeInView>

      {/* ─── Product Catalog Grid ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory === "All Categories" ? "All Products" : selectedCategory} ({filteredProducts.length})
            </h2>
            <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing catalog..." />
          </div>
          <span className="text-xs text-muted-foreground">
            Fast dispatch from PawConnect Fulfillment Center
          </span>
        </div>

        {isLoading ? (
          <div className="py-6">
            <LoadingState variant="product-cards" count={8} columns={4} />
          </div>
        ) : isError ? (
          <div className="rounded-[32px] border border-border/70 bg-white p-12 dark:bg-card">
            <ErrorState
              title="Unable to load product shop"
              description="Failed to connect to the central product catalog."
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No products match your selection"
            description="Try adjusting your search terms or select another category filter to explore in-house supplies."
            action={
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedPetType("all");
                }}
                className="rounded-full shadow-sm"
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <StaggerView key={`${selectedCategory}-${selectedPetType}`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        )}
      </div>

      {/* ─── Featured Highlights Section ────────────────────────────────────── */}
      {selectedCategory === "All Categories" && !searchQuery && (
        <FadeInView className="space-y-6 border-t border-border pt-12">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">PawConnect Favorites</span>
              <h2 className="text-2xl font-bold text-foreground">Best Sellers & Recommended Essentials</h2>
            </div>
          </div>

          <StaggerView className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((product) => (
              <StaggerItem key={`featured-${product.id}`}>
                <ProductCard
                  product={product}
                />
              </StaggerItem>
            ))}
          </StaggerView>
        </FadeInView>
      )}
    </div>
  );
}

