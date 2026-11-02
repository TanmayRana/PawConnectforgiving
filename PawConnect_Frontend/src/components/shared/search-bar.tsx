"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  className?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center", className)}>
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          type="search"
          className="flex h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-muted-foreground/50"
          onChange={(e) => {
            onChange?.(e);
            onSearch?.(e.target.value);
          }}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
  className,
  defaultValue,
}: SearchBarProps) {
  return (
    <SearchInput
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange?.(e.target.value);
      }}
      onSearch={onSearch}
      defaultValue={defaultValue}
      aria-label={placeholder}
      className={className}
    />
  );
}
