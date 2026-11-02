/**
 * Promo Codes & Discounts API Service
 * Connects Admin management and Customer validation to Spring Boot promo code endpoints.
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  type PageResponse,
} from "./client";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PromoCode {
  id: number;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
}

export type UpdatePromoCodeInput = Partial<CreatePromoCodeInput>;

export interface PromoValidationResponse {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

export interface PromoCodeQueryParams {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
}

// ─── ADMIN API FUNCTIONS ──────────────────────────────────────────────────────

/**
 * GET /api/admin/promo-codes
 * Paginated list of promo codes with optional search query and active filter.
 */
export async function fetchAdminPromoCodes(
  params?: PromoCodeQueryParams
): Promise<PageResponse<PromoCode>> {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params?.page !== undefined) queryParams.page = params.page;
  if (params?.size !== undefined) queryParams.size = params.size;
  if (params?.search?.trim()) queryParams.search = params.search.trim();
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

  const res = await apiGet<PageResponse<PromoCode>>("/admin/promo-codes", {
    params: queryParams,
  });

  return (
    res || {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    }
  );
}

/**
 * POST /api/admin/promo-codes
 * Creates a new promo code and records an audit log.
 */
export async function createAdminPromoCode(
  input: CreatePromoCodeInput
): Promise<PromoCode> {
  const payload = {
    ...input,
    code: input.code.trim().toUpperCase(),
    minOrderAmount: input.minOrderAmount ?? 0,
    perUserLimit: input.perUserLimit ?? 1,
    isActive: input.isActive ?? true,
  };

  return apiPost<PromoCode>("/admin/promo-codes", payload);
}

/**
 * PUT /api/admin/promo-codes/{id}
 * Updates an existing promo code and records an audit log.
 */
export async function updateAdminPromoCode(
  id: number,
  input: UpdatePromoCodeInput
): Promise<PromoCode> {
  const payload = {
    ...input,
    code: input.code ? input.code.trim().toUpperCase() : undefined,
  };

  return apiPut<PromoCode>(`/admin/promo-codes/${id}`, payload);
}

/**
 * PATCH /api/admin/promo-codes/{id}/status
 * Toggles promo code active status and records an audit log.
 */
export async function toggleAdminPromoCodeStatus(
  id: number,
  isActive: boolean
): Promise<PromoCode> {
  return apiPatch<PromoCode>(`/admin/promo-codes/${id}/status`, { isActive });
}

/**
 * DELETE /api/admin/promo-codes/{id}
 * Deletes or deactivates a promo code and records an audit log.
 */
export async function deleteAdminPromoCode(id: number): Promise<void> {
  await apiDelete<void>(`/admin/promo-codes/${id}`);
}

// ─── CUSTOMER API FUNCTIONS ───────────────────────────────────────────────────

/**
 * POST /api/me/cart/apply-promo
 * Validates a promo code against the customer's current active cart in the DB.
 */
export async function validateCartPromoCode(
  code: string
): Promise<PromoValidationResponse> {
  return apiPost<PromoValidationResponse>("/me/cart/apply-promo", {
    code: code.trim().toUpperCase(),
  });
}

// ─── UTILITY HELPERS ──────────────────────────────────────────────────────────

/**
 * Helper to generate random marketing promo codes (e.g. PAW25X, PAWSUMMER, etc.)
 */
export function generateRandomPromoCode(prefix = "PAW"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.trim().toUpperCase()}${randomPart}`;
}
