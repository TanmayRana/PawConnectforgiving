"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductQuantityProps {
  quantity: number;
  max: number;
  min?: number;
  onChange: (newQuantity: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function ProductQuantity({
  quantity,
  max,
  min = 1,
  onChange,
  size = "md",
  disabled = false,
  className,
}: ProductQuantityProps) {
  const [isThrottling, setIsThrottling] = React.useState(false);

  const handleDecrement = () => {
    if (quantity > min && !isThrottling && !disabled) {
      setIsThrottling(true);
      onChange(quantity - 1);
      setTimeout(() => setIsThrottling(false), 200);
    }
  };

  const handleIncrement = () => {
    if (quantity < max && !isThrottling && !disabled) {
      setIsThrottling(true);
      onChange(quantity + 1);
      setTimeout(() => setIsThrottling(false), 200);
    }
  };

  const isAtMin = quantity <= min || disabled || isThrottling;
  const isAtMax = quantity >= max || disabled || isThrottling;

  const btnSizeClass =
    size === "sm"
      ? "h-7 w-7"
      : size === "lg"
      ? "h-10 w-10"
      : "h-8 w-8";

  const textClass =
    size === "sm"
      ? "text-xs w-6"
      : size === "lg"
      ? "text-base w-10 font-bold"
      : "text-sm w-8 font-semibold";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border bg-surface/50 p-1 shadow-2xs backdrop-blur-xs",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isAtMin}
        className={cn(
          "flex items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-150 motion-reduce:transition-none hover:bg-muted/80 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
          btnSizeClass
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <span
        className={cn("text-center tabular-nums text-foreground select-none", textClass)}
        aria-live="polite"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={isAtMax}
        className={cn(
          "flex items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-150 motion-reduce:transition-none hover:bg-muted/80 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
          btnSizeClass
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
