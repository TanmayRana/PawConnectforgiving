"use client";

import * as React from "react";
import {
  Bell,
  Megaphone,
  ShoppingBag,
  Calendar,
  Activity,
  CheckCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/api/notifications";
import { stompClient } from "@/lib/api/websocket";
import { showInfo } from "@/lib/utils/toast";

function sortLatestFirst(list: NotificationItem[]): NotificationItem[] {
  return [...list].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "system":
      return <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    case "order":
      return <ShoppingBag className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case "booking":
      return <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case "health":
      return <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
}

/** Safely fire a native desktop Notification — directly reads Notification.permission at call time */
function fireDesktopNotification(title: string, body?: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  try {
    new Notification(title || "PawConnect Notification", {
      body: body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `pawconnect-${Date.now()}`,
    });
  } catch {
    // ServiceWorker or browser may block in certain contexts — silent fail
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);
  const [hasDesktopPermission, setHasDesktopPermission] = React.useState(false);
  const { isAuthenticated } = useAuthStore();
  const ref = React.useRef<HTMLDivElement>(null);

  // Track mounted state to avoid SSR/hydration mismatch with window.Notification
  React.useEffect(() => {
    setIsMounted(true);
    if ("Notification" in window) {
      setHasDesktopPermission(Notification.permission === "granted");
    }
  }, []);

  const requestDesktopPermission = async () => {
    if (!isMounted || !("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === "granted";
      setHasDesktopPermission(granted);
      if (granted) {
        // Fire a welcome notification immediately to confirm it works
        try {
          new Notification("PawConnect Notifications Active", {
            body: "You will now receive real-time system alerts here.",
            icon: "/favicon.ico",
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore — browser may not support promise-based requestPermission
    }
  };

  // Use a ref for loadNotifications to avoid stale closures in STOMP effect
  const loadNotificationsRef = React.useRef<(() => Promise<void>) | null>(null);

  const loadNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(false),
        fetchUnreadCount(),
      ]);
      setNotifications(sortLatestFirst(notifs));
      setUnreadCount(count);
    } catch {
      // fallback
    }
  }, [isAuthenticated]);

  // Keep ref current
  React.useEffect(() => {
    loadNotificationsRef.current = loadNotifications;
  }, [loadNotifications]);

  // Initial load
  React.useEffect(() => {
    let isMountedEffect = true;
    if (isAuthenticated) {
      Promise.all([fetchNotifications(false), fetchUnreadCount()])
        .then(([notifs, count]) => {
          if (isMountedEffect) {
            setNotifications(sortLatestFirst(notifs));
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMountedEffect = false;
    };
  }, [isAuthenticated]);

  // Connect STOMP WebSocket — subscribe once per auth session; use ref so no re-subscribe on re-renders
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = stompClient.subscribe((payload: unknown) => {
      const p = payload as { title?: string; message?: string };
      if (p?.title) {
        showInfo(p.title, p.message, { dedupeKey: `stomp:${p.title}:${p.message || ""}` });
        fireDesktopNotification(p.title, p.message);
      }
      // Use the ref to always call the latest version
      loadNotificationsRef.current?.();
    });

    const handleRealtime = (e: Event) => {
      const customEvent = e as CustomEvent<{ title?: string; message?: string }>;
      if (customEvent.detail?.title) {
        showInfo(
          customEvent.detail.title,
          customEvent.detail.message,
          { dedupeKey: `realtime:${customEvent.detail.title}:${customEvent.detail.message || ""}` }
        );
        fireDesktopNotification(customEvent.detail.title, customEvent.detail.message);
      }
      loadNotificationsRef.current?.();
    };

    window.addEventListener("pawconnect-realtime-notification", handleRealtime);

    return () => {
      unsubscribe();
      window.removeEventListener("pawconnect-realtime-notification", handleRealtime);
    };
  }, [isAuthenticated]); // Only re-subscribe when auth changes

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notifId ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(notifId);
    } catch {
      // ignore
    }
  };

  // Desktop notification support check — only after mount to prevent hydration mismatch
  const supportsDesktopNotifications = isMounted && typeof window !== "undefined" && "Notification" in window;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <IconButton
          aria-label="Notifications"
          variant="ghost"
          onClick={() => {
            setIsOpen(!isOpen);
            // Auto-prompt for desktop permission on first open if still default
            if (isMounted && supportsDesktopNotifications && !hasDesktopPermission && Notification.permission === "default") {
              requestDesktopPermission();
            }
          }}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Bell className="h-5 w-5" />
        </IconButton>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground pointer-events-none shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[22rem] sm:w-[24rem] rounded-2xl border border-border bg-popover shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  onClick={handleMarkAllRead}
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
            </div>
          </div>

          {/* Desktop notification permission banner — rendered only after client mount */}
          {supportsDesktopNotifications && !hasDesktopPermission && (
            <div className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-700/30 flex items-center justify-between text-xs">
              <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
                Desktop alerts off
              </span>
              <button
                onClick={requestDesktopPermission}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
              >
                Enable
              </button>
            </div>
          )}

          {supportsDesktopNotifications && hasDesktopPermission && (
            <div className="px-3.5 py-1.5 bg-emerald-500/8 border-b border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                System desktop alerts active
              </span>
              <span className="text-[10px] text-muted-foreground">Latest first</span>
            </div>
          )}

          {/* Notification List — latest first */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You&apos;re all caught up with orders and alerts.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const innerContent = (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-surface border border-border/70 shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {n.title}
                          </p>
                          {n.type === "system" && (
                            <span className="px-1.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-semibold shrink-0">
                              System
                            </span>
                          )}
                        </div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground/80">
                        <span>{n.time}</span>
                        {n.link && (
                          <span className="text-[11px] font-semibold text-primary group-hover:underline">
                            View details &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        handleNotificationClick(n.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "group block px-4 py-3.5 hover:bg-muted/60 transition-colors",
                        !n.read && "bg-primary-soft/15"
                      )}
                    >
                      {innerContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group px-4 py-3.5 hover:bg-muted/60 transition-colors cursor-pointer",
                      !n.read && "bg-primary-soft/15"
                    )}
                    onClick={() => handleNotificationClick(n.id)}
                  >
                    {innerContent}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
