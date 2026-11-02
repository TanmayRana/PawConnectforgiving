"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/shared/search-bar";
import { SortAsc, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterOption {
  label: string;
  value: string;
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: string) => void;
  onClearAll?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = "Search...",
  onSearch,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          placeholder={searchPlaceholder}
          onSearch={onSearch}
          className="flex-1"
        />
        {children && (
          <div className="flex items-center gap-2 shrink-0">{children}</div>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="text-muted-foreground">{filter.label}:</span>
              {filter.displayValue}
              {onRemoveFilter && (
                <button
                  className="ml-1 hover:text-foreground transition-colors"
                  onClick={() => onRemoveFilter(filter.key)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {onClearAll && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={onClearAll}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SortSelect ───────────────────────────────────────────────────────────────

interface SortSelectProps {
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SortSelect({
  options,
  value,
  onChange,
  className,
}: SortSelectProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SortAsc className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="text-sm border border-input rounded-full bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        aria-label="Sort by"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
