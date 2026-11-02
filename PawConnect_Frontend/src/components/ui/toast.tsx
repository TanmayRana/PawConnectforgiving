"use client";

import * as React from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

export function Toaster({
  position = "top-right",
  expand = false,
  visibleToasts = 3,
  gap = 8,
  duration = 3000,
  ...props
}: ToasterProps = {}) {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      visibleToasts={visibleToasts}
      gap={gap}
      duration={duration}
      closeButton
      richColors={false}
      className="toaster group font-sans"
      icons={{
        success: (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105"
            aria-hidden="true"
          >
            <CheckCircle2 className="h-4 w-4 stroke-[2.25]" />
          </div>
        ),
        error: (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105"
            aria-hidden="true"
          >
            <AlertCircle className="h-4 w-4 stroke-[2.25]" />
          </div>
        ),
        warning: (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105"
            aria-hidden="true"
          >
            <AlertTriangle className="h-4 w-4 stroke-[2.25]" />
          </div>
        ),
        info: (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-105"
            aria-hidden="true"
          >
            <Info className="h-4 w-4 stroke-[2.25]" />
          </div>
        ),
        loading: (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs shrink-0"
            aria-hidden="true"
          >
            <Loader2 className="h-4 w-4 animate-spin stroke-[2.25]" />
          </div>
        ),
        close: <X className="h-3.5 w-3.5 stroke-[2]" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/80 group-[.toaster]:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] dark:group-[.toaster]:border-white/10 dark:group-[.toaster]:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.6),0_4px_16px_-2px_rgba(0,0,0,0.4)] group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 group-[.toaster]:transition-all group-[.toaster]:font-sans",
          title: "font-semibold text-[13.5px] text-foreground tracking-[-0.01em] leading-snug",
          description: "text-[12px] text-muted-foreground leading-relaxed mt-0.5 font-normal",
          actionButton:
            "bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 ml-auto shrink-0",
          cancelButton:
            "bg-secondary hover:bg-muted text-secondary-foreground font-medium text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0",
          closeButton:
            "text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 rounded-lg p-1 transition-colors border-0 bg-transparent",
        },
      }}
      {...props}
    />
  );
}