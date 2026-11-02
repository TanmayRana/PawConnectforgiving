import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  label,
  value,
  description,
  icon,
  trend,
  className,
  loading = false,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  if (loading) {
    return (
      <Card variant="stat" className={cn("p-4 sm:p-5 lg:p-6", className)}>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 sm:h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  return (
    <Card variant="stat" className={cn("relative p-3.5 sm:p-4.5 lg:p-5.5", className)}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title ?? label}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground truncate tracking-tight">{value}</p>
          {description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] sm:text-xs font-medium",
                isPositive ? "text-green-600" : "text-destructive"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">
                {isPositive ? "+" : ""}
                {trend.value}%{trend.label && ` ${trend.label}`}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
