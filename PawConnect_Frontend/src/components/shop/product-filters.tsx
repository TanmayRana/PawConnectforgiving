"use client";

import React from "react";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductFilterState {
  search: string;
  category: string;
  petType: string;
  sortBy: string;
  inStockOnly: boolean;
}

interface ProductFiltersProps {
  filters: ProductFilterState;
  onFilterChange: (next: ProductFilterState) => void;
  categories: string[];
  petTypes: string[];
  sortOptions: { label: string; value: string }[];
  totalResults: number;
}

export function ProductFilters({
  filters,
  onFilterChange,
  categories,
  petTypes,
  sortOptions,
  totalResults,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const updateFilter = <K extends keyof ProductFilterState>(
    key: K,
    val: ProductFilterState[K]
  ) => {
    onFilterChange({
      ...filters,
      [key]: val,
    });
  };

  const handleReset = () => {
    onFilterChange({
      search: "",
      category: "all",
      petType: "all",
      sortBy: "featured",
      inStockOnly: false,
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.petType !== "all" ||
    filters.inStockOnly;

  return (
    <div className="space-y-4">
      {/* Top Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={filters.search}
            onChange={(val) => updateFilter("search", val)}
            placeholder="Search food, toys, beds, brushes..."
          />
        </div>

        <div className="flex items-center gap-2.5 justify-between sm:justify-end">
          {/* Mobile Filter Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 h-10 text-xs font-medium text-foreground hover:bg-secondary">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  Active
                </Badge>
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-6 py-6">
              <SheetHeader className="text-left pb-4 border-b border-border">
                <SheetTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Filter Products</span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1 p-0 h-auto font-normal"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Pet Type Filter */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Pet Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {petTypes.map((type) => {
                      const isSelected = filters.petType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateFilter("petType", type)}
                          className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-surface border-border text-foreground hover:bg-secondary"
                          )}
                        >
                          {type === "all" ? "All Pets" : type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isSelected = filters.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updateFilter("category", cat)}
                          className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-surface border-border text-foreground hover:bg-secondary"
                          )}
                        >
                          {cat === "all" ? "All Categories" : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In Stock toggle */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    In Stock Only
                  </span>
                  <button
                    type="button"
                    onClick={() => updateFilter("inStockOnly", !filters.inStockOnly)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5",
                      filters.inStockOnly ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                        filters.inStockOnly ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <Button
                  className="w-full mt-4 rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  Show Results ({totalResults})
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground font-medium whitespace-nowrap">
              Sort by:
            </span>
            <Select
              value={filters.sortBy}
              onValueChange={(val) => updateFilter("sortBy", val)}
            >
              <SelectTrigger className="w-[160px] h-10 rounded-xl text-xs font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Quick Category & Pet Type Pills */}
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => updateFilter("category", cat)}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-medium transition-[color,background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-surface border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {cat === "all" ? "All" : cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              For:
            </span>
            {petTypes.map((type) => {
              const isSelected = filters.petType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFilter("petType", type)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-[color,background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-surface border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {type === "all" ? "All Pets" : type}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
