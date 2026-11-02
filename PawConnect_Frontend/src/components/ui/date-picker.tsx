"use client";

import * as React from "react";
import { format, parseISO, isValid, isBefore, isAfter, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, X, CalendarDays } from "lucide-react";
import { cn } from "cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export interface DatePickerProps {
  value?: string | Date | null;
  onChange?: (dateString: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  allowClear?: boolean;
  fromYear?: number;
  toYear?: number;
  captionLayout?: "label" | "dropdown";
}

function parseDateProp(val?: string | Date | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isValid(val) ? val : undefined;
  }
  try {
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : undefined;
  } catch {
    const fallback = new Date(val);
    return isValid(fallback) ? fallback : undefined;
  }
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date...",
  minDate,
  maxDate,
  disabled = false,
  required = false,
  error,
  helperText,
  className,
  allowClear = true,
  fromYear = 1990,
  toYear = new Date().getFullYear() + 5,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => parseDateProp(value), [value]);
  const minDateObj = React.useMemo(() => parseDateProp(minDate), [minDate]);
  const maxDateObj = React.useMemo(() => parseDateProp(maxDate), [maxDate]);

  const handleSelectDate = (date?: Date) => {
    if (!date) {
      if (allowClear) {
        onChange?.("");
      }
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    onChange?.(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleQuickToday = () => {
    const today = new Date();
    if (maxDateObj && isAfter(startOfDay(today), startOfDay(maxDateObj))) {
      return;
    }
    if (minDateObj && isBefore(startOfDay(today), startOfDay(minDateObj))) {
      return;
    }
    const todayStr = format(today, "yyyy-MM-dd");
    onChange?.(todayStr);
    setOpen(false);
  };

  const isDayDisabled = (date: Date) => {
    const current = startOfDay(date);
    if (minDateObj && isBefore(current, startOfDay(minDateObj))) {
      return true;
    }
    if (maxDateObj && isAfter(current, startOfDay(maxDateObj))) {
      return true;
    }
    return false;
  };

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label className="text-xs font-medium text-foreground block">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={cn(
            "group relative flex w-full items-center justify-between rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left",
            error
              ? "border-destructive text-destructive focus-visible:ring-destructive"
              : "hover:border-primary/50 text-foreground",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                selectedDate
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="truncate font-normal">
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {allowClear && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Clear date"
                aria-label="Clear date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="p-3 w-auto bg-card border border-border shadow-2xl rounded-3xl"
        >
          <div className="space-y-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={isDayDisabled}
              captionLayout={captionLayout}
              startMonth={new Date(fromYear, 0)}
              endMonth={new Date(toYear, 11)}
              defaultMonth={selectedDate || maxDateObj || new Date()}
              className="rounded-2xl"
            />

            <div className="flex items-center justify-between border-t border-border/70 pt-2 px-1 text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleQuickToday}
                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary-soft rounded-lg px-2.5"
              >
                Today
              </Button>
              {allowClear && selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive rounded-lg px-2.5"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="text-xs text-destructive font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
