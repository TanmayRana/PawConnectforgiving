/**
 * Dynamic Razorpay Checkout Script Loader
 * Injects https://checkout.razorpay.com/v1/checkout.js safely in browser context
 * and resolves true when window.Razorpay is fully ready.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
      close?: () => void;
    };
  }
}

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    // Prevent SSR execution crashes
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(false);
      return;
    }

    // Return immediately if Razorpay is already available on window
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

    // Check if script element is already injected into DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`
    );

    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    // Dynamically inject script
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}
