/**
 * Customer Orders API
 * Connects to Spring Boot /api/me/orders and payment endpoints.
 */

import { apiGet, apiPost, apiPatch, type PageResponse } from "./client";
import { getLocalCart } from "./cart";
import {
  type CustomerOrder,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
  type OrderTimelineStep,
} from "@/lib/mock/orders";
import type { CustomerAddress } from "@/lib/mock/customer";

export type { CustomerOrder, OrderItem, OrderStatus, PaymentStatus, OrderTimelineStep };

export interface BackendOrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  productImageUrl?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BackendOrder {
  id: number;
  orderNo: string;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  addressId?: number;
  deliveryRecipientName?: string;
  deliveryPhone?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  latitude?: number;
  longitude?: number;
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  courierPartner?: string;
  trackingNumber?: string;
  awbNumber?: string;
  trackingUrl?: string;
  shippingLabelNumber?: string;
  invoiceNumber?: string;
  packageWeightKg?: number;
  packageDimensions?: string;
  packedAt?: string;
  shippedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  dispatchNotes?: string;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "CONFIRMED" | "PACKED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentExpiresAt?: string;
  remainingPaymentSeconds?: number;
  canRetryPayment?: boolean;
  placedAt?: string;
  createdAt?: string;
  items?: BackendOrderItem[];
}

export function buildTimeline(
  orderStatus: string,
  placedAt?: string,
  packedAt?: string,
  shippedAt?: string,
  deliveredAt?: string
): OrderTimelineStep[] {
  const status = orderStatus.toLowerCase();
  const formatTime = (ts?: string) => {
    if (!ts) return undefined;
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const isConfirmed = ["confirmed", "packed", "processing", "shipped", "delivered"].includes(status);
  const isPacked = ["packed", "processing", "shipped", "delivered"].includes(status);
  const isShipped = ["shipped", "delivered"].includes(status);
  const isDelivered = status === "delivered";

  if (status === "pending") {
    return [
      {
        status: "pending",
        label: "Awaiting Payment",
        description: "Items reserved. Complete payment within 15 minutes to confirm order.",
        timestamp: formatTime(placedAt) || "Checkout Initiated",
        done: false,
        current: true,
      },
      {
        status: "confirmed",
        label: "Order Confirmed",
        description: "Awaiting payment verification.",
        done: false,
        current: false,
      },
      {
        status: "packed",
        label: "Packed & Labeled",
        description: "Packaging at central depot.",
        done: false,
        current: false,
      },
      {
        status: "shipped",
        label: "Shipped In-Transit",
        description: "Handed over to courier.",
        done: false,
        current: false,
      },
      {
        status: "delivered",
        label: "Delivered",
        description: "Handoff to recipient address.",
        done: false,
        current: false,
      },
    ];
  }

  return [
    {
      status: "confirmed",
      label: "Order Confirmed",
      description: "Payment authorized & verified. Order placed with PawConnect in-house depot.",
      timestamp: formatTime(placedAt) || "Order Placed",
      done: isConfirmed,
      current: status === "confirmed",
    },
    {
      status: "packed",
      label: "Packed & Labeled",
      description: "Quality inspected, packaged with tamper-evident seal, and dispatch label generated.",
      timestamp: formatTime(packedAt),
      done: isPacked,
      current: status === "packed" || status === "processing",
    },
    {
      status: "shipped",
      label: "Shipped In-Transit",
      description: "Handed over to courier partner. In-transit to destination fulfillment center.",
      timestamp: formatTime(shippedAt),
      done: isShipped,
      current: status === "shipped",
    },
    {
      status: "delivered",
      label: "Delivered",
      description: "Handoff to recipient address completed successfully.",
      timestamp: formatTime(deliveredAt),
      done: isDelivered,
      current: status === "delivered",
    },
  ];
}

export function mapBackendOrder(bo: BackendOrder): CustomerOrder {
  const items: OrderItem[] = (bo.items || []).map((it) => ({
    productId: String(it.productId),
    name: it.productName,
    sku: it.productSku,
    category: "Pet Supplies",
    price: Number(it.unitPrice),
    image:
      it.productImageUrl ||
      it.imageUrl ||
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
    productImageUrl: it.productImageUrl || it.imageUrl,
    quantity: it.quantity,
    lineTotal: Number(it.lineTotal),
  }));

  const recipient =
    bo.deliveryRecipientName || bo.recipientName || bo.customerName || "Customer";
  const street =
    bo.deliveryAddressLine1 || bo.addressLine1 || "Customer Address";
  const unit = bo.deliveryAddressLine2 || bo.addressLine2;
  const city = bo.deliveryCity || bo.city || "City";
  const state = bo.deliveryState || bo.state || "State";
  const zipCode = bo.deliveryPostalCode || bo.postalCode || "000000";
  const phone = bo.deliveryPhone || bo.phone || bo.customerPhone || "+919876543210";

  const deliveryAddress: CustomerAddress = {
    id: String(bo.addressId || "addr-default"),
    label: "Home",
    recipientName: recipient,
    street,
    unit,
    city,
    state,
    zipCode,
    phone,
    latitude: bo.deliveryLatitude ?? bo.latitude,
    longitude: bo.deliveryLongitude ?? bo.longitude,
    isDefault: true,
  };

  const statusLower = bo.orderStatus ? bo.orderStatus.toLowerCase() : "confirmed";
  const mappedStatus: OrderStatus =
    statusLower === "cancelled"
      ? "cancelled"
      : statusLower === "pending"
      ? "pending"
      : statusLower === "delivered"
      ? "delivered"
      : statusLower === "shipped"
      ? "shipped"
      : statusLower === "packed" || statusLower === "processing"
      ? "packed"
      : "confirmed";

  const pStatus = bo.paymentStatus?.toLowerCase();
  const mappedPaymentStatus: PaymentStatus =
    pStatus === "paid" || pStatus === "success"
      ? "paid"
      : pStatus === "failed"
      ? "failed"
      : pStatus === "refunded"
      ? "refunded"
      : pStatus === "pending"
      ? "pending"
      : "processing";

  const trackingCode = bo.trackingNumber || bo.awbNumber || `PC-TRK-${bo.id}`;

  return {
    id: String(bo.id),
    orderNumber: bo.orderNo || `ORD-${bo.id}`,
    items,
    subtotal: Number(bo.subtotal || 0),
    discount: Number(bo.discountAmount || 0),
    deliveryFee: Number(bo.shippingFee || 0),
    total: Number(bo.totalAmount || 0),
    itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    deliveryAddress,
    status: mappedStatus,
    paymentStatus: mappedPaymentStatus,
    paymentMethod: "Razorpay Secure Gateway",
    createdAt: bo.placedAt || bo.createdAt || new Date().toISOString(),
    paymentExpiresAt: bo.paymentExpiresAt,
    remainingPaymentSeconds: bo.remainingPaymentSeconds,
    canRetryPayment: bo.canRetryPayment,
    estimatedDelivery: bo.estimatedDeliveryDate
      ? `Estimated delivery by ${bo.estimatedDeliveryDate}`
      : "Delivery within 2-3 business days",
    carrier: bo.courierPartner || "PawConnect Express Logistics",
    trackingNumber: trackingCode,
    courierPartner: bo.courierPartner,
    awbNumber: bo.trackingNumber || bo.awbNumber,
    trackingUrl: bo.trackingUrl,
    shippingLabelNumber: bo.shippingLabelNumber,
    invoiceNumber: bo.invoiceNumber,
    packageWeightKg: bo.packageWeightKg,
    packageDimensions: bo.packageDimensions,
    packedAt: bo.packedAt,
    shippedAt: bo.shippedAt,
    estimatedDeliveryDate: bo.estimatedDeliveryDate,
    deliveredAt: bo.deliveredAt,
    dispatchNotes: bo.dispatchNotes,
    timeline: buildTimeline(
      statusLower,
      bo.placedAt || bo.createdAt,
      bo.packedAt,
      bo.shippedAt,
      bo.deliveredAt
    ),
  };
}

export async function fetchOrders(): Promise<CustomerOrder[]> {
  try {
    const res = await apiGet<PageResponse<BackendOrder>>("/me/orders", {
      params: { size: 50 },
    });
    const content = res?.content || [];
    return content.map(mapBackendOrder);
  } catch (err) {
    console.warn("Failed to fetch orders from server:", err);
    return [];
  }
}

export async function fetchOrderById(id: string): Promise<CustomerOrder | null> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId) || numericId <= 0) {
    return null;
  }
  try {
    const res = await apiGet<BackendOrder>(`/me/orders/${numericId}`);
    if (res) return mapBackendOrder(res);
  } catch {
    // Return null if order not found
  }
  return null;
}

export interface CreateOrderInput {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  deliveryAddress: CustomerAddress;
  paymentMethod?: string;
  notes?: string;
  promoCode?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CustomerOrder> {
  const addressId = Number(input.deliveryAddress.id.replace(/\D/g, "") || "1");
  const localCart = getLocalCart();

  const sourceItems = input.items && input.items.length > 0 ? input.items : localCart.items;
  const items = sourceItems
    .map((it) => {
      const prodNum = Number(String(it.productId).replace(/\D/g, ""));
      return !isNaN(prodNum) && prodNum > 0
        ? { productId: prodNum, quantity: it.quantity > 0 ? it.quantity : 1 }
        : null;
    })
    .filter((it): it is { productId: number; quantity: number } => it !== null);

  const deliveryFee = typeof input.deliveryFee === "number" ? input.deliveryFee : (localCart.deliveryFee ?? 0);

  const checkoutPayload = {
    addressId: !isNaN(addressId) && addressId > 0 ? addressId : 1,
    notes: input.notes || "Order placed via web",
    cartId: localCart.id && localCart.id > 0 ? localCart.id : undefined,
    items: items.length > 0 ? items : undefined,
    promoCode: input.promoCode ? input.promoCode.trim().toUpperCase() : undefined,
    shippingFee: deliveryFee,
    deliveryFee: deliveryFee,
  };

  try {
    const res = await apiPost<BackendOrder>("/me/orders", checkoutPayload);
    if (res) return mapBackendOrder(res);
  } catch (err) {
    console.warn("Server checkout request failed, checking error:", err);
    throw err;

  }

  // Graceful local generation if cart was already cleared or mock fallback
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return {
    id: `ord-${Date.now()}`,
    orderNumber: `PC-ORD-${randomNum}`,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    deliveryFee: input.deliveryFee,
    total: input.total,
    itemCount: input.itemCount,
    deliveryAddress: input.deliveryAddress,
    status: "confirmed",
    paymentStatus: "processing",
    paymentMethod: input.paymentMethod || "Razorpay Gateway",
    createdAt: new Date().toISOString(),
    estimatedDelivery: "Expected in 2 business days",
    carrier: "PawConnect Express Logistics",
    trackingNumber: `PC-TRK-${randomNum}`,
    timeline: buildTimeline("confirmed"),
  };
}

export async function cancelOrder(orderId: string): Promise<CustomerOrder> {
  const numericId = Number(orderId.replace(/\D/g, ""));
  if (!isNaN(numericId) && numericId > 0) {
    const res = await apiPatch<BackendOrder>(`/me/orders/${numericId}/cancel`, {
      reason: "Customer cancellation request",
    });
    return mapBackendOrder(res);
  }

  const existing = await fetchOrderById(orderId);
  if (!existing) throw new Error("Order not found");
  return {
    ...existing,
    status: "cancelled",
    timeline: [
      ...existing.timeline,
      {
        status: "cancelled",
        label: "Order Cancelled",
        description: "Order cancelled by customer. Refund processing.",
        timestamp: "Just now",
        done: true,
        current: true,
      },
    ],
  };
}
