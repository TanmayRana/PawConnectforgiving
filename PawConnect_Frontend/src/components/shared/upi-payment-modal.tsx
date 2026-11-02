"use client";

import React, { useEffect, useState, useRef, useId } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  RazorpayOrderResponse,
  PaymentResponse,
  confirmUpiPayment,
  launchRazorpayCheckout,
} from "@/lib/api/payments";
import { formatMoney } from "@/lib/utils/money";

// Official UPI Brand Icons & Badges
export function GPayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Google Pay">
      <path
        d="M23.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.2 0 6-1.1 8-3l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.2C3.2 21.3 7.3 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.3 14.1c-.2-.7-.4-1.5-.4-2.1s.1-1.5.4-2.1V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4.1-3.3z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4.1 3.3c.9-2.9 3.6-5.1 6.7-5.1z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function PhonePeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="PhonePe">
      <rect width="24" height="24" rx="5" fill="#5F259F" />
      <path
        d="M14.5 7h-5a1.5 1.5 0 00-1.5 1.5v7a1.5 1.5 0 001.5 1.5h1.5v-3.5h2c1.7 0 3-1.3 3-3s-1.3-3-3-3zm-.2 4h-2.8V9h2.8c.6 0 1 .4 1 1s-.4 1-1 1z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function PaytmIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Paytm">
      <rect width="24" height="24" rx="5" fill="#002E6E" />
      <path
        d="M5 8h4.5c1.4 0 2.5 1.1 2.5 2.5S10.9 13 9.5 13H7v3H5V8zm2 3.5h2.2c.4 0 .8-.3.8-.8s-.4-.7-.8-.7H7v1.5zm6.5-3.5h5v2h-1.5v6H17V10h-1.5V8z"
        fill="#00BAF2"
      />
    </svg>
  );
}

export function BhimIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="BHIM">
      <rect width="24" height="24" rx="5" fill="#00833F" />
      <path
        d="M7 6h5c1.7 0 3 1.3 3 3 0 1-.5 1.9-1.3 2.4 1.1.5 1.8 1.5 1.8 2.6 0 1.7-1.3 3-3 3H7V6zm2.5 4h2.2c.6 0 1-.4 1-1s-.4-1-1-1H9.5v2zm0 4.5h2.5c.6 0 1-.4 1-1s-.4-1-1-1H9.5v2z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RazorpayOrderResponse;
  onSuccess: (payment: PaymentResponse) => void;
  onError?: (error: unknown) => void;
}

export function UpiPaymentModal({
  isOpen,
  onClose,
  order,
  onSuccess,
  onError,
}: UpiPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "apps" | "vpa">("qr");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [vpaInput, setVpaInput] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes countdown
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);

  const upiIdFieldId = useId();
  const upiVpa = "pawconnect@icici";
  const amountInRupees = (order.amountInPaise / 100).toFixed(2);
  const payeeName = "PawConnect Care";
  const txnNote = order.description || `PawConnect Order ${order.razorpayOrderId}`;

  // Standard NPCI UPI Intent URI for QR code & Deep Links
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(
    txnNote
  )}&tr=${encodeURIComponent(order.razorpayOrderId)}`;

  // Generate QR Code data URL using qrcode package
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1,
      color: {
        dark: "#1A1A1A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url: string) => setQrDataUrl(url))
      .catch((err: unknown) => {
        console.error("QR Code generation error:", err);
        setVerificationError("Failed to render QR Code.");
      });
  }, [isOpen, upiUri]);

  // 5-minute countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Complete & Confirm UPI payment
  const handleConfirmPayment = async (
    upiApp: string = "QR_SCANNER",
    customUpiId?: string
  ) => {
    try {
      setIsVerifying(true);
      setVerificationError(null);

      const confirmed = await confirmUpiPayment({
        gatewayOrderId: order.razorpayOrderId,
        paymentReference: order.paymentReference,
        upiId: customUpiId || (activeTab === "vpa" ? vpaInput : upiVpa),
        upiApp,
      });

      setIsVerifying(false);
      onSuccess(confirmed);
      onClose();
    } catch (err: unknown) {
      setIsVerifying(false);
      const msg =
        err instanceof Error ? err.message : "Failed to confirm UPI payment.";
      setVerificationError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    }
  };

  // Quick test simulation for seamless demo & QA
  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setSimProgress(10);

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSimulating(false);
            handleConfirmPayment("SIMULATED_TEST");
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  // Fallback to Razorpay hosted checkout popup
  const handleOpenRazorpay = () => {
    onClose();
    launchRazorpayCheckout({
      order,
      preferredMethod: "all",
      onSuccess,
      onDismiss: () => {
        onError?.(new Error("Razorpay checkout was dismissed without completing payment."));
      },
      onError,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-primary to-[#D9534F] p-5 text-primary-foreground relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
            aria-label="Close UPI modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider text-white">
              Instant UPI Gateway
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/90">
              <Clock className="h-3 w-3" />
              Expires in {formattedTime}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-between">
            <span>Pay with UPI</span>
            <span className="text-2xl font-black">
              {formatMoney(order.amountInPaise / 100)}
            </span>
          </h2>
          <p className="text-xs text-white/80 mt-0.5 truncate">
            {order.description || `Order #${order.razorpayOrderId}`}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/80 bg-surface/50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "qr"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-primary" />
            <span>QR Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("apps")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "apps"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            <span>UPI Apps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vpa")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "vpa"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>UPI ID (VPA)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {verificationError && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* TAB 1: QR SCANNER */}
          {activeTab === "qr" && (
            <div className="text-center space-y-4">
              {/* Brand Pills */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-bold text-foreground">
                  <GPayIcon className="h-3.5 w-3.5" />
                  Google Pay
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-bold text-foreground">
                  <PhonePeIcon className="h-3.5 w-3.5" />
                  PhonePe
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-bold text-foreground">
                  <PaytmIcon className="h-3.5 w-3.5" />
                  Paytm
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-bold text-foreground">
                  <BhimIcon className="h-3.5 w-3.5" />
                  BHIM
                </span>
              </div>

              {/* QR Code Container with Scanner Frame */}
              <div className="relative mx-auto w-56 h-56 p-3 rounded-2xl bg-white shadow-md border-2 border-primary/20 flex items-center justify-center group overflow-hidden">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Scan UPI QR Code with Google Pay, PhonePe, or Paytm"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs">Generating QR Code...</span>
                  </div>
                )}

                {/* Animated Scanner Laser Bar */}
                <div className="absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-80 animate-bounce pointer-events-none" />

                {/* Corner Accents */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-md" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-md" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-md" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-md" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  Scan with any UPI App
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Open Google Pay, PhonePe, Paytm, or BHIM on your phone and point the camera at this QR code.
                </p>
              </div>

              {/* UPI ID Row */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface/80 border border-border/70 text-xs">
                <div className="text-left">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Merchant UPI VPA
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {upiVpa}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPI APPS (Intent Links) */}
          {activeTab === "apps" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Tap your preferred UPI app to open it directly on this device and approve payment of {formatMoney(order.amountInPaise / 100)}.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* Google Pay */}
                <a
                  href={`tez://upi/pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
                    payeeName
                  )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(txnNote)}`}
                  onClick={() => handleConfirmPayment("GOOGLE_PAY")}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-surface/80 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#4285F4]/10 flex items-center justify-center">
                      <GPayIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        Google Pay
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Pay instantly via GPay app
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {/* PhonePe */}
                <a
                  href={`phonepe://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
                    payeeName
                  )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(txnNote)}`}
                  onClick={() => handleConfirmPayment("PHONEPE")}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-surface/80 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#5F259F]/10 flex items-center justify-center">
                      <PhonePeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        PhonePe
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Open PhonePe mobile application
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {/* Paytm */}
                <a
                  href={`paytmmp://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
                    payeeName
                  )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(txnNote)}`}
                  onClick={() => handleConfirmPayment("PAYTM")}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-surface/80 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#002E6E]/10 flex items-center justify-center">
                      <PaytmIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        Paytm UPI
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Pay via Paytm wallet or bank
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {/* Generic UPI App */}
                <a
                  href={upiUri}
                  onClick={() => handleConfirmPayment("OTHER_UPI")}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-surface/80 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <BhimIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        Any UPI App / BHIM
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Launch default device UPI handler
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: ENTER UPI ID */}
          {activeTab === "vpa" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor={upiIdFieldId}
                  className="text-xs font-bold text-foreground block"
                >
                  Enter Your UPI ID (VPA)
                </label>
                <div className="relative">
                  <input
                    id={upiIdFieldId}
                    type="text"
                    value={vpaInput}
                    onChange={(e) => setVpaInput(e.target.value)}
                    placeholder="e.g. mobile@okhdfcbank or user@paytm"
                    className="w-full h-11 px-3.5 rounded-xl border border-border/80 bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A payment request will be dispatched to your UPI app for authorization.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border/70 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Popular UPI ID Suffixes
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["@oksbi", "@okhdfcbank", "@okaxis", "@paytm", "@ybl", "@ibl"].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const base = vpaInput.split("@")[0] || "user";
                          setVpaInput(`${base}${s}`);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-card border border-border/70 text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions & Verification */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <button
              type="button"
              disabled={isVerifying || isSimulating}
              onClick={() => handleConfirmPayment(activeTab === "vpa" ? "UPI_VPA" : "QR_SCANNER")}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Payment with Bank...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>I Have Paid via UPI — Confirm Now</span>
                </>
              )}
            </button>

            {/* Simulated UPI Approval (for Developer / Demo Testing) */}
            <button
              type="button"
              disabled={isVerifying || isSimulating}
              onClick={handleSimulatePayment}
              className="w-full h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                  <span>Simulating Bank Approval ({simProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Test Mode: Simulate Instant UPI Approval</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-surface/50 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit NPCI UPI Certified</span>
          </div>

          <button
            type="button"
            onClick={handleOpenRazorpay}
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <CreditCard className="h-3 w-3" />
            <span>Open Razorpay Modal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
