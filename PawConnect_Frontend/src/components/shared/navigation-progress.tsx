"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const timersRef = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = React.useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const startProgress = React.useCallback(() => {
    clearAllTimers();
    setIsVisible(true);
    setProgress(25);

    // Trickle progress while loading
    const t1 = setTimeout(() => setProgress(50), 120);
    const t2 = setTimeout(() => setProgress(75), 350);
    const t3 = setTimeout(() => setProgress(88), 700);

    // Safety timeout in case navigation gets cancelled or errors
    const tSafety = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    }, 8000);

    timersRef.current.push(t1, t2, t3, tSafety);
  }, [clearAllTimers]);

  const finishProgress = React.useCallback(() => {
    clearAllTimers();
    setProgress(100);

    const tFade = setTimeout(() => {
      setIsVisible(false);
      const tReset = setTimeout(() => {
        setProgress(0);
      }, 200);
      timersRef.current.push(tReset);
    }, 180);

    timersRef.current.push(tFade);
  }, [clearAllTimers]);

  // When pathname or search params change, route navigation has completed!
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    finishProgress();
  }, [pathname, searchParams, finishProgress]);

  // Intercept click on links to start progress immediately
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Ignore different origins
        if (targetUrl.origin !== currentUrl.origin) return;

        // Ignore same exact URL (e.g. hash click or clicking current link)
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash === currentUrl.hash
        ) {
          return;
        }

        startProgress();
      } catch {
        // invalid URL, ignore
      }
    };

    // Intercept programmatic router.push / router.replace
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      setTimeout(() => startProgress(), 0);
      return originalPushState(...args);
    };

    window.history.replaceState = function (...args) {
      return originalReplaceState(...args);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearAllTimers();
    };
  }, [startProgress, clearAllTimers]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px]"
    >
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0,
          boxShadow: "0 0 10px var(--primary, #E78585), 0 0 4px var(--primary, #E78585)",
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressBarInner />
    </React.Suspense>
  );
}
