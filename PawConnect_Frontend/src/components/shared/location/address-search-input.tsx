"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, MapPin, Building, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPlaces } from "./geocoding-service";
import type { SearchResultItem } from "./types";
import { cn } from "@/lib/utils";

interface AddressSearchInputProps {
  onSelectResult: (result: SearchResultItem) => void;
  placeholder?: string;
  className?: string;
}

export function AddressSearchInput({
  onSelectResult,
  placeholder = "Search street, landmark, area, or PIN code...",
  className,
}: AddressSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search logic (500ms debounce respecting Nominatim policy)
  useEffect(() => {
    const trimmed = query.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      try {
        const places = await searchPlaces(trimmed, abortCtrl.signal);
        setResults(places);
        setIsOpen(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to search location. Try clicking directly on the map.");
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setQuery(item.title);
    setIsOpen(false);
    onSelectResult(item);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-10 pr-16 h-10.5 rounded-2xl bg-surface/90 border-border/80 focus-visible:ring-primary text-xs sm:text-sm shadow-xs"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="h-5 w-5 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-border/40 animate-in fade-in-50 zoom-in-95 duration-150">
          {error ? (
            <div className="p-3.5 text-xs text-destructive flex items-start gap-2 bg-destructive/5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lookup notice</p>
                <p className="text-[11px] text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground space-y-1">
              <MapPin className="h-4 w-4 mx-auto text-muted-foreground/60 mb-1" />
              <p className="font-medium text-foreground">No matching locations found</p>
              <p className="text-[11px]">Try searching by city, district, or drag the map pin directly.</p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-left hover:bg-secondary/70 flex items-start gap-3 transition-colors duration-100 group"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.type === "building" || item.type === "house" ? (
                    <Building className="h-3.5 w-3.5" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
