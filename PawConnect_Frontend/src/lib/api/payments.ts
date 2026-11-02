/**
 * Razorpay Payment API & Checkout Service
 * Connects to Spring Boot /api/payments, /api/me/bookings/.../payments, and /api/me/orders/.../payments.
 */

import { apiGet, apiPost } from "./client";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { useAuthStore } from "@/stores/auth.store";

export interface CreateOrderRequest {
  productId?: number;
  orderId?: number;
  bookingId?: number;
  bookingType?: "VETERINARY" | "SERVICE" | "ORDER";
  quantity?: number;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  orderId?: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  paymentReference: string;
  bookingId?: number;
  bookingType?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  paymentExpiresAt?: string;
  remainingPaymentSeconds?: number;
  canRetryPayment?: boolean;
}

export interface VerifyPaymentRequest {
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
}

export interface PaymentResponse {
  id: number;
  paymentReference: string;
  paymentFor: "APPOINTMENT" | "SERVICE_BOOKING" | "ORDER";
  referenceId: number;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "PAID" | "FAILED" | "REFUNDED";
  gatewayProvider: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  paymentMethod?: string;
  gatewayStatus?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Standard Payment Order Creators ──────────────────────────────────────────

function normalizeOrderResponse(raw: Record<string, unknown>): RazorpayOrderResponse {
  const resolvedOrderId =
    (raw.razorpayOrderId as string) || (raw.orderId as string) || "";
  const amountInPaise = Number(raw.amountInPaise || 0);
  const amount = Number(
    raw.amount || (amountInPaise ? amountInPaise / 100 : 0)
  );

  return {
    ...raw,
    razorpayOrderId: resolvedOrderId,
    orderId: resolvedOrderId,
    amount,
    amountInPaise,
    currency: (raw.currency as string) || "INR",
    keyId:
      (raw.keyId as string) ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "rzp_test_TkvJEjvkZVI6CU",
    paymentReference: (raw.paymentReference as string) || resolvedOrderId,
    paymentExpiresAt: raw.paymentExpiresAt as string | undefined,
    remainingPaymentSeconds: raw.remainingPaymentSeconds as number | undefined,
    canRetryPayment: raw.canRetryPayment as boolean | undefined,
  } as RazorpayOrderResponse;
}

/**
 * Production-grade endpoint creating a Razorpay order calculated strictly from DB entities.
 * Accepts only product/booking/order IDs (NEVER raw monetary amounts).
 */
export async function createPaymentOrder(
  data: CreateOrderRequest
): Promise<RazorpayOrderResponse> {
  const raw = await apiPost<Record<string, unknown>>("/payment/create-order", data);
  return normalizeOrderResponse(raw);
}

export interface RecordPaymentFailureRequest {
  razorpayOrderId?: string;
  orderId?: number;
  bookingId?: number;
  bookingType?: "VETERINARY" | "SERVICE";
  reason?: string;
}

export async function recordPaymentFailure(
  data: RecordPaymentFailureRequest
): Promise<RazorpayOrderResponse> {
  const raw = await apiPost<Record<string, unknown>>("/payment/record-failure", data);
  return normalizeOrderResponse(raw);
}

export async function createBookingPaymentOrder(
  bookingId: number | string,
  type?: "VETERINARY" | "SERVICE" | "ORDER",
  preferredMethod?: string
): Promise<RazorpayOrderResponse> {
  const numericId = Number(String(bookingId).replace(/\D/g, "") || "1");
  const raw = await apiPost<Record<string, unknown>>(
    `/me/bookings/${numericId}/payments/order`,
    {
      bookingType: type,
      preferredMethod: preferredMethod?.toUpperCase(),
    }
  );
  return normalizeOrderResponse(raw);
}

export async function createAppointmentPaymentOrder(
  appointmentId: number | string,
  preferredMethod?: string
): Promise<RazorpayOrderResponse> {
  const numericId = Number(String(appointmentId).replace(/\D/g, "") || "1");
  const raw = await apiPost<Record<string, unknown>>(
    `/me/appointments/${numericId}/payments/order`,
    preferredMethod ? { preferredMethod: preferredMethod.toUpperCase() } : undefined
  );
  return normalizeOrderResponse(raw);
}

export async function createServiceBookingPaymentOrder(
  bookingId: number | string,
  preferredMethod?: string
): Promise<RazorpayOrderResponse> {
  const numericId = Number(String(bookingId).replace(/\D/g, "") || "1");
  const raw = await apiPost<Record<string, unknown>>(
    `/me/service-bookings/${numericId}/payments/order`,
    preferredMethod ? { preferredMethod: preferredMethod.toUpperCase() } : undefined
  );
  return normalizeOrderResponse(raw);
}

export async function createOrderPaymentOrder(
  orderId: number | string,
  preferredMethod?: string
): Promise<RazorpayOrderResponse> {
  const numericId = Number(String(orderId).replace(/\D/g, "") || "1");
  const raw = await apiPost<Record<string, unknown>>(
    `/me/orders/${numericId}/payments/order`,
    preferredMethod ? { preferredMethod: preferredMethod.toUpperCase() } : undefined
  );
  return normalizeOrderResponse(raw);
}

export interface ConfirmUpiPaymentRequest {
  gatewayOrderId: string;
  paymentReference?: string;
  upiId?: string;
  upiApp?: string;
  transactionId?: string;
}

/**
 * Verifies Razorpay HMAC-SHA256 signature and executes idempotent fulfillment on Spring Boot.
 */
export async function verifyPayment(
  data: VerifyPaymentRequest
): Promise<PaymentResponse> {
  return apiPost<PaymentResponse>("/payment/verify", data);
}

export interface PaymentStatusResponse {
  orderId: string;
  amountInPaise: number;
  currency: string;
  keyId?: string;
  paymentOrderId?: number;
  productId?: number;
  orderIdReference?: number;
  bookingId?: number;
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  signatureVerified: boolean;
  razorpayPaymentId?: string;
  createdAt?: string;
}

/**
 * Polls payment status from Spring Boot backend if customer connection was interrupted.
 */
export async function getPaymentStatus(
  razorpayOrderId: string
): Promise<PaymentStatusResponse> {
  return apiGet<PaymentStatusResponse>(`/payment/status/${razorpayOrderId}`);
}

/**
 * Initiates an automated refund for a paid Razorpay order.
 */
export async function refundPaymentOrder(
  razorpayOrderId: string,
  reason?: string
): Promise<PaymentStatusResponse> {
  return apiPost<PaymentStatusResponse>(
    `/payment/refund/${razorpayOrderId}`,
    undefined,
    { params: reason ? { reason } : undefined }
  );
}

export async function confirmUpiPayment(
  data: ConfirmUpiPaymentRequest
): Promise<PaymentResponse> {
  return apiPost<PaymentResponse>("/payments/upi/confirm", data);
}

export async function getBookingPayment(
  bookingId: number | string,
  type?: string
): Promise<PaymentResponse> {
  const numericId = Number(String(bookingId).replace(/\D/g, "") || "1");
  return apiGet<PaymentResponse>(`/me/bookings/${numericId}/payment`, {
    params: type ? { type } : undefined,
  });
}

export async function getOrderPayment(
  orderId: number | string
): Promise<PaymentResponse> {
  const numericId = Number(String(orderId).replace(/\D/g, "") || "1");
  return apiGet<PaymentResponse>(`/me/orders/${numericId}/payment`);
}

// ─── Razorpay Script Loader Compatibility ─────────────────────────────────────

export function loadRazorpayScript(): Promise<boolean> {
  return loadRazorpay();
}

// ─── Razorpay Modal Runner ───────────────────────────────────────────────────

export interface LaunchCheckoutOptions {
  order: RazorpayOrderResponse;
  preferredMethod?: "upi" | "card" | "netbanking" | "all";
  onSuccess: (verificationResult: PaymentResponse) => void;
  onDismiss?: () => void;
  onError?: (err: unknown) => void;
}

export async function launchRazorpayCheckout({
  order,
  preferredMethod = "upi",
  onSuccess,
  onDismiss,
  onError,
}: LaunchCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) {
    onError?.(new Error("Unable to load secure Razorpay checkout script. Please check your internet connection."));
    return;
  }

  const defaultKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

  let isVerified = false;

  // Retrieve authenticated user details for reliable prefill (Razorpay requires valid 10-digit phone for UPI)
  const currentUser = useAuthStore.getState().user;
  const rawPhone = order.customerPhone || currentUser?.phone || "9876543210";
  const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10) || "9876543210";
  const customerEmail =
    order.customerEmail || currentUser?.email || "customer@pawconnect.care";
  const customerName =
    order.customerName ||
    currentUser?.fullName ||
    `${currentUser?.firstName || "PawConnect"} ${currentUser?.lastName || "Customer"}`.trim();

  const isUpi = preferredMethod === "upi";

  const resolvedOrderId =
    order.razorpayOrderId ||
    ((order as unknown as Record<string, unknown>).orderId as string);

  if (!resolvedOrderId || typeof resolvedOrderId !== "string" || !resolvedOrderId.startsWith("order_")) {
    const errorMsg = `Payment initialization halted: Missing or invalid Razorpay Order ID ("${resolvedOrderId}"). Payments without an order ID are prohibited for security.`;
    console.error(errorMsg, order);
    onError?.(new Error(errorMsg));
    return;
  }

  const options: Record<string, unknown> = {
    key: order.keyId || defaultKey,
    amount: order.amountInPaise,
    currency: order.currency || "INR",
    name: "PawConnect",
    description: order.description || "PawConnect Secure Payment",
    order_id: resolvedOrderId,
    prefill: {
      name: customerName,
      email: customerEmail,
      contact: cleanPhone,
    },
    theme: {
      color: "#C44536", // PawConnect primary brand red
    },
    config: {
      display: {
        blocks: {
          upi: {
            name: "Pay using UPI (GPay, PhonePe, QR)",
            instruments: [
              {
                method: "upi",
              },
            ],
          },
          other: {
            name: "Cards & Other Options",
            instruments: [
              {
                method: "card",
              },
              {
                method: "netbanking",
              },
              {
                method: "wallet",
              },
            ],
          },
        },
        sequence: ["block.upi", "block.other"],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    handler: async function (response: {
      razorpay_payment_id: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    }) {
      try {
        isVerified = true;
        const returnedOrderId = response.razorpay_order_id || resolvedOrderId;
        const result = await verifyPayment({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: returnedOrderId,
          razorpaySignature: response.razorpay_signature || "",
          paymentMethod: isUpi ? "UPI" : (preferredMethod ? preferredMethod.toUpperCase() : "RAZORPAY"),
        });
        onSuccess(result);
      } catch (err) {
        onError?.(err);
      }
    },
    modal: {
      ondismiss: function () {
        if (!isVerified) {
          onDismiss?.();
        }
      },
    },
  };

  try {
    const razorpayInstance = new window.Razorpay(options);

    // Catch failure events from Razorpay modal
    razorpayInstance.on("payment.failed", (failedResponse: unknown) => {
      const errorObj = failedResponse as {
        error?: { description?: string; reason?: string; code?: string };
      };
      const reason =
        errorObj?.error?.description ||
        errorObj?.error?.reason ||
        "Payment authorization failed at the gateway.";
      onError?.(new Error(reason));
    });

    razorpayInstance.open();
  } catch (err) {
    onError?.(err);
  }
}

// ─── Abandoned Checkout Handling ─────────────────────────────────────────────

export async function cancelAbandonedPayment(razorpayOrderId: string): Promise<void> {
  await apiPost<void>(`/payment/cancel-abandoned/${razorpayOrderId}`, {});
}

// ─── Admin Payment History & Financial Ledger APIs ───────────────────────────

export interface AdminPaymentRecord {
  id: number;
  paymentReference: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  signatureVerified: boolean;
  userId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentFor: "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING";
  referenceId?: number;
  referenceNumber?: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  paymentMethod?: string;
  status: "CREATED" | "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "REFUNDED";
  failureReason?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt?: string;
  capturedAt?: string;
}

export interface AdminPaymentSummary {
  totalRevenue: number;
  totalTransactions: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalRefundedAmount: number;
}

export interface AdminPaymentFilters {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  paymentFor?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminPaymentsPageResponse {
  content: AdminPaymentRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export async function fetchAdminPayments(
  filters: AdminPaymentFilters = {}
): Promise<AdminPaymentsPageResponse> {
  const query = new URLSearchParams();
  if (filters.page !== undefined) query.set("page", String(filters.page));
  if (filters.size !== undefined) query.set("size", String(filters.size));
  if (filters.sort) query.set("sort", filters.sort);
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
  if (filters.paymentFor && filters.paymentFor !== "ALL") query.set("paymentFor", filters.paymentFor);
  if (filters.search && filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.startDate) query.set("startDate", filters.startDate);
  if (filters.endDate) query.set("endDate", filters.endDate);

  const qs = query.toString();
  return apiGet<AdminPaymentsPageResponse>(`/admin/payments${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminPaymentSummary(): Promise<AdminPaymentSummary> {
  return apiGet<AdminPaymentSummary>("/admin/payments/summary");
}

export async function fetchAdminPaymentById(id: number): Promise<AdminPaymentRecord> {
  return apiGet<AdminPaymentRecord>(`/admin/payments/${id}`);
}

export async function adminRefundPayment(
  razorpayOrderId: string,
  reason?: string
): Promise<AdminPaymentRecord> {
  return apiPost<AdminPaymentRecord>(`/admin/payments/${razorpayOrderId}/refund`, {
    reason: reason || "Administrative refund executed",
  });
}

// ─── UNIVERSAL GST TAX INVOICES & BILLING ENGINE ─────────────────────────────

export interface InvoiceLineItem {
  serialNo: number;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  lineTotal: number;
}

export interface InvoiceResponse {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING" | "PAYMENT";
  resourceId: number;
  referenceNumber: string;

  // Issuer Details
  issuerName: string;
  issuerSubHeader: string;
  issuerAddress: string;
  issuerGstin: string;
  issuerPhone: string;
  issuerEmail: string;

  // Billed To Customer
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  billingAddress: string;

  // Shipped To (Orders) or Patient Details (Vet/Booking)
  shippingAddress?: string;
  courierPartner?: string;
  awbNumber?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;

  // Payment Gateway Details
  paymentStatus: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;

  // Tax & Totals Breakdown
  subtotal: number;
  discountAmount?: number;
  shippingFee?: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalAmount: number;
  amountInWords?: string;

  items: InvoiceLineItem[];
}

export async function getOrderInvoice(orderId: number | string): Promise<InvoiceResponse> {
  const numericId = Number(String(orderId).replace(/\D/g, ""));
  return await apiGet<InvoiceResponse>(`/invoices/order/${numericId}`);
}

export async function getAppointmentInvoice(appointmentId: number | string): Promise<InvoiceResponse> {
  const numericId = Number(String(appointmentId).replace(/\D/g, ""));
  return await apiGet<InvoiceResponse>(`/invoices/appointment/${numericId}`);
}

export async function getServiceBookingInvoice(bookingId: number | string): Promise<InvoiceResponse> {
  const numericId = Number(String(bookingId).replace(/\D/g, ""));
  return await apiGet<InvoiceResponse>(`/invoices/service-booking/${numericId}`);
}

export async function getPaymentInvoice(identifier: string | number): Promise<InvoiceResponse> {
  return await apiGet<InvoiceResponse>(`/invoices/payment/${identifier}`);
}
