"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";
import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export interface ToastOptions extends Omit<ExternalToast, "description"> {
  description?: string;
  dedupeKey?: string;
  cooldownMs?: number;
}

const recentToasts = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 2000;

function shouldThrottle(key: string, cooldownMs: number = DEFAULT_COOLDOWN_MS): boolean {
  const now = Date.now();
  const lastTime = recentToasts.get(key);
  if (lastTime && now - lastTime < cooldownMs) {
    return true;
  }
  recentToasts.set(key, now);
  // Clean up old entries periodically
  if (recentToasts.size > 100) {
    for (const [k, timestamp] of recentToasts.entries()) {
      if (now - timestamp > 10000) {
        recentToasts.delete(k);
      }
    }
  }
  return false;
}

/**
 * Display a graphical success toast notification.
 */
export function showSuccess(
  message: string,
  description?: string,
  options?: ToastOptions
): string | number | undefined {
  const key = options?.dedupeKey || `success:${message}:${description || ""}`;
  if (shouldThrottle(key, options?.cooldownMs)) return undefined;

  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.success(message, {
    description,
    duration: 2500,
    ...rest,
  });
}

/**
 * Display a graphical error toast notification.
 */
export function showError(
  message: string,
  description?: string,
  options?: ToastOptions
): string | number | undefined {
  const key = options?.dedupeKey || `error:${message}:${description || ""}`;
  if (shouldThrottle(key, options?.cooldownMs)) return undefined;

  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.error(message, {
    description,
    duration: 4500,
    ...rest,
  });
}

/**
 * Display a graphical warning toast notification.
 */
export function showWarning(
  message: string,
  description?: string,
  options?: ToastOptions
): string | number | undefined {
  const key = options?.dedupeKey || `warning:${message}:${description || ""}`;
  if (shouldThrottle(key, options?.cooldownMs)) return undefined;

  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.warning(message, {
    description,
    duration: 3500,
    ...rest,
  });
}

/**
 * Display a graphical informational toast notification.
 */
export function showInfo(
  message: string,
  description?: string,
  options?: ToastOptions
): string | number | undefined {
  const key = options?.dedupeKey || `info:${message}:${description || ""}`;
  if (shouldThrottle(key, options?.cooldownMs)) return undefined;

  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.info(message, {
    description,
    duration: 3000,
    ...rest,
  });
}

/**
 * Display a persistent loading toast notification.
 */
export function showLoading(
  message: string,
  description?: string,
  options?: ToastOptions
): string | number {
  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.loading(message, {
    description,
    ...rest,
  });
}

/**
 * Display an asynchronous promise toast notification with automatic loading, success, and error states.
 */
export function showPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  data: {
    loading?: string | React.ReactNode;
    success?: string | React.ReactNode | ((data: T) => string | React.ReactNode);
    error?: string | React.ReactNode | ((error: unknown) => string | React.ReactNode);
    description?: string | React.ReactNode | ((data: T) => string | React.ReactNode);
    finally?: () => void | Promise<void>;
  },
  options?: ToastOptions
) {
  const { dedupeKey: _dedupeKey, cooldownMs: _cooldownMs, ...rest } = options || {};
  return sonnerToast.promise(promise, {
    ...data,
    ...rest,
  });
}

/**
 * Programmatically dismiss a specific toast or all toasts.
 */
export function dismissToast(toastId?: string | number): void {
  sonnerToast.dismiss(toastId);
}

// Re-export standard sonner toast object with decorated semantic helpers
export const toast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => sonnerToast(message, data),
  sonnerToast,
  {
    success: (message: string, options?: ToastOptions) =>
      showSuccess(message, options?.description, options),
    error: (message: string, options?: ToastOptions) =>
      showError(message, options?.description, options),
    warning: (message: string, options?: ToastOptions) =>
      showWarning(message, options?.description, options),
    info: (message: string, options?: ToastOptions) =>
      showInfo(message, options?.description, options),
    loading: (message: string, options?: ToastOptions) =>
      showLoading(message, options?.description, options),
    promise: showPromise,
    dismiss: dismissToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showPromise,
    dismissToast,
  }
);

