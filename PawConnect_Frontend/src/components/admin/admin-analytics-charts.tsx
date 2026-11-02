"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/money";
import { TrendingUp, PieChart, Activity, ShoppingCart } from "lucide-react";
import type { AdminAnalyticsSummary } from "@/lib/api/admin";

interface AdminAnalyticsChartsProps {
  analytics: AdminAnalyticsSummary;
}

export function AdminAnalyticsCharts({ analytics }: AdminAnalyticsChartsProps) {
  const { bookingDistribution, orderStatusCounts, revenueTrend } = analytics;

  const totalBookings =
    bookingDistribution.veterinary +
    bookingDistribution.grooming +
    bookingDistribution.training || 1;

  const vetPct = Math.round((bookingDistribution.veterinary / totalBookings) * 100);
  const grmPct = Math.round((bookingDistribution.grooming / totalBookings) * 100);
  const trnPct = 100 - vetPct - grmPct;

  const maxRevenue = Math.max(...revenueTrend.map((r) => r.amount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* Revenue Trend SVG Chart */}
      <Card className="lg:col-span-7 rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold text-foreground">Revenue Trajectory (6 Months)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              In-house pet shop and clinical consultation receipts.
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold w-fit">
            +28% MoM
          </Badge>
        </div>

        {/* Bar / Column Chart Visualizer */}
        <div className="pt-3 sm:pt-4">
          <div className="h-38 sm:h-44 flex items-end gap-1.5 xs:gap-3 sm:gap-6 justify-between px-1 sm:px-2 border-b border-border/60 pb-2">
            {revenueTrend.map((item, idx) => {
              const heightPct = Math.round((item.amount / maxRevenue) * 100);
              const isCurrent = idx === revenueTrend.length - 1;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 group">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full">
                    {formatMoney(item.amount)}
                  </span>
                  <div
                    className="w-full max-w-[36px] sm:max-w-[42px] rounded-t-xl transition-[height,opacity] duration-500 motion-reduce:transition-none relative overflow-hidden"
                    style={{
                      height: `${Math.max(heightPct, 15)}%`,
                      backgroundColor: isCurrent ? "var(--primary)" : "var(--primary)",
                      opacity: isCurrent ? 1 : 0.45 + idx * 0.1,
                    }}
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-foreground/80">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground pt-1">
          <span>Target FY2026: ₹120,000</span>
          <span className="font-semibold text-foreground">
            Current MTD: {formatMoney(revenueTrend[revenueTrend.length - 1]?.amount || 0)}
          </span>
        </div>
      </Card>

      {/* Booking Discipline & Order Pipeline Breakdown */}
      <div className="lg:col-span-5 space-y-4 sm:space-y-6">
        {/* Discipline Breakdown */}
        <Card className="rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-bold text-foreground">Bookings by Discipline</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {totalBookings} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Stacked Progress Bar */}
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex">
              <div
                style={{ width: `${vetPct}%` }}
                className="bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                title={`Veterinary: ${vetPct}%`}
              />
              <div
                style={{ width: `${grmPct}%` }}
                className="bg-amber-500 transition-[width] duration-300 motion-reduce:transition-none"
                title={`Grooming: ${grmPct}%`}
              />
              <div
                style={{ width: `${trnPct}%` }}
                className="bg-sky-500 transition-[width] duration-300 motion-reduce:transition-none"
                title={`Training: ${trnPct}%`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div className="space-y-0.5">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  Veterinary
                </span>
                <p className="font-bold text-foreground text-xs">{vetPct}%</p>
              </div>

              <div className="space-y-0.5">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  Grooming
                </span>
                <p className="font-bold text-foreground text-xs">{grmPct}%</p>
              </div>

              <div className="space-y-0.5">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                  <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                  Training
                </span>
                <p className="font-bold text-foreground text-xs">{trnPct}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Status Pipeline */}
        <Card className="rounded-2xl sm:rounded-3xl border-border/80 p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold text-foreground">Order Fulfillment Pipeline</h3>
            </div>
            <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border/60 bg-surface/50 p-2 sm:p-2.5">
              <span className="text-[10px] text-muted-foreground block font-medium truncate">Confirmed</span>
              <span className="text-sm font-bold text-foreground">{orderStatusCounts.confirmed}</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface/50 p-2 sm:p-2.5">
              <span className="text-[10px] text-muted-foreground block font-medium truncate">Packed</span>
              <span className="text-sm font-bold text-amber-600">{orderStatusCounts.packed}</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface/50 p-2 sm:p-2.5">
              <span className="text-[10px] text-muted-foreground block font-medium truncate">Shipped</span>
              <span className="text-sm font-bold text-sky-600">{orderStatusCounts.shipped}</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface/50 p-2 sm:p-2.5">
              <span className="text-[10px] text-muted-foreground block font-medium truncate">Delivered</span>
              <span className="text-sm font-bold text-emerald-600">{orderStatusCounts.delivered}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
