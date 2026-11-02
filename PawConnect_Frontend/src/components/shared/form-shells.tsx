"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  type DialogSize,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── FormModal ────────────────────────────────────────────────────────────────

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  className?: string;
  size?: DialogSize;
  disablePointerDismissal?: boolean;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  loading = false,
  submitDisabled = false,
  cancelDisabled = false,
  className,
  size = "default",
  disablePointerDismissal = true,
}: FormModalProps) {
  const handleCancel = () => {
    if (loading || cancelDisabled) return;
    onCancel?.();
    onOpenChange(false);
  };

  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails?: { reason?: string }
  ) => {
    if (!nextOpen && (loading || cancelDisabled)) {
      return;
    }
    if (!nextOpen && disablePointerDismissal && eventDetails?.reason === "outside-press") {
      return;
    }
    onOpenChange(nextOpen);
  };

  const isSaveDisabled = loading || submitDisabled;
  const isCancelDisabled = loading || cancelDisabled;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal={disablePointerDismissal}>
      <DialogContent showCloseButton size={size} className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <DialogBody>
          {children}
        </DialogBody>

        {onSubmit && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isCancelDisabled}>
              {cancelLabel}
            </Button>
            <Button onClick={onSubmit} pawLoading={loading} disabled={isSaveDisabled}>
              {submitLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── FormDrawer ───────────────────────────────────────────────────────────────

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  side?: "right" | "left" | "bottom" | "top";
  className?: string;
  size?: "default" | "md" | "lg" | "xl";
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  loading = false,
  side = "right",
  className,
  size = "lg",
}: FormDrawerProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const sizeClass =
    size === "xl"
      ? "sm:max-w-2xl"
      : size === "lg"
      ? "sm:max-w-xl"
      : size === "md"
      ? "sm:max-w-lg"
      : "sm:max-w-md";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "w-full flex flex-col p-0 gap-0 sm:rounded-l-3xl border-l border-border/80 shadow-2xl bg-card",
          sizeClass,
          className
        )}
      >
        <SheetHeader className="px-6 py-5 border-b border-border/70 bg-surface/40 shrink-0">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {onSubmit && (
          <SheetFooter className="px-6 py-4 border-t border-border/70 bg-surface/30 flex flex-row items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-xl px-5 h-10 text-xs font-semibold"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              pawLoading={loading}
              className="rounded-xl px-6 h-10 text-xs font-bold shadow-xs"
            >
              {submitLabel}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
