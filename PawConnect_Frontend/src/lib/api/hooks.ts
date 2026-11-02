import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/utils/toast";
import {
  fetchAdminPromoCodes,
  createAdminPromoCode,
  updateAdminPromoCode,
  toggleAdminPromoCodeStatus,
  deleteAdminPromoCode,
  validateCartPromoCode,
  type PromoCode,
  type CreatePromoCodeInput,
  type UpdatePromoCodeInput,
  type PromoValidationResponse,
  type PromoCodeQueryParams,
} from "./promo-codes";
import {
  fetchPublicVeterinarians,
  fetchPublicVeterinarianById,
  fetchPublicServiceProviders,
  fetchPublicServiceProviderById,
  fetchPublicReviews,
  submitCustomerReview,
  type BackendPublicVeterinarian,
  type BackendPublicServiceProvider,
  type BackendPublicReview,
  type CreateReviewInput,
} from "./discovery";
import {
  fetchPets,
  fetchPetById,
  createPet,
  updatePet,
  deletePet,
  addVaccinationRecord,
  deleteVaccinationRecord,
  addMedicalRecord,
  deleteMedicalRecord,
  type Pet,
  type VaccinationRecord,
  type MedicalRecord,
} from "./pets";
import {
  fetchBookings,
  fetchBookingById,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  type CustomerBooking,
  type CreateBookingInput,
} from "./bookings";
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type CustomerProfile,
  type CustomerAddress,
} from "./customer";
import {
  fetchProducts,
  fetchProductById,
  type EnrichedProductItem,
  type ProductItem,
} from "./products";
import { getStoredAccessToken, type PageResponse } from "./client";
import { calculateLineTotal } from "@/lib/utils/money";
import {
  type Cart,
  type CartItem,
  EMPTY_CART,
  recalculateCart,
  fetchServerCart,
  addServerCartItem,
  updateServerCartItemQuantity,
  updateServerProductQuantity,
  removeServerCartItem,
  clearServerCart,
  matchesProductId,
} from "./cart";
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  cancelOrder,
  type CustomerOrder,
  type CreateOrderInput,
} from "./orders";
import {
  fetchReviewsByProductId,
  addReview,
  type ProductReview,
  type AddReviewInput,
} from "./reviews";
import { changePassword, type ChangePasswordRequest } from "./auth";
import {
  fetchVetProfile,
  updateVetProfile,
  fetchProviderProfile,
  updateProviderProfile,
  fetchProfessionalAvailability,
  updateProfessionalAvailability,
  fetchVetAppointments,
  fetchVetAppointmentById,
  updateVetAppointmentStatus,
  fetchProviderBookings,
  fetchProviderBookingById,
  updateProviderBookingStatus,
  fetchProviderServices,
  createProviderService,
  updateProviderService,
  toggleProviderServiceActive,
  deleteProviderService,
  type CreateProviderServiceInput,
} from "./professional";
import type {
  VeterinarianProfile,
  ServiceProviderProfile,
  ProfessionalAvailability,
  DaySchedule,
  ProfessionalAppointment,
  ProfessionalAppointmentStatus,
  ProviderBooking,
  ProviderService,
  VerificationStatus,
} from "@/lib/mock/professionals";
import type { OrderStatus } from "@/lib/mock/orders";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserBlockStatus,
  fetchAdminVeterinarians,
  createAdminVeterinarian,
  updateAdminVetVerification,
  type AdminRegisterVetInput,
  fetchAdminProviders,
  createAdminServiceProvider,
  updateAdminProviderVerification,
  type AdminRegisterProviderInput,
  fetchAdminBookings,
  updateAdminBookingStatus,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  toggleAdminProductActive,
  deleteAdminProduct,
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  fetchAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderStatus,
  bulkUpdateAdminOrderStatus,
  getShippingLabel,
  getBulkShippingLabels,
  type ShippingLabelResponse,
  type UpdateOrderStatusOptions,
  fetchAdminReviews,
  toggleAdminReviewVisibility,
  deleteAdminReview,
  resolveAdminReviewReport,
  fetchAdminReports,
  updateAdminReportStatus,
  fetchAuditLogs,
  fetchAdminNotifications,
  createAdminNotification,
  resendAdminNotification,
  deleteAdminNotification,
  fetchAdminSettings,
  updateAdminSettings,
  fetchAdminAnalytics,
  type AdminReviewItem,
  type AdminAnalyticsSummary,
} from "./admin";
import type {
  AdminUser,
  AdminCategory,
  AdminGlobalBooking,
  AdminReport,
  AdminAuditLog,
  AdminNotificationItem,
  AdminPlatformSettings,
  PlatformRole,
  UserStatus,
} from "@/lib/mock/admin";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "./notifications";

export type { AdminRegisterVetInput, AdminRegisterProviderInput, EnrichedProductItem, ProductItem, NotificationItem };

// ─── PETS HOOKS ─────────────────────────────────────────────────────────────

export function usePets() {
  return useQuery<Pet[]>({
    queryKey: ["customer-pets"],
    queryFn: fetchPets,
  });
}

export function usePet(id: string) {
  return useQuery<Pet | null>({
    queryKey: ["customer-pet", id],
    queryFn: () => fetchPetById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pet> & { name: string; species: string }) =>
      createPet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pet>;
    }) => updatePet(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
      queryClient.invalidateQueries({ queryKey: ["customer-pet", variables.id] });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
    },
  });
}

export function useAddVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      record,
    }: {
      petId: string;
      record: Omit<VaccinationRecord, "id" | "petId">;
    }) => addVaccinationRecord(petId, record),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
      queryClient.invalidateQueries({ queryKey: ["customer-pet", variables.petId] });
    },
  });
}

export function useDeleteVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      vaccinationId,
    }: {
      petId: string;
      vaccinationId: string;
    }) => deleteVaccinationRecord(petId, vaccinationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
      queryClient.invalidateQueries({ queryKey: ["customer-pet", variables.petId] });
    },
  });
}

export function useAddMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      record,
    }: {
      petId: string;
      record: Omit<MedicalRecord, "id" | "petId">;
    }) => addMedicalRecord(petId, record),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
      queryClient.invalidateQueries({ queryKey: ["customer-pet", variables.petId] });
    },
  });
}

export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      petId,
      recordId,
    }: {
      petId: string;
      recordId: string;
    }) => deleteMedicalRecord(petId, recordId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-pets"] });
      queryClient.invalidateQueries({ queryKey: ["customer-pet", variables.petId] });
    },
  });
}

// ─── BOOKINGS HOOKS ─────────────────────────────────────────────────────────

export function useBookings() {
  return useQuery<CustomerBooking[]>({
    queryKey: ["customer-bookings"],
    queryFn: fetchBookings,
  });
}

export function useBooking(id: string) {
  return useQuery<CustomerBooking | null>({
    queryKey: ["customer-booking", id],
    queryFn: () => fetchBookingById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["customer-booking", id] });
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      time,
    }: {
      id: string;
      date: string;
      time: string;
    }) => rescheduleBooking(id, date, time),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["customer-booking", variables.id] });
    },
  });
}

// ─── CUSTOMER PROFILE & ADDRESSES ───────────────────────────────────────────

export function useCustomerProfile() {
  return useQuery<CustomerProfile>({
    queryKey: ["customer-profile"],
    queryFn: fetchCustomerProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerProfile>) => updateCustomerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  });
}

export function useAddresses() {
  return useQuery<CustomerAddress[]>({
    queryKey: ["customer-addresses"],
    queryFn: fetchAddresses,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CustomerAddress, "id">) => addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerAddress> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

// ─── PRODUCTS HOOKS ──────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery<EnrichedProductItem[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

export function useProduct(id: string) {
  return useQuery<EnrichedProductItem | null>({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
    enabled: Boolean(id),
  });
}

// ─── CART HOOKS ──────────────────────────────────────────────────────────────

export const CART_QUERY_KEY = ["cart"] as const;

export function useCart() {
  const queryClient = useQueryClient();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthenticated = Boolean(token);

  return useQuery<Cart>({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const prevCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      return fetchServerCart(prevCart?.promoCode, prevCart?.items);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

function mergeServerCartWithCache(prev: Cart | undefined, serverCart: Cart): Cart {
  if (!prev) return serverCart;
  return {
    ...serverCart,
    promoCode: prev.promoCode || serverCart.promoCode,
    items: serverCart.items.map((srvItem) => {
      const prevItem = prev.items.find(
        (p) =>
          (srvItem.cartItemId && p.cartItemId === srvItem.cartItemId) ||
          matchesProductId(p.productId, srvItem.productId)
      );
      return {
        ...srvItem,
        image: prevItem?.image || srvItem.image,
        category: prevItem?.category || srvItem.category,
      };
    }),
  };
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation<
    Cart,
    Error,
    { product: ProductItem; quantity?: number },
    { previousCart?: Cart }
  >({
    mutationFn: async ({ product, quantity = 1 }) => {
      const prodId = String(product.id || "").trim();
      const numId = Number(prodId.replace(/\D/g, "") || "0");
      if (!numId) throw new Error("Invalid product ID");

      const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      // Spring Boot backend POST /api/me/cart/items automatically increments quantity
      // if already present, or creates a new item if not.
      return addServerCartItem(numId, quantity, currentCart?.items);
    },
    onMutate: async ({ product, quantity = 1 }) => {
      // 1. Cancel in-flight queries so late responses cannot overwrite optimistic cache
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY) ?? EMPTY_CART;

      const prodId = String(product.id || "").trim();
      const maxStock =
        (product as { stockQuantity?: number }).stockQuantity ??
        product.stock ??
        50;

      const existingIdx = previousCart.items.findIndex((it) =>
        matchesProductId(it.productId, prodId)
      );

      let updatedItems: CartItem[];
      if (existingIdx > -1) {
        const existing = previousCart.items[existingIdx];
        const newQty = Math.min(existing.quantity + quantity, maxStock);
        updatedItems = previousCart.items.map((it, idx) =>
          idx === existingIdx
            ? {
                ...it,
                quantity: newQty,
                lineTotal: calculateLineTotal(it.price, newQty),
              }
            : it
        );
      } else {
        const newItem: CartItem = {
          productId: prodId,
          name: product.name,
          price: Number(product.price || 0),
          originalPrice: product.originalPrice,
          image: product.images?.[0] || (product as { image?: string }).image || "",
          category: product.category || "Pet Supplies",
          quantity,
          stock: maxStock,
          lineTotal: calculateLineTotal(Number(product.price || 0), quantity),
        };
        updatedItems = [...previousCart.items, newItem];
      }

      const nextCart = recalculateCart(updatedItems, previousCart.promoCode);
      queryClient.setQueryData<Cart>(CART_QUERY_KEY, nextCart);

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: (serverCart) => {
      // Direct cache write: prevents out-of-order refetches and loading skeletons
      if (serverCart) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) =>
          mergeServerCartWithCache(prev, serverCart)
        );
      }
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();

  return useMutation<
    Cart,
    Error,
    { productId: string | number; quantity: number; cartItemId?: number },
    { previousCart?: Cart }
  >({
    mutationFn: async ({ productId, quantity, cartItemId }) => {
      const prodId = String(productId || "").trim();
      const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      const existing = currentCart?.items.find(
        (it) =>
          (cartItemId !== undefined && it.cartItemId === cartItemId) ||
          matchesProductId(it.productId, prodId)
      );
      const targetCartItemId = cartItemId ?? existing?.cartItemId;

      // 1. Primary path: Use cartItemId directly with PUT /api/me/cart/items/{cartItemId}
      if (targetCartItemId) {
        if (quantity <= 0) {
          return removeServerCartItem(targetCartItemId, currentCart?.items);
        }
        return updateServerCartItemQuantity(targetCartItemId, quantity, currentCart?.items);
      }

      // 2. Fallback: Set exact product quantity via PUT /api/me/cart/products/{productId}
      const numId = Number(prodId.replace(/\D/g, "") || "0");
      if (numId > 0) {
        return updateServerProductQuantity(numId, Math.max(0, quantity), currentCart?.items);
      }

      return fetchServerCart();
    },
    onMutate: async ({ productId, quantity, cartItemId }) => {
      // 1. Cancel in-flight cart queries so background refetches cannot overwrite newer state
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY) ?? EMPTY_CART;

      const prodId = String(productId || "").trim();
      let updatedItems: CartItem[];

      if (quantity <= 0) {
        updatedItems = previousCart.items.filter(
          (it) =>
            !(
              (cartItemId !== undefined && it.cartItemId === cartItemId) ||
              matchesProductId(it.productId, prodId)
            )
        );
      } else {
        const exists = previousCart.items.some(
          (it) =>
            (cartItemId !== undefined && it.cartItemId === cartItemId) ||
            matchesProductId(it.productId, prodId)
        );

        if (exists) {
          updatedItems = previousCart.items.map((it) => {
            const isMatch =
              (cartItemId !== undefined && it.cartItemId === cartItemId) ||
              matchesProductId(it.productId, prodId);
            if (!isMatch) return it;
            return {
              ...it,
              quantity,
              lineTotal: calculateLineTotal(it.price, quantity),
            };
          });
        } else {
          updatedItems = [...previousCart.items];
        }
      }

      // Optimistically update query cache immediately (recalculating subtotal, totalItems, Grand Total)
      const nextCart = recalculateCart(updatedItems, previousCart.promoCode);
      queryClient.setQueryData<Cart>(CART_QUERY_KEY, nextCart);

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: async (serverCart) => {
      // Direct cache write without triggering invalidation and full-page loading flickers
      if (serverCart) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) =>
          mergeServerCartWithCache(prev, serverCart)
        );

        // If a promo code is currently active, re-validate against updated subtotal
        const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
        if (currentCart?.promoCode) {
          try {
            const promoRes = await validateCartPromoCode(currentCart.promoCode);
            queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) => {
              if (!prev) return prev;
              const discount = Number(promoRes.discountAmount || 0);
              return {
                ...prev,
                promoCode: promoRes.code,
                discount,
                total: Math.max(0, prev.subtotal - discount + prev.deliveryFee),
              };
            });
          } catch (err: unknown) {
            const reason =
              err instanceof Error
                ? err.message
                : "Cart subtotal no longer meets promo code requirements.";
            const removedCode = currentCart.promoCode;
            queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                promoCode: undefined,
                discount: 0,
                total: Math.max(0, prev.subtotal + prev.deliveryFee),
              };
            });
            toast.warning(`Promo code ${removedCode} removed`, {
              description: reason,
            });
          }
        }
      }
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation<
    Cart,
    Error,
    { productId: string | number; cartItemId?: number },
    { previousCart?: Cart }
  >({
    mutationFn: async ({ productId, cartItemId }) => {
      const prodId = String(productId || "").trim();
      const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      const existing = currentCart?.items.find(
        (it) =>
          (cartItemId !== undefined && it.cartItemId === cartItemId) ||
          matchesProductId(it.productId, prodId)
      );
      const targetCartItemId = cartItemId ?? existing?.cartItemId;

      if (targetCartItemId) {
        return removeServerCartItem(targetCartItemId, currentCart?.items);
      }

      const numId = Number(prodId.replace(/\D/g, "") || "0");
      if (numId > 0) {
        return updateServerProductQuantity(numId, 0, currentCart?.items);
      }

      return fetchServerCart();
    },
    onMutate: async ({ productId, cartItemId }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY) ?? EMPTY_CART;

      const prodId = String(productId || "").trim();
      const updatedItems = previousCart.items.filter(
        (it) =>
          !(
            (cartItemId !== undefined && it.cartItemId === cartItemId) ||
            matchesProductId(it.productId, prodId)
          )
      );

      const nextCart = recalculateCart(updatedItems, previousCart.promoCode);
      queryClient.setQueryData<Cart>(CART_QUERY_KEY, nextCart);

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: async (serverCart) => {
      if (serverCart) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) =>
          mergeServerCartWithCache(prev, serverCart)
        );

        const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
        if (currentCart?.promoCode) {
          try {
            const promoRes = await validateCartPromoCode(currentCart.promoCode);
            queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) => {
              if (!prev) return prev;
              const discount = Number(promoRes.discountAmount || 0);
              return {
                ...prev,
                promoCode: promoRes.code,
                discount,
                total: Math.max(0, prev.subtotal - discount + prev.deliveryFee),
              };
            });
          } catch (err: unknown) {
            const reason =
              err instanceof Error
                ? err.message
                : "Cart subtotal no longer meets promo code requirements.";
            const removedCode = currentCart.promoCode;
            queryClient.setQueryData<Cart>(CART_QUERY_KEY, (prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                promoCode: undefined,
                discount: 0,
                total: Math.max(0, prev.subtotal + prev.deliveryFee),
              };
            });
            toast.warning(`Promo code ${removedCode} removed`, {
              description: reason,
            });
          }
        }
      }
    },
  });
}

export function useApplyPromoCode() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, string>({
    mutationFn: async (promoCode: string) => {
      const trimmed = promoCode.trim().toUpperCase();
      const currentCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY) ?? EMPTY_CART;

      // Clearing promo code
      if (!trimmed) {
        const clearedCart: Cart = {
          ...currentCart,
          promoCode: undefined,
          discount: 0,
          total: Math.max(0, currentCart.subtotal + currentCart.deliveryFee),
        };
        return clearedCart;
      }

      // Check if customer is authenticated
      const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
      if (token) {
        const validation = await validateCartPromoCode(trimmed);
        const discountAmount = Number(validation.discountAmount || 0);
        const updatedCart: Cart = {
          ...currentCart,
          promoCode: validation.code,
          discount: discountAmount,
          total: Math.max(0, currentCart.subtotal - discountAmount + currentCart.deliveryFee),
        };
        return updatedCart;
      }

      // Guest fallback: recalculate using standard rules
      return recalculateCart(currentCart.items, trimmed);
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, void, { previousCart?: Cart }>({
    mutationFn: clearServerCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY) ?? EMPTY_CART;
      queryClient.setQueryData<Cart>(CART_QUERY_KEY, EMPTY_CART);
      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(CART_QUERY_KEY, EMPTY_CART);
    },
  });
}

// ─── ORDERS HOOKS ────────────────────────────────────────────────────────────

export function useOrders() {
  return useQuery<CustomerOrder[]>({
    queryKey: ["customer-orders"],
    queryFn: fetchOrders,
  });
}

export function useOrder(id: string) {
  return useQuery<CustomerOrder | null>({
    queryKey: ["customer-order", id],
    queryFn: () => fetchOrderById(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["customer-cart"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-order", orderId] });
    },
  });
}

// ─── CUSTOMER NOTIFICATIONS HOOKS ──────────────────────────────────────────

export function useCustomerNotifications(unreadOnly = false) {
  return useQuery<NotificationItem[]>({
    queryKey: ["customer-notifications", unreadOnly],
    queryFn: () => fetchNotifications(unreadOnly),
  });
}

export function useCustomerUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ["customer-notifications-unread-count"],
    queryFn: fetchUnreadCount,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications-unread-count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications-unread-count"] });
    },
  });
}

// ─── REVIEWS HOOKS ───────────────────────────────────────────────────────────

export function useProductReviews(productId: string) {
  return useQuery<ProductReview[]>({
    queryKey: ["product-reviews", productId],
    queryFn: () => fetchReviewsByProductId(productId),
    enabled: Boolean(productId),
  });
}

export function useAddProductReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddReviewInput) => addReview(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-reviews", variables.productId],
      });
    },
  });
}

// ─── PROFESSIONAL PORTAL HOOKS ──────────────────────────────────────────────

export function useVetProfile() {
  return useQuery<VeterinarianProfile>({
    queryKey: ["vet-profile"],
    queryFn: fetchVetProfile,
  });
}

export function useUpdateVetProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<VeterinarianProfile>) => updateVetProfile(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["vet-profile"], updated);
    },
  });
}

export function useProviderProfile() {
  return useQuery<ServiceProviderProfile>({
    queryKey: ["provider-profile"],
    queryFn: fetchProviderProfile,
  });
}

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<ServiceProviderProfile>) => updateProviderProfile(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["provider-profile"], updated);
    },
  });
}

export function useProfessionalAvailability(role: "vet" | "provider") {
  return useQuery<ProfessionalAvailability>({
    queryKey: ["professional-availability", role],
    queryFn: () => fetchProfessionalAvailability(role),
  });
}

export function useUpdateProfessionalAvailability(role: "vet" | "provider") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schedule, notes }: { schedule: DaySchedule[]; notes?: string }) =>
      updateProfessionalAvailability(role, schedule, notes),
    onSuccess: (updated) => {
      queryClient.setQueryData(["professional-availability", role], updated);
    },
  });
}

export function useVetAppointments() {
  return useQuery<ProfessionalAppointment[]>({
    queryKey: ["vet-appointments"],
    queryFn: fetchVetAppointments,
  });
}

export function useVetAppointment(id: string) {
  return useQuery<ProfessionalAppointment | null>({
    queryKey: ["vet-appointment", id],
    queryFn: () => fetchVetAppointmentById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateVetAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ProfessionalAppointmentStatus;
      notes?: string;
    }) => updateVetAppointmentStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vet-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["vet-appointment", variables.id] });
    },
  });
}

export function useProviderBookings() {
  return useQuery<ProviderBooking[]>({
    queryKey: ["provider-bookings"],
    queryFn: fetchProviderBookings,
  });
}

export function useProviderBooking(id: string) {
  return useQuery<ProviderBooking | null>({
    queryKey: ["provider-booking", id],
    queryFn: () => fetchProviderBookingById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateProviderBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ProfessionalAppointmentStatus;
      notes?: string;
    }) => updateProviderBookingStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-booking", variables.id] });
    },
  });
}

export function useProviderServices() {
  return useQuery<ProviderService[]>({
    queryKey: ["provider-services"],
    queryFn: fetchProviderServices,
  });
}

export function useCreateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProviderServiceInput) => createProviderService(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
    },
  });
}

export function useUpdateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateProviderServiceInput>;
    }) => updateProviderService(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
    },
  });
}

export function useToggleProviderServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleProviderServiceActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
    },
  });
}

export function useDeleteProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProviderService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
    },
  });
}

// ─── ADMIN PORTAL HOOKS ──────────────────────────────────────────────────────

// Users
export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      phone: string;
      role: PlatformRole;
      status: UserStatus;
      avatar?: string;
      password?: string;
    }) => createAdminUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminUser> }) =>
      updateAdminUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useToggleUserBlockStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleUserBlockStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Veterinarians
export function useAdminVeterinarians() {
  return useQuery<VeterinarianProfile[]>({
    queryKey: ["admin-veterinarians"],
    queryFn: fetchAdminVeterinarians,
  });
}

export function useCreateAdminVeterinarian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminRegisterVetInput) => createAdminVeterinarian(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-veterinarians"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useUpdateAdminVetVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      updateAdminVetVerification(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-veterinarians"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

// Service Providers
export function useAdminProviders() {
  return useQuery<ServiceProviderProfile[]>({
    queryKey: ["admin-providers"],
    queryFn: fetchAdminProviders,
  });
}

export function useCreateAdminServiceProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminRegisterProviderInput) => createAdminServiceProvider(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useUpdateAdminProviderVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      updateAdminProviderVerification(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

// Global Bookings
export function useAdminBookings() {
  return useQuery<AdminGlobalBooking[]>({
    queryKey: ["admin-bookings"],
    queryFn: fetchAdminBookings,
  });
}

export function useUpdateAdminBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProfessionalAppointmentStatus }) =>
      updateAdminBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Products
export function useAdminProducts() {
  return useQuery<EnrichedProductItem[]>({
    queryKey: ["admin-products"],
    queryFn: fetchAdminProducts,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EnrichedProductItem, "id">) => createAdminProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["inhouse-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EnrichedProductItem> }) =>
      updateAdminProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["inhouse-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useToggleAdminProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleAdminProductActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["inhouse-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useDeleteAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["inhouse-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

// Categories
export function useAdminCategories() {
  return useQuery<AdminCategory[]>({
    queryKey: ["admin-categories"],
    queryFn: fetchAdminCategories,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; description: string; active: boolean }) =>
      createAdminCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminCategory> }) =>
      updateAdminCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Orders
export function useAdminOrders() {
  return useQuery<CustomerOrder[]>({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders,
  });
}

export function useAdminOrder(id: string) {
  return useQuery<CustomerOrder | null>({
    queryKey: ["admin-order", id],
    queryFn: () => fetchAdminOrderById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      note,
      ...options
    }: {
      orderId: string;
      status: OrderStatus;
      note?: string;
    } & Partial<UpdateOrderStatusOptions>) =>
      updateAdminOrderStatus(orderId, status, { note, ...options }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-label", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useBulkUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderIds,
      status,
      note,
      ...options
    }: {
      orderIds: (string | number)[];
      status: OrderStatus;
      note?: string;
    } & Partial<UpdateOrderStatusOptions>) =>
      bulkUpdateAdminOrderStatus(orderIds, status, { note, ...options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

export function useShippingLabel(orderId: string | number | null | undefined, enabled: boolean = true) {
  return useQuery<ShippingLabelResponse>({
    queryKey: ["admin-shipping-label", orderId],
    queryFn: () => getShippingLabel(orderId!),
    enabled: Boolean(orderId) && enabled,
  });
}

export function useBulkShippingLabels(
  orderIds: (string | number)[],
  enabled: boolean = true
) {
  return useQuery<ShippingLabelResponse[]>({
    queryKey: ["admin-bulk-shipping-labels", orderIds],
    queryFn: () => getBulkShippingLabels(orderIds),
    enabled: orderIds.length > 0 && enabled,
  });
}

// Reviews Moderation
export function useAdminReviews() {
  return useQuery<AdminReviewItem[]>({
    queryKey: ["admin-reviews"],
    queryFn: fetchAdminReviews,
  });
}

export function useToggleAdminReviewVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleAdminReviewVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useDeleteAdminReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

export function useResolveAdminReviewReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveAdminReviewReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Reports
export function useAdminReports() {
  return useQuery<AdminReport[]>({
    queryKey: ["admin-reports"],
    queryFn: fetchAdminReports,
  });
}

export function useUpdateAdminReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      resolutionNote,
    }: {
      id: string;
      status: AdminReport["status"];
      resolutionNote?: string;
    }) => updateAdminReportStatus(id, status, resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Audit Logs
export function useAuditLogs() {
  return useQuery<AdminAuditLog[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: fetchAuditLogs,
  });
}

// Notifications (Broadcast Announcements)
export function useAdminNotifications() {
  return useQuery<AdminNotificationItem[]>({
    queryKey: ["admin-notifications"],
    queryFn: fetchAdminNotifications,
  });
}
export const useBroadcastNotifications = useAdminNotifications;

export function useCreateAdminNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      message: string;
      audience: AdminNotificationItem["audience"];
      type: AdminNotificationItem["type"];
    }) => createAdminNotification(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications-unread-count"] });
    },
  });
}
export const useCreateBroadcast = useCreateAdminNotification;
export const useSendBroadcast = useCreateAdminNotification;

export function useResendAdminNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendAdminNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications-unread-count"] });
    },
  });
}
export const useResendBroadcast = useResendAdminNotification;

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["customer-notifications-unread-count"] });
    },
  });
}
export const useDeleteBroadcast = useDeleteAdminNotification;

// Settings
export function useAdminSettings() {
  return useQuery<AdminPlatformSettings>({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<AdminPlatformSettings>) => updateAdminSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
  });
}

// Analytics
export function useAdminAnalytics() {
  return useQuery<AdminAnalyticsSummary>({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });
}

// ─── PUBLIC DISCOVERY & GENUINE REVIEWS ─────────────────────────────────────
export type {
  BackendPublicVeterinarian,
  BackendPublicServiceProvider,
  BackendPublicReview,
  CreateReviewInput,
} from "./discovery";

export function usePublicVeterinarians(params?: { search?: string; specialization?: string }) {
  return useQuery<BackendPublicVeterinarian[]>({
    queryKey: ["public-veterinarians", params?.search, params?.specialization],
    queryFn: () => fetchPublicVeterinarians(params),
  });
}

export function usePublicVeterinarian(id: string | number) {
  return useQuery<BackendPublicVeterinarian | null>({
    queryKey: ["public-veterinarian", id],
    queryFn: () => fetchPublicVeterinarianById(id),
    enabled: Boolean(id),
  });
}

export function usePublicServiceProviders(params?: { search?: string; providerType?: "GROOMER" | "TRAINER" }) {
  return useQuery<BackendPublicServiceProvider[]>({
    queryKey: ["public-service-providers", params?.search, params?.providerType],
    queryFn: () => fetchPublicServiceProviders(params),
  });
}

export function usePublicServiceProvider(id: string | number) {
  return useQuery<BackendPublicServiceProvider | null>({
    queryKey: ["public-service-provider", id],
    queryFn: () => fetchPublicServiceProviderById(id),
    enabled: Boolean(id),
  });
}

export function usePublicReviews(params?: { veterinarianId?: number; providerId?: number; productId?: number }) {
  return useQuery<BackendPublicReview[]>({
    queryKey: ["public-reviews", params?.veterinarianId, params?.providerId, params?.productId],
    queryFn: () => fetchPublicReviews(params),
  });
}

export function useSubmitCustomerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => submitCustomerReview(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["public-veterinarians"] });
      queryClient.invalidateQueries({ queryKey: ["public-service-providers"] });
    },
  });
}

// ─── Admin Payment History & Ledger Hooks ───────────────────────────────────

import {
  fetchAdminPayments,
  fetchAdminPaymentSummary,
  fetchAdminPaymentById,
  adminRefundPayment,
  getOrderInvoice,
  getAppointmentInvoice,
  getServiceBookingInvoice,
  getPaymentInvoice,
  type InvoiceResponse,
  type InvoiceLineItem,
  type AdminPaymentFilters,
  type AdminPaymentsPageResponse,
  type AdminPaymentSummary,
  type AdminPaymentRecord,
} from "./payments";

export type { InvoiceResponse, InvoiceLineItem };

export function useAdminPayments(filters: AdminPaymentFilters = {}) {
  return useQuery<AdminPaymentsPageResponse>({
    queryKey: [
      "admin-payments",
      filters.page,
      filters.size,
      filters.sort,
      filters.status,
      filters.paymentFor,
      filters.search,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: () => fetchAdminPayments(filters),
  });
}

export function useAdminPaymentSummary() {
  return useQuery<AdminPaymentSummary>({
    queryKey: ["admin-payment-summary"],
    queryFn: () => fetchAdminPaymentSummary(),
    refetchInterval: 30000,
  });
}

export function useAdminPaymentDetail(id: number | null) {
  return useQuery<AdminPaymentRecord | null>({
    queryKey: ["admin-payment-detail", id],
    queryFn: () => (id ? fetchAdminPaymentById(id) : null),
    enabled: Boolean(id),
  });
}

export function useAdminRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ razorpayOrderId, reason }: { razorpayOrderId: string; reason?: string }) =>
      adminRefundPayment(razorpayOrderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-detail"] });
    },
  });
}

// ─── UNIVERSAL GST TAX INVOICE HOOK ──────────────────────────────────────────

export function useInvoice(
  type: "ORDER" | "APPOINTMENT" | "SERVICE_BOOKING" | "PAYMENT",
  id?: string | number | null,
  enabled: boolean = true
) {
  return useQuery<InvoiceResponse>({
    queryKey: ["invoice", type, id],
    queryFn: () => {
      if (!id) throw new Error("Invoice identifier required");
      if (type === "ORDER") return getOrderInvoice(id);
      if (type === "APPOINTMENT") return getAppointmentInvoice(id);
      if (type === "SERVICE_BOOKING") return getServiceBookingInvoice(id);
      return getPaymentInvoice(id);
    },
    enabled: Boolean(id) && enabled,
  });
}

// ─── ADMIN PROMO CODES HOOKS ────────────────────────────────────────────────

export function useAdminPromoCodes(params?: PromoCodeQueryParams) {
  return useQuery<PageResponse<PromoCode>>({
    queryKey: ["admin-promo-codes", params],
    queryFn: () => fetchAdminPromoCodes(params),
  });
}

export function useCreateAdminPromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromoCodeInput) => createAdminPromoCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
  });
}

export function useUpdateAdminPromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePromoCodeInput }) =>
      updateAdminPromoCode(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
  });
}

export function useToggleAdminPromoCodeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleAdminPromoCodeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
  });
}

export function useDeleteAdminPromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminPromoCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
  });
}

export type {
  PromoCode,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  PromoValidationResponse,
  PromoCodeQueryParams,
};




