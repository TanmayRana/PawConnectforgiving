/**
 * Centralized money & calculation utilities for PawConnect In-House Pet Shop
 */

export function formatMoney(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function calculateLineTotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

export function calculateCartSubtotal(
  items: { price: number; quantity: number }[]
): number {
  const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return Math.round(sum * 100) / 100;
}

export function calculateDiscount(subtotal: number, promoCode?: string): number {
  if (!promoCode) return 0;
  const normalized = promoCode.trim().toUpperCase();
  if (normalized === "PAW10") {
    return Math.round(subtotal * 0.1 * 100) / 100; // 10% off
  }
  if (normalized === "WELCOME20") {
    return Math.round(subtotal * 0.2 * 100) / 100; // 20% off
  }
  return 0;
}

export function calculateDelivery(subtotal: number): number {
  // Free delivery on orders over ₹500, otherwise flat ₹49
  if (subtotal === 0 || subtotal >= 500) {
    return 0;
  }
  return 49;
}

export function calculateOrderTotal(
  subtotal: number,
  discount: number,
  delivery: number
): number {
  const total = subtotal - discount + delivery;
  return Math.max(0, Math.round(total * 100) / 100);
}
