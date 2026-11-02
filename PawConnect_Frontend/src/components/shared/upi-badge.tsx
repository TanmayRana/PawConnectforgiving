"use client";

import React from "react";
import { QrCode, CreditCard, Building2, CheckCircle2, Zap } from "lucide-react";

/**
 * Standard UPI brand icon SVG
 */
export function UpiIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="UPI Logo"
    >
      {/* Dynamic green & orange arrows mimicking the official NPCI UPI chevron motif */}
      <path
        d="M27.5 7L13 24H22.5L20.5 41L35 24H25.5L27.5 7Z"
        fill="currentColor"
        className="text-[#0F9D58]"
      />
      <path
        d="M20.5 41L24 24H35L20.5 41Z"
        fill="currentColor"
        className="text-[#E85D04]"
      />
    </svg>
  );
}

export type PaymentMethodChoice = "upi" | "card" | "netbanking" | "all";

interface PaymentMethodSelectorProps {
  selected: PaymentMethodChoice;
  onSelect: (method: PaymentMethodChoice) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: "upi" as PaymentMethodChoice,
      title: "Instant UPI (GPay, PhonePe, Paytm, QR)",
      popular: true,
      badge: "Recommended • 0% Fee",
      description:
        "Fastest checkout via Google Pay, PhonePe, Paytm, BHIM, or instant QR code scan on mobile and desktop.",
      apps: ["GPay", "PhonePe", "Paytm", "BHIM", "Scan QR"],
      icon: <UpiIcon className="h-5 w-5" />,
    },
    {
      id: "card" as PaymentMethodChoice,
      title: "Debit / Credit Cards",
      badge: "Visa, Mastercard, RuPay",
      description:
        "All major domestic and international debit and credit cards with 3D Secure OTP verification.",
      apps: ["Visa", "Mastercard", "RuPay", "Amex"],
      icon: <CreditCard className="h-5 w-5 text-primary" />,
    },
    {
      id: "netbanking" as PaymentMethodChoice,
      title: "Net Banking & Wallets",
      badge: "50+ Banks",
      description:
        "Direct net banking portal access across HDFC, ICICI, SBI, Axis, Kotak, and popular wallets.",
      apps: ["HDFC", "SBI", "ICICI", "Axis", "Wallets"],
      icon: <Building2 className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-3">
      {methods.map((m) => {
        const isSelected = selected === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
              isSelected
                ? "border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm ring-1 ring-primary/40"
                : "border-border/80 bg-card hover:border-border hover:bg-surface/50"
            }`}
          >
            {/* Active accent strip */}
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-surface border border-border/60 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {m.icon}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {m.title}
                    </span>
                    {m.popular && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                        <Zap className="h-2.5 w-2.5 fill-current" />
                        {m.badge}
                      </span>
                    )}
                    {!m.popular && m.badge && (
                      <span className="text-[10px] font-medium text-muted-foreground border border-border/80 rounded-md px-1.5 py-0.5 bg-surface">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-0.5">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-background"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-4 w-4 fill-primary text-primary-foreground" />}
                </div>
              </div>
            </div>

            {/* App Pills */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">
                Accepted:
              </span>
              {m.apps.map((app) => (
                <span
                  key={app}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground border border-border/50"
                >
                  {app === "Scan QR" && <QrCode className="inline h-3 w-3 mr-1 text-primary" />}
                  {app}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
