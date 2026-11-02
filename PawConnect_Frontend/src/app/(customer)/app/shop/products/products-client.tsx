"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { ProductFilters, type ProductFilterState } from "@/components/shop/product-filters";
import { ProductGrid } from "@/components/shop/product-grid";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import type { ProductItem } from "@/lib/mock/data";

const CATEGORIES = [
  "all",
  "Pet Food",
  "Toys",
  "Accessories",
  "Grooming Products",
];

const PET_TYPES = ["all", "Dogs", "Cats"];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low → High", value: "price-low" },
  { label: "Price: High → Low", value: "price-high" },
  { label: "Top Rated", value: "rating" },
  { label: "Newest Arrivals", value: "newest" },
];

export function ProductsClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "featured";

  const [filters, setFilters] = useState<ProductFilterState>({
    search: initialQuery,
    category: initialCategory,
    petType: "all",
    sortBy: initialSort,
    inStockOnly: false,
  });

  const { data: products = [], isLoading, isError, refetch } = useProducts();

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // Category
    if (filters.category !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Pet Type
    if (filters.petType !== "all") {
      const target = filters.petType.toLowerCase();
      result = result.filter((p) => {
        const pType = (p.petType || "").toLowerCase();
        return pType.includes(target) || pType.includes("all");
      });
    }

    // In Stock Only
    if (filters.inStockOnly) {
      result = result.filter(
        (p) =>
          p.stockStatus === "in-stock" ||
          p.stockStatus === "low-stock" ||
          (p.stock !== undefined && p.stock > 0)
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return b.id.localeCompare(a.id);
        case "featured":
        default:
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
      }
    });

    return result;
  }, [products, filters]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        title="PawConnect Catalog"
        description="Authentic pet nutrition, playtime enrichment, comfort beds, and grooming care. 100% In-house guaranteed."
      />

      {/* Filters Bar & Mobile Sheet */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <ProductFilters
          filters={filters}
          onFilterChange={setFilters}
          categories={CATEGORIES}
          petTypes={PET_TYPES}
          sortOptions={SORT_OPTIONS}
          totalResults={filteredProducts.length}
        />
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <LoadingState variant="cards" count={8} columns={4} />
      ) : isError ? (
        <ErrorState
          title="Failed to load catalog"
          description="We encountered an issue retrieving the products list. Please try again."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Try Again
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>

          <ProductGrid
            products={filteredProducts}
            emptyTitle="No matching products"
            emptyDescription="No in-house items match your active filters. Try clearing some filters or searching with a different term."
          />
        </div>
      )}
    </div>
  );
}
