import type { CustomerAddress } from "./customer";

export type OrderStatus = "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "pending";
export type PaymentStatus = "paid" | "processing" | "failed" | "pending" | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  sku?: string;
  image: string;
  productImageUrl?: string;
  category: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp?: string;
  done: boolean;
  current?: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  deliveryAddress: CustomerAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber: string;
  carrier: string;
  courierPartner?: string;
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
  paymentExpiresAt?: string;
  remainingPaymentSeconds?: number;
  canRetryPayment?: boolean;
  timeline: OrderTimelineStep[];
  notes?: string;
  date?: string;
}

export const INITIAL_MOCK_ORDERS: CustomerOrder[] = [
  {
    id: "ord-1",
    orderNumber: "PC-ORD-90214",
    items: [
      {
        productId: "prod-1",
        name: "PawConnect Organic Salmon & Sweet Potato Kibble",
        image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
        category: "Pet Food",
        price: 49.99,
        quantity: 1,
        lineTotal: 49.99,
      },
      {
        productId: "prod-6",
        name: "Orthopedic Memory Foam Cloud Pet Bed",
        image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
        category: "Accessories",
        price: 79.99,
        quantity: 1,
        lineTotal: 79.99,
      },
    ],
    subtotal: 129.98,
    discount: 10.00,
    deliveryFee: 0,
    total: 119.98,
    itemCount: 2,
    deliveryAddress: {
      id: "addr-1",
      label: "Home",
      recipientName: "Jane Doe",
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
      phone: "+1 (555) 234-5678",
      isDefault: true,
      deliveryInstructions: "Leave inside gate if not home.",
    },
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "PawConnect Test Card (•••• 4242)",
    createdAt: "2026-10-02T14:22:00Z",
    estimatedDelivery: "Delivered on Oct 4, 2026",
    trackingNumber: "PC-EXP-84729104",
    carrier: "PawConnect Express Logistics",
    timeline: [
      {
        status: "confirmed",
        label: "Order Confirmed",
        description: "Payment verified & order sent to Central Warehouse",
        timestamp: "Oct 2, 2:22 PM",
        done: true,
      },
      {
        status: "packed",
        label: "Packed & Sealed",
        description: "In-house quality check passed, securely boxed",
        timestamp: "Oct 3, 9:15 AM",
        done: true,
      },
      {
        status: "shipped",
        label: "Out for Delivery",
        description: "Picked up by local delivery fleet",
        timestamp: "Oct 4, 8:40 AM",
        done: true,
      },
      {
        status: "delivered",
        label: "Delivered",
        description: "Package safely delivered to front door",
        timestamp: "Oct 4, 1:18 PM",
        done: true,
        current: true,
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "PC-ORD-91823",
    items: [
      {
        productId: "prod-2",
        name: "Freeze-Dried Real Chicken Breast Treats (120g)",
        image: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80",
        category: "Pet Food",
        price: 14.50,
        quantity: 2,
        lineTotal: 29.00,
      },
      {
        productId: "prod-7",
        name: "Oatmeal & Aloe Vera Soothing Dog Shampoo",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        category: "Grooming Products",
        price: 18.50,
        quantity: 1,
        lineTotal: 18.50,
      },
    ],
    subtotal: 47.50,
    discount: 0,
    deliveryFee: 5.99,
    total: 53.49,
    itemCount: 3,
    deliveryAddress: {
      id: "addr-1",
      label: "Home",
      recipientName: "Jane Doe",
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
      phone: "+1 (555) 234-5678",
      isDefault: true,
    },
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "PawConnect Test Card (•••• 4242)",
    createdAt: "2026-10-06T11:05:00Z",
    estimatedDelivery: "Expected Tomorrow by 4:00 PM",
    trackingNumber: "PC-EXP-93021948",
    carrier: "PawConnect Express Logistics",
    timeline: [
      {
        status: "confirmed",
        label: "Order Confirmed",
        description: "Payment verified & order sent to Central Warehouse",
        timestamp: "Oct 6, 11:05 AM",
        done: true,
      },
      {
        status: "packed",
        label: "Packed & Sealed",
        description: "In-house quality check passed",
        timestamp: "Oct 6, 3:30 PM",
        done: true,
      },
      {
        status: "shipped",
        label: "In Transit",
        description: "Dispatched from San Francisco Hub",
        timestamp: "Oct 7, 7:15 AM",
        done: true,
        current: true,
      },
      {
        status: "delivered",
        label: "Delivered",
        description: "Scheduled for home delivery",
        done: false,
      },
    ],
  },
];
