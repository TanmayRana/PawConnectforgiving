/**
 * Admin Portal API Service
 * Connects all administrative pages to Spring Boot Admin APIs from Phase 7.
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  type PageResponse,
} from "./client";
import {
  type AdminUser,
  type AdminCategory,
  type AdminGlobalBooking,
  type AdminReport,
  type AdminAuditLog,
  type AdminNotificationItem,
  type AdminPlatformSettings,
  type PlatformRole,
  type UserStatus,
  INITIAL_ADMIN_SETTINGS,
  INITIAL_ADMIN_USERS,
} from "@/lib/mock/admin";
import {
  type VeterinarianProfile,
  type ServiceProviderProfile,
  type VerificationStatus,
  type ProfessionalAppointmentStatus,
  INITIAL_VET_PROFILE,
  INITIAL_PROVIDER_PROFILE,
} from "@/lib/mock/professionals";
import {
  type EnrichedProductItem,
  mapBackendProductToUi,
  type BackendProduct,
} from "./products";
import {
  type CustomerOrder,
  type OrderStatus,
  mapBackendOrder,
  type BackendOrder,
} from "./orders";

// Export all domain types
export type {
  AdminUser,
  AdminCategory,
  AdminGlobalBooking,
  AdminReport,
  AdminAuditLog,
  AdminNotificationItem,
  AdminPlatformSettings,
  PlatformRole,
  UserStatus,
  VeterinarianProfile,
  ServiceProviderProfile,
  VerificationStatus,
  ProfessionalAppointmentStatus,
  EnrichedProductItem,
  CustomerOrder,
  OrderStatus,
};

// ─── BACKEND DTO CONTRACTS ───────────────────────────────────────────────────

export interface BackendUserResponse {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string;
  roles?: string[];
  profileImage?: string;
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED" | "PENDING_VERIFICATION";
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface BackendAdminVetResponse {
  id: number;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  specialization?: string;
  qualification?: string;
  licenseNumber?: string;
  experienceYears?: number;
  clinicName?: string;
  clinicAddress?: string;
  clinicLatitude?: number;
  clinicLongitude?: number;
  consultationFee?: number;
  bio?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendAdminProviderResponse {
  id: number;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  providerType: "GROOMING" | "TRAINING" | "BOARDING" | "PET_SITTING";
  businessName?: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  experienceYears?: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendCategoryResponse {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface BackendReviewResponse {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  appointmentId?: number;
  serviceBookingId?: number;
  orderItemId?: number;
  rating: number;
  reviewText?: string;
  status: "VISIBLE" | "REPORTED" | "HIDDEN" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendReportResponse {
  id: number;
  reportedById?: number;
  reportedByName?: string;
  reportedByEmail?: string;
  reportType: "USER" | "SERVICE" | "PRODUCT" | "REVIEW";
  targetType?: string;
  targetId?: number;
  reason?: string;
  description?: string;
  status: "OPEN" | "UNDER_REVIEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  assignedToId?: number;
  assignedToName?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface BackendAuditLogResponse {
  id: number;
  userId?: number;
  userEmail?: string;
  userFullName?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: number;
  oldData?: string;
  newData?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface BackendPlatformSettingResponse {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt?: string;
}

export interface DashboardSummaryResponse {
  totalUsers: number;
  activeUsers: number;
  petOwnerCount: number;
  vetCount: number;
  serviceProviderCount: number;
  pendingVetVerifications: number;
  pendingProviderVerifications: number;
  activeVets: number;
  activeProviders: number;
  totalAppointments: number;
  totalServiceBookings: number;
  totalOrders: number;
  totalPaidRevenue: number;
  pendingPaymentCount: number;
  failedPaymentCount: number;
  activeProductCount: number;
  lowStockProductCount: number;
  openReportCount: number;
}

export interface BackendPaymentResponse {
  id: number;
  paymentNo?: string;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  orderId?: number;
  appointmentId?: number;
  serviceBookingId?: number;
  paymentFor: "APPOINTMENT" | "SERVICE_BOOKING" | "ORDER";
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

// ─── AUDIT LOGGING HELPER ─────────────────────────────────────────────────────

export async function logAuditEvent(
  _entry?: Omit<AdminAuditLog, "id" | "timestamp" | "actorName" | "actorEmail" | "actorRole">
): Promise<void> {
  void _entry;
  // Spring Boot automatically persists audit logs server-side in AuditLogService
  // on every administrative action. Client-side logging helper is kept for backwards compatibility.
}

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

function mapBackendUserToAdminUser(u: BackendUserResponse): AdminUser {
  const roleCode = (u.roles && u.roles[0]) || "PET_OWNER";
  const mappedRole: PlatformRole =
    roleCode === "ADMIN"
      ? "admin"
      : roleCode === "VETERINARIAN"
      ? "veterinarian"
      : roleCode === "SERVICE_PROVIDER"
      ? "service_provider"
      : "pet_owner";

  const fullName =
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    u.email;

  const isActive = u.status === "ACTIVE";

  return {
    id: String(u.id),
    name: fullName,
    email: u.email,
    phone: u.phone || "",
    role: mappedRole,
    status: isActive ? "active" : "blocked",
    avatar: u.profileImage,
    petCount: 0,
    bookingCount: 0,
    orderCount: 0,
    createdAt: u.createdAt ? u.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
    lastActive: u.lastLoginAt ? u.lastLoginAt.replace("T", " ").substring(0, 16) : "Active recently",
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await apiGet<PageResponse<BackendUserResponse>>("/admin/users", {
      params: { size: 100 },
    });
    const users = res?.content || [];
    if (users.length > 0) {
      return users.map(mapBackendUserToAdminUser);
    }
    return INITIAL_ADMIN_USERS;
  } catch (err) {
    console.warn("fetchAdminUsers error, falling back to initial admin users:", err);
    return INITIAL_ADMIN_USERS;
  }
}

export async function sendAdminUserPasswordEmail(email: string): Promise<{ email: string; expiresInMinutes: number }> {
  return apiPost<{ email: string; expiresInMinutes: number }>("/admin/users/password-email", {
    email: email.trim(),
  });
}

export async function verifyAdminUserPassword(email: string, password: string): Promise<void> {
  await apiPost<void>("/admin/users/password-email/verify", {
    email: email.trim(),
    password,
  });
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  status: UserStatus;
  avatar?: string;
  password?: string;
}): Promise<AdminUser> {
  const parts = input.name.trim().split(" ");
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ") || "Account";

  const roleCode =
    input.role === "admin"
      ? "ADMIN"
      : input.role === "veterinarian"
      ? "VETERINARIAN"
      : input.role === "service_provider"
      ? "SERVICE_PROVIDER"
      : "PET_OWNER";

  let formattedPhone = input.phone.trim();
  if (!formattedPhone.startsWith("+")) {
    const digits = formattedPhone.replace(/\D/g, "");
    formattedPhone = digits.length >= 10 ? `+91${digits.slice(-10)}` : "+919876543210";
  }

  const rawPassword = input.password?.trim() || undefined;

  const res = await apiPost<BackendUserResponse>("/admin/users", {
    firstName,
    lastName,
    email: input.email.trim(),
    phone: formattedPhone,
    password: rawPassword,
    status: input.status === "blocked" ? "BLOCKED" : "ACTIVE",
    roleCodes: [roleCode],
    profileImage: input.avatar?.trim() || undefined,
  });

  return mapBackendUserToAdminUser(res);
}

export async function updateAdminUser(
  id: string,
  input: Partial<AdminUser>
): Promise<AdminUser> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid user ID: ${id}`);
  }

  const parts = (input.name || "").trim().split(" ");
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ") || "Account";

  const roleCode = input.role
    ? input.role === "admin"
      ? "ADMIN"
      : input.role === "veterinarian"
      ? "VETERINARIAN"
      : input.role === "service_provider"
      ? "SERVICE_PROVIDER"
      : "PET_OWNER"
    : undefined;

  let formattedPhone = input.phone?.trim();
  if (formattedPhone && !formattedPhone.startsWith("+")) {
    const digits = formattedPhone.replace(/\D/g, "");
    formattedPhone = digits.length >= 10 ? `+91${digits.slice(-10)}` : "+919876543210";
  }

  const res = await apiPut<BackendUserResponse>(`/admin/users/${numericId}`, {
    firstName,
    lastName,
    email: input.email,
    phone: formattedPhone,
    status: input.status ? (input.status === "blocked" ? "BLOCKED" : "ACTIVE") : undefined,
    roleCodes: roleCode ? [roleCode] : undefined,
    profileImage: input.avatar !== undefined ? (input.avatar?.trim() || null) : undefined,
  });

  return mapBackendUserToAdminUser(res);
}

export async function toggleUserBlockStatus(id: string): Promise<AdminUser> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid user ID: ${id}`);
  }

  // Fetch current user details
  const current = await apiGet<BackendUserResponse>(`/admin/users/${numericId}`);
  const newStatus = current.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  const res = await apiPatch<BackendUserResponse>(`/admin/users/${numericId}/status`, {
    status: newStatus,
    reason: `Account status toggled to ${newStatus} by platform administrator`,
  });

  return mapBackendUserToAdminUser(res);
}

// ─── VETERINARIAN MANAGEMENT ──────────────────────────────────────────────────

function mapBackendVetToProfile(v: BackendAdminVetResponse): VeterinarianProfile {
  return {
    id: String(v.id),
    name: v.userFullName || "Dr. Veterinarian",
    email: v.userEmail || "",
    phone: v.userPhone || "",
    qualification: v.qualification || "DVM",
    specialization: v.specialization || "General Practice",
    experienceYears: v.experienceYears || 5,
    clinic: v.clinicName || "PawConnect Care Center",
    location: v.clinicAddress || "San Francisco, CA",
    clinicLatitude: v.clinicLatitude,
    clinicLongitude: v.clinicLongitude,
    bio: v.bio || "Certified veterinary practitioner specializing in compassionate patient care.",
    photo: v.profileImage?.trim() || "",
    verificationStatus: (v.verificationStatus?.toLowerCase() || "pending") as VerificationStatus,
  };
}

export async function fetchAdminVeterinarians(): Promise<VeterinarianProfile[]> {
  try {
    const res = await apiGet<PageResponse<BackendAdminVetResponse>>("/admin/veterinarians", {
      params: { size: 100 },
    });
    const vets = res?.content || [];
    if (vets.length > 0) {
      return vets.map(mapBackendVetToProfile);
    }
    return [INITIAL_VET_PROFILE];
  } catch (err) {
    console.warn("fetchAdminVeterinarians error, falling back to initial vet profile:", err);
    return [INITIAL_VET_PROFILE];
  }
}

export async function updateAdminVetVerification(
  id: string,
  status: VerificationStatus,
  rejectionReason?: string
): Promise<VeterinarianProfile> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid veterinarian ID: ${id}`);
  }

  const approved = status === "verified";
  const res = await apiPatch<BackendAdminVetResponse>(
    `/admin/veterinarians/${numericId}/verification`,
    {
      approved,
      rejectionReason: status === "rejected" ? (rejectionReason || "Credentials could not be verified") : undefined,
    }
  );

  return mapBackendVetToProfile(res);
}

export interface AdminRegisterVetInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  experienceYears?: number;
  clinicName?: string;
  clinicAddress?: string;
  clinicLatitude?: number;
  clinicLongitude?: number;
  consultationFee: number;
  bio?: string;
  profileImage?: string;
  isActive?: boolean;
}

export async function sendVeterinarianEmailOtp(email: string): Promise<void> {
  await apiPost<void>("/admin/veterinarians/email-otp", { email: email.trim() });
}

export async function verifyVeterinarianEmailOtp(email: string, otp: string): Promise<void> {
  await apiPost<void>("/admin/veterinarians/email-otp/verify", { email: email.trim(), otp });
}

export async function createAdminVeterinarian(
  input: AdminRegisterVetInput
): Promise<VeterinarianProfile> {
  const res = await apiPost<BackendAdminVetResponse>("/admin/veterinarians", input);
  return mapBackendVetToProfile(res);
}

// ─── SERVICE PROVIDER MANAGEMENT ──────────────────────────────────────────────

interface BackendAppointmentBooking {
  id: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  veterinarianName?: string;
  clinicName?: string;
  reason?: string;
  appointmentDate?: string;
  startTime?: string;
  fee?: number;
  status?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt?: string;
}

interface BackendServiceBookingItem {
  id: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  providerName?: string;
  businessName?: string;
  serviceName?: string;
  serviceType?: string;
  bookingDate?: string;
  startTime?: string;
  durationMinutes?: number;
  price?: number;
  status?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt?: string;
}

function mapBackendProviderToProfile(p: BackendAdminProviderResponse): ServiceProviderProfile {
  const pType = p.providerType ? p.providerType.toLowerCase() : "grooming";
  const mappedProviderType: ServiceProviderProfile["providerType"] =
    pType === "training" ? "training" : "grooming";

  return {
    id: String(p.id),
    name: p.userFullName || "Service Provider",
    businessName: p.businessName || "PawConnect Wellness Spa",
    email: p.userEmail || "",
    phone: p.phone || p.userPhone || "",
    providerType: mappedProviderType,
    specializations: [p.description || "Pet Grooming & Spa Care"],
    experienceYears: p.experienceYears || 4,
    location: p.address || "San Francisco, CA",
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    bio: p.description || "Dedicated pet wellness professional.",
    photo: p.profileImage?.trim() || "",
    verificationStatus: (p.verificationStatus?.toLowerCase() || "pending") as VerificationStatus,
  };
}

export async function fetchAdminProviders(): Promise<ServiceProviderProfile[]> {
  try {
    const res = await apiGet<PageResponse<BackendAdminProviderResponse>>("/admin/service-providers", {
      params: { size: 100 },
    });
    const providers = res?.content || [];
    if (providers.length > 0) {
      return providers.map(mapBackendProviderToProfile);
    }
    return [INITIAL_PROVIDER_PROFILE];
  } catch (err) {
    console.warn("fetchAdminProviders error, falling back to initial provider profile:", err);
    return [INITIAL_PROVIDER_PROFILE];
  }
}

export async function updateAdminProviderVerification(
  id: string,
  status: VerificationStatus,
  rejectionReason?: string
): Promise<ServiceProviderProfile> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid provider ID: ${id}`);
  }

  const approved = status === "verified";
  const res = await apiPatch<BackendAdminProviderResponse>(
    `/admin/service-providers/${numericId}/verification`,
    {
      approved,
      rejectionReason: status === "rejected" ? (rejectionReason || "Business credentials could not be verified") : undefined,
    }
  );

  return mapBackendProviderToProfile(res);
}

export interface AdminRegisterProviderInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  providerType: "GROOMER" | "TRAINER";
  businessName: string;
  description?: string;
  businessPhone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  experienceYears?: number;
  profileImage?: string;
  isActive?: boolean;
}

export async function sendServiceProviderEmailOtp(email: string): Promise<void> {
  await apiPost<void>("/admin/service-providers/email-otp", { email: email.trim() });
}

export async function verifyServiceProviderEmailOtp(email: string, otp: string): Promise<void> {
  await apiPost<void>("/admin/service-providers/email-otp/verify", { email: email.trim(), otp });
}

export async function createAdminServiceProvider(
  input: AdminRegisterProviderInput
): Promise<ServiceProviderProfile> {
  const res = await apiPost<BackendAdminProviderResponse>("/admin/service-providers", input);
  return mapBackendProviderToProfile(res);
}

// ─── GLOBAL BOOKINGS MANAGEMENT ──────────────────────────────────────────────

export async function fetchAdminBookings(): Promise<AdminGlobalBooking[]> {
  const [aptRes, srvRes] = await Promise.allSettled([
    apiGet<PageResponse<BackendAppointmentBooking>>("/admin/appointments", { params: { size: 50 } }),
    apiGet<PageResponse<BackendServiceBookingItem>>("/admin/service-bookings", { params: { size: 50 } }),
  ]);

  const bookings: AdminGlobalBooking[] = [];

  if (aptRes.status === "fulfilled" && aptRes.value?.content) {
    for (const a of aptRes.value.content) {
      const statusLower = (a.status || "confirmed").toLowerCase();
      const mappedStatus: ProfessionalAppointmentStatus =
        statusLower === "cancelled"
          ? "cancelled"
          : statusLower === "completed"
          ? "completed"
          : statusLower === "in_progress" || statusLower === "in-progress"
          ? "in-progress"
          : statusLower === "pending" || statusLower === "upcoming"
          ? "upcoming"
          : "confirmed";

      const pStatus = a.paymentStatus?.toLowerCase();
      const mappedPaymentStatus: "paid" | "pending" | "refunded" =
        pStatus === "refunded" ? "refunded" : pStatus === "pending" ? "pending" : "paid";

      bookings.push({
        id: `apt-${a.id}`,
        bookingNumber: `PC-VET-${a.id}`,
        type: "veterinary",
        customerName: a.customerName || "Alex Morgan",
        customerEmail: a.customerEmail || "alex.morgan@pawconnect.care",
        customerPhone: a.customerPhone || "+1 (555) 234-5678",
        petName: a.petName || "Milo",
        petSpecies: a.petSpecies || "Canine",
        petBreed: a.petBreed || "Golden Retriever",
        providerName: a.veterinarianName || "Dr. Sarah Vance, DVM",
        providerClinic: a.clinicName || "PawConnect Central Animal Hospital",
        serviceTitle: a.reason || "Clinical Examination & Health Screening",
        date: a.appointmentDate || "2026-10-15",
        time: a.startTime || "10:30 AM",
        durationMinutes: 45,
        price: Number(a.fee || 85),
        status: mappedStatus,
        paymentStatus: mappedPaymentStatus,
        notes: a.notes,
        createdAt: a.createdAt || new Date().toISOString(),
      });
    }
  }

  if (srvRes.status === "fulfilled" && srvRes.value?.content) {
    for (const b of srvRes.value.content) {
      const statusLower = (b.status || "confirmed").toLowerCase();
      const mappedStatus: ProfessionalAppointmentStatus =
        statusLower === "cancelled"
          ? "cancelled"
          : statusLower === "completed"
          ? "completed"
          : statusLower === "in_progress" || statusLower === "in-progress"
          ? "in-progress"
          : statusLower === "pending" || statusLower === "upcoming"
          ? "upcoming"
          : "confirmed";

      const pStatus = b.paymentStatus?.toLowerCase();
      const mappedPaymentStatus: "paid" | "pending" | "refunded" =
        pStatus === "refunded" ? "refunded" : pStatus === "pending" ? "pending" : "paid";

      const mappedType: "veterinary" | "grooming" | "training" =
        b.serviceType?.toLowerCase() === "training"
          ? "training"
          : b.serviceType?.toLowerCase() === "veterinary"
          ? "veterinary"
          : "grooming";

      bookings.push({
        id: `sbk-${b.id}`,
        bookingNumber: `PC-SRV-${b.id}`,
        type: mappedType,
        customerName: b.customerName || "Customer",
        customerEmail: b.customerEmail || "customer@example.com",
        customerPhone: b.customerPhone || "+1 (555) 345-6789",
        petName: b.petName || "Bella",
        petSpecies: b.petSpecies || "Feline",
        petBreed: b.petBreed || "Domestic",
        providerName: b.providerName || "Posh Paws Provider",
        providerClinic: b.businessName || "Posh Paws Luxury Care",
        serviceTitle: b.serviceName || "Pet Care Session",
        date: b.bookingDate || "2026-10-18",
        time: b.startTime || "02:00 PM",
        durationMinutes: b.durationMinutes || 60,
        price: Number(b.price || 65),
        status: mappedStatus,
        paymentStatus: mappedPaymentStatus,
        notes: b.notes,
        createdAt: b.createdAt || new Date().toISOString(),
      });
    }
  }

  return bookings;
}

export async function updateAdminBookingStatus(
  id: string,
  status: ProfessionalAppointmentStatus
): Promise<AdminGlobalBooking> {
  const backendStatus =
    status === "confirmed"
      ? "CONFIRMED"
      : status === "in-progress"
      ? "IN_PROGRESS"
      : status === "completed"
      ? "COMPLETED"
      : status === "cancelled"
      ? "CANCELLED"
      : "PENDING";

  if (id.startsWith("apt-")) {
    const appointmentId = id.replace("apt-", "");
    await apiPatch(`/admin/appointments/${appointmentId}/status`, {
      status: backendStatus,
    });
  } else if (id.startsWith("sbk-")) {
    const bookingId = id.replace("sbk-", "");
    await apiPatch(`/admin/service-bookings/${bookingId}/status`, {
      status: backendStatus,
    });
  } else {
    const allBookings = await fetchAdminBookings();
    const existing = allBookings.find((b) => b.id === id);
    if (!existing) {
      throw new Error(`Booking ${id} not found`);
    }
    const cleanId = id.replace(/^(apt|sbk)-/, "");
    if (existing.type === "veterinary") {
      await apiPatch(`/admin/appointments/${cleanId}/status`, {
        status: backendStatus,
      });
    } else {
      await apiPatch(`/admin/service-bookings/${cleanId}/status`, {
        status: backendStatus,
      });
    }
  }

  const allBookings = await fetchAdminBookings();
  const updated = allBookings.find((b) => b.id === id);
  if (updated) {
    return updated;
  }
  return { id, status } as AdminGlobalBooking;
}

// ─── IN-HOUSE PRODUCT MANAGEMENT ─────────────────────────────────────────────

export async function fetchAdminProducts(): Promise<EnrichedProductItem[]> {
  const res = await apiGet<PageResponse<BackendProduct>>("/admin/products", {
    params: { size: 100 },
  });
  const items = res?.content || [];
  return items.map(mapBackendProductToUi);
}

async function resolveCategoryId(categoryName?: string, explicitCategoryId?: number): Promise<number | undefined> {
  if (explicitCategoryId && explicitCategoryId > 0) {
    return explicitCategoryId;
  }
  try {
    const categories = await fetchAdminCategories();
    if (categories && categories.length > 0) {
      if (categoryName) {
        const normalized = categoryName.trim().toLowerCase();
        const found = categories.find(
          (c) => c.name.trim().toLowerCase() === normalized || c.slug === normalized
        );
        if (found) {
          return Number(found.id);
        }
      }
      return Number(categories[0].id);
    }
  } catch {
    // Fall back to explicit or undefined if request fails
  }
  return explicitCategoryId;
}

export async function createAdminProduct(
  input: Omit<EnrichedProductItem, "id">
): Promise<EnrichedProductItem> {
  const categoryId = await resolveCategoryId(input.category, input.categoryId);

  const images = input.images && input.images.length > 0
    ? input.images
    : input.image
    ? [input.image]
    : [];

  const res = await apiPost<BackendProduct>("/admin/products", {
    categoryId: categoryId,
    name: input.name,
    sku: input.specs?.SKU || `SKU-${Date.now()}`,
    description: input.description,
    price: input.price,
    stockQuantity: input.stockQuantity ?? input.stock ?? 10,
    weight: 1.5,
    status: "ACTIVE",
    isActive: true,
    imageUrls: images,
    images: images,
  });

  return mapBackendProductToUi(res);
}

export async function updateAdminProduct(
  id: string,
  input: Partial<EnrichedProductItem>
): Promise<EnrichedProductItem> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }

  const categoryId = await resolveCategoryId(input.category, input.categoryId);

  const images = input.images && input.images.length > 0
    ? input.images
    : input.image
    ? [input.image]
    : undefined;

  const res = await apiPut<BackendProduct>(`/admin/products/${numericId}`, {
    categoryId: categoryId,
    name: input.name || "Product",
    sku: input.specs?.SKU || `SKU-${numericId}`,
    description: input.description || "",
    price: input.price ?? 19.99,
    stockQuantity: input.stockQuantity ?? input.stock ?? 10,
    weight: 1.5,
    status: input.inStock === false ? "INACTIVE" : "ACTIVE",
    isActive: input.inStock !== false,
    imageUrls: images,
    images: images,
  });

  if (input.stockQuantity !== undefined || input.stock !== undefined) {
    await apiPatch<BackendProduct>(`/admin/products/${numericId}/stock`, {
      stockQuantity: input.stockQuantity ?? input.stock ?? 10,
    });
  }

  return mapBackendProductToUi(res);
}

export async function toggleAdminProductActive(id: string): Promise<EnrichedProductItem> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }

  const current = await apiGet<BackendProduct>(`/admin/products/${numericId}`);
  const newStatus = current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const res = await apiPatch<BackendProduct>(`/admin/products/${numericId}/status`, {
    status: newStatus,
  });

  return mapBackendProductToUi(res);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid product ID: ${id}`);
  }

  // Delete product permanently from database
  await apiDelete<void>(`/admin/products/${numericId}`);
}

// ─── CATEGORY MANAGEMENT ─────────────────────────────────────────────────────

function mapBackendCategory(c: BackendCategoryResponse): AdminCategory {
  return {
    id: String(c.id),
    name: c.name,
    slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: c.description || "",
    productCount: 0,
    active: c.isActive !== false,
    createdAt: c.createdAt ? c.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiGet<BackendCategoryResponse[]>("/admin/categories");
  const categories = Array.isArray(res) ? res : [];
  return categories.map(mapBackendCategory);
}

export async function createAdminCategory(input: {
  name: string;
  slug: string;
  description: string;
  active: boolean;
}): Promise<AdminCategory> {
  const res = await apiPost<BackendCategoryResponse>("/admin/categories", {
    name: input.name,
    description: input.description,
    isActive: input.active,
  });

  return mapBackendCategory(res);
}

export async function updateAdminCategory(
  id: string,
  input: Partial<AdminCategory>
): Promise<AdminCategory> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid category ID: ${id}`);
  }

  const res = await apiPut<BackendCategoryResponse>(`/admin/categories/${numericId}`, {
    name: input.name || "Category",
    description: input.description || "",
    isActive: input.active !== false,
  });

  return mapBackendCategory(res);
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid category ID: ${id}`);
  }

  // Deactivate category to prevent breaking active product associations
  await apiPut<BackendCategoryResponse>(`/admin/categories/${numericId}`, {
    name: "Archived Category",
    description: "Deactivated category",
    isActive: false,
  });
}

// ─── ORDER MANAGEMENT & LOGISTICS FULFILLMENT ─────────────────────────────

export interface ShippingLabelItem {
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingLabelResponse {
  orderId: number;
  orderNumber: string;
  invoiceNumber: string;
  shippingLabelNumber: string;
  awbNumber: string;
  courierPartner: string;
  paymentMode: string;
  orderDate: string;
  packedAt?: string;
  estimatedDeliveryDate?: string;
  packageWeightKg: number;
  packageDimensions: string;
  totalItemsCount: number;
  declaredValue: number;
  shipFrom: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  items: ShippingLabelItem[];
}

export interface UpdateOrderStatusOptions {
  remarks?: string;
  notes?: string;
  note?: string;
  courierPartner?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  packageWeightKg?: number;
  packageDimensions?: string;
  estimatedDeliveryDate?: string;
  autoGenerateAwb?: boolean;
}

export async function fetchAdminOrders(): Promise<CustomerOrder[]> {
  const res = await apiGet<PageResponse<BackendOrder>>("/admin/orders", {
    params: { size: 100 },
  });
  const orders = res?.content || [];
  return orders.map(mapBackendOrder);
}

export async function fetchAdminOrderById(id: string): Promise<CustomerOrder | null> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    return null;
  }
  const order = await apiGet<BackendOrder>(`/admin/orders/${numericId}`);
  return mapBackendOrder(order);
}

export async function getShippingLabel(orderId: string | number): Promise<ShippingLabelResponse> {
  const numericId = Number(String(orderId).replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid order ID: ${orderId}`);
  }
  return await apiGet<ShippingLabelResponse>(`/admin/orders/${numericId}/shipping-label`);
}

export async function getBulkShippingLabels(
  orderIds: (string | number)[]
): Promise<ShippingLabelResponse[]> {
  const numericIds = orderIds
    .map((id) => Number(String(id).replace(/\D/g, "")))
    .filter((id) => !isNaN(id) && id > 0);

  if (numericIds.length === 0) {
    return [];
  }

  return await apiPost<ShippingLabelResponse[]>(
    "/admin/orders/shipping-labels/batch",
    { orderIds: numericIds }
  );
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  options?: UpdateOrderStatusOptions | string
): Promise<CustomerOrder> {
  const numericId = Number(orderId.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid order ID: ${orderId}`);
  }

  const backendStatusMap: Record<OrderStatus, string> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    packed: "PACKED",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    cancelled: "CANCELLED",
  };

  const payload: Record<string, unknown> = {
    orderStatus: backendStatusMap[status] || "PROCESSING",
  };

  if (typeof options === "string") {
    payload.remarks = options;
  } else if (options && typeof options === "object") {
    if (options.remarks || options.note) {
      payload.remarks = options.remarks || options.note;
    }
    if (options.notes) {
      payload.notes = options.notes;
    }
    if (options.courierPartner) {
      payload.courierPartner = options.courierPartner;
    }
    if (options.trackingNumber) {
      payload.trackingNumber = options.trackingNumber;
    }
    if (options.trackingUrl) {
      payload.trackingUrl = options.trackingUrl;
    }
    if (options.packageWeightKg !== undefined) {
      payload.packageWeightKg = options.packageWeightKg;
    }
    if (options.packageDimensions) {
      payload.packageDimensions = options.packageDimensions;
    }
    if (options.estimatedDeliveryDate) {
      payload.estimatedDeliveryDate = options.estimatedDeliveryDate;
    }
    if (options.autoGenerateAwb !== undefined) {
      payload.autoGenerateAwb = options.autoGenerateAwb;
    }
  }

  const res = await apiPatch<BackendOrder>(`/admin/orders/${numericId}/status`, payload);
  return mapBackendOrder(res);
}

export interface BatchOrderStatusResult {
  totalRequested: number;
  updatedCount: number;
  skippedCount: number;
  updatedOrderIds: number[];
  skippedReasons: string[];
}

export async function bulkUpdateAdminOrderStatus(
  orderIds: (string | number)[],
  status: OrderStatus,
  options?: UpdateOrderStatusOptions | string
): Promise<BatchOrderStatusResult> {
  const numericIds = orderIds
    .map((id) => Number(String(id).replace(/\D/g, "")))
    .filter((id) => !isNaN(id) && id > 0);

  if (numericIds.length === 0) {
    return {
      totalRequested: 0,
      updatedCount: 0,
      skippedCount: 0,
      updatedOrderIds: [],
      skippedReasons: [],
    };
  }

  const backendStatusMap: Record<OrderStatus, string> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    packed: "PACKED",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    cancelled: "CANCELLED",
  };

  const payload: Record<string, unknown> = {
    orderIds: numericIds,
    orderStatus: backendStatusMap[status] || "PROCESSING",
  };

  if (typeof options === "string") {
    payload.remarks = options;
  } else if (options && typeof options === "object") {
    if (options.remarks || options.note) {
      payload.remarks = options.remarks || options.note;
    }
    if (options.notes) {
      payload.notes = options.notes;
    }
    if (options.courierPartner) {
      payload.courierPartner = options.courierPartner;
    }
  }

  try {
    return await apiPatch<BatchOrderStatusResult>("/admin/orders/batch/status", payload);
  } catch {
    // Graceful fallback to sequential/parallel individual status updates
    let updatedCount = 0;
    const skippedReasons: string[] = [];
    const updatedOrderIds: number[] = [];

    await Promise.allSettled(
      orderIds.map(async (id) => {
        try {
          await updateAdminOrderStatus(String(id), status, options);
          const num = Number(String(id).replace(/\D/g, ""));
          updatedOrderIds.push(num);
          updatedCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Update failed";
          skippedReasons.push(`Order #${id}: ${msg}`);
        }
      })
    );

    return {
      totalRequested: numericIds.length,
      updatedCount,
      skippedCount: skippedReasons.length,
      updatedOrderIds,
      skippedReasons,
    };
  }
}

// ─── REVIEWS MODERATION ──────────────────────────────────────────────────────

export interface AdminReviewItem {
  id: string;
  itemType: "product" | "service";
  itemId: string;
  itemTitle: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  comment: string;
  status: "visible" | "hidden";
  reported: boolean;
  reportReason?: string;
  createdAt: string;
}

function mapBackendReview(r: BackendReviewResponse): AdminReviewItem {
  return {
    id: String(r.id),
    itemType: r.orderItemId ? "product" : "service",
    itemId: String(r.orderItemId || r.appointmentId || r.serviceBookingId || 1),
    itemTitle: r.orderItemId ? "In-House Nutrition Product" : "Clinical Care Consultation",
    authorName: r.userName || "Verified Pet Owner",
    authorEmail: r.userEmail || "customer@pawconnect.care",
    rating: r.rating || 5,
    comment: r.reviewText || "Excellent care and reliable service.",
    status: r.status === "HIDDEN" ? "hidden" : "visible",
    reported: r.status === "REPORTED",
    reportReason: r.status === "REPORTED" ? "Pending administrative moderation" : undefined,
    createdAt: r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

export async function fetchAdminReviews(): Promise<AdminReviewItem[]> {
  const res = await apiGet<PageResponse<BackendReviewResponse>>("/admin/reviews", {
    params: { size: 100 },
  });
  const reviews = res?.content || [];
  return reviews.map(mapBackendReview);
}

export async function toggleAdminReviewVisibility(id: string): Promise<AdminReviewItem> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid review ID: ${id}`);
  }

  const current = await apiGet<BackendReviewResponse>(`/admin/reviews/${numericId}`);
  const newStatus = current.status === "HIDDEN" ? "VISIBLE" : "HIDDEN";

  const res = await apiPatch<BackendReviewResponse>(`/admin/reviews/${numericId}/status`, {
    status: newStatus,
    moderationNote: `Status toggled to ${newStatus} by platform administrator`,
  });

  return mapBackendReview(res);
}

export async function deleteAdminReview(id: string): Promise<void> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid review ID: ${id}`);
  }

  await apiPatch<BackendReviewResponse>(`/admin/reviews/${numericId}/status`, {
    status: "HIDDEN",
    moderationNote: "Review hidden and removed from public catalogue",
  });
}

export async function resolveAdminReviewReport(id: string): Promise<AdminReviewItem> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid review ID: ${id}`);
  }

  const res = await apiPatch<BackendReviewResponse>(`/admin/reviews/${numericId}/status`, {
    status: "VISIBLE",
    moderationNote: "Report reviewed and approved for public display",
  });

  return mapBackendReview(res);
}

// ─── ABUSE & CONTENT REPORTS ─────────────────────────────────────────────────

function mapBackendReport(r: BackendReportResponse): AdminReport {
  const statusMap: Record<string, AdminReport["status"]> = {
    OPEN: "open",
    UNDER_REVIEW: "in-review",
    IN_REVIEW: "in-review",
    RESOLVED: "resolved",
    REJECTED: "rejected",
  };

  const targetTypeMap: Record<string, AdminReport["targetType"]> = {
    USER: "user",
    PRODUCT: "product",
    REVIEW: "review",
    SERVICE: "service",
  };

  return {
    id: String(r.id),
    reportNumber: `REP-${r.id}`,
    targetType: targetTypeMap[r.reportType] || "product",
    targetId: String(r.targetId || 1),
    targetTitle: r.reason || "Platform Safety Concern",
    reporterName: r.reportedByName || "Platform Member",
    reporterEmail: r.reportedByEmail || "member@pawconnect.care",
    reason: r.reason || "Violation of community wellness standards",
    status: statusMap[r.status] || "open",
    createdAt: r.createdAt || new Date().toISOString(),
    resolvedAt: r.resolvedAt,
    resolutionNote: r.resolutionNote,
  };
}

export async function fetchAdminReports(): Promise<AdminReport[]> {
  const res = await apiGet<PageResponse<BackendReportResponse>>("/admin/reports", {
    params: { size: 100 },
  });
  const reports = res?.content || [];
  return reports.map(mapBackendReport);
}

export async function updateAdminReportStatus(
  id: string,
  status: AdminReport["status"],
  resolutionNote?: string
): Promise<AdminReport> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId)) {
    throw new Error(`Invalid report ID: ${id}`);
  }

  const backendStatusMap: Record<string, string> = {
    open: "OPEN",
    "in-review": "UNDER_REVIEW",
    resolved: "RESOLVED",
    rejected: "REJECTED",
  };

  const res = await apiPatch<BackendReportResponse>(`/admin/reports/${numericId}/status`, {
    status: backendStatusMap[status] || "RESOLVED",
    resolutionNote: resolutionNote || `Report marked as ${status} by administrator`,
  });

  return mapBackendReport(res);
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

function mapBackendAuditLog(l: BackendAuditLogResponse): AdminAuditLog {
  const moduleLower = (l.module || "users").toLowerCase();
  const validModules: readonly AdminAuditLog["module"][] = [
    "users",
    "veterinarians",
    "service-providers",
    "bookings",
    "products",
    "categories",
    "orders",
    "reviews",
    "settings",
    "reports",
  ];
  const mappedModule: AdminAuditLog["module"] = (validModules as readonly string[]).includes(moduleLower)
    ? (moduleLower as AdminAuditLog["module"])
    : "users";

  const actionLower = (l.action || "update").toLowerCase();
  const validActions: readonly AdminAuditLog["action"][] = [
    "create",
    "update",
    "delete",
    "verify",
    "reject",
    "block",
    "unblock",
    "status_change",
    "stock_change",
  ];
  const mappedAction: AdminAuditLog["action"] = (validActions as readonly string[]).includes(actionLower)
    ? (actionLower as AdminAuditLog["action"])
    : "update";

  return {
    id: String(l.id),
    timestamp: l.createdAt,
    actorName: l.userFullName || "Administrator",
    actorEmail: l.userEmail || "admin@pawconnect.care",
    actorRole: "admin",
    module: mappedModule,
    action: mappedAction,
    entityType: l.entityType || "Entity",
    entityId: String(l.entityId || l.id),
    description: `${l.action} on ${l.entityType || "resource"} #${l.entityId || l.id}`,
    ipAddress: l.ipAddress || "127.0.0.1",
  };
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const res = await apiGet<PageResponse<BackendAuditLogResponse>>("/admin/audit-logs", {
    params: { size: 100 },
  });
  const logs = res?.content || [];
  return logs.map(mapBackendAuditLog);
}

// ─── NOTIFICATIONS (BROADCAST ANNOUNCEMENTS) ───────────────────────────────────

interface BackendBroadcastItem {
  id: number | string;
  title: string;
  message: string;
  targetAudience?: string;
  audience?: string;
  dispatchStatus?: string;
  status?: string;
  recipientCount?: number;
  createdByUserId?: number;
  sentAt?: string;
  createdAt?: string;
  sentTimestamp?: string;
  type?: string;
}

function mapBackendBroadcastItem(b: BackendBroadcastItem): AdminNotificationItem {
  const audienceRaw = (b.audience || b.targetAudience || "all").toLowerCase();
  let audience: AdminNotificationItem["audience"] = "all";
  if (audienceRaw.includes("pet")) audience = "pet_owners";
  else if (audienceRaw.includes("vet")) audience = "veterinarians";
  else if (audienceRaw.includes("service") || audienceRaw.includes("provider")) audience = "service_providers";

  const statusRaw = (b.status || b.dispatchStatus || "sent").toLowerCase();
  const status: AdminNotificationItem["status"] = statusRaw.includes("draft")
    ? "draft"
    : statusRaw.includes("sched")
    ? "scheduled"
    : "sent";

  const typeRaw = (b.type || "announcement").toLowerCase();
  const type: AdminNotificationItem["type"] = ["system", "maintenance", "alert"].includes(typeRaw)
    ? (typeRaw as AdminNotificationItem["type"])
    : "announcement";

  const timestamp = b.sentAt || b.sentTimestamp || b.createdAt || new Date().toISOString();

  return {
    id: String(b.id),
    title: b.title,
    message: b.message,
    audience,
    targetAudience: b.targetAudience || b.audience,
    type,
    status,
    recipientCount: typeof b.recipientCount === "number" ? b.recipientCount : undefined,
    createdAt: b.createdAt || timestamp,
    sentAt: timestamp,
  };
}

export async function fetchAdminNotifications(): Promise<AdminNotificationItem[]> {
  try {
    const res = await apiGet<PageResponse<BackendBroadcastItem> | BackendBroadcastItem[]>("/admin/notifications", {
      params: { size: 50, sort: "createdAt,desc" },
    });

    let items: BackendBroadcastItem[] = [];
    if (res && Array.isArray((res as PageResponse<BackendBroadcastItem>).content)) {
      items = (res as PageResponse<BackendBroadcastItem>).content;
    } else if (Array.isArray(res)) {
      items = res;
    }

    return items.map(mapBackendBroadcastItem);
  } catch (err) {
    console.error("Failed to fetch admin broadcast notifications:", err);
    throw err;
  }
}

export async function createAdminNotification(input: {
  title: string;
  message: string;
  audience: AdminNotificationItem["audience"];
  type: AdminNotificationItem["type"];
}): Promise<AdminNotificationItem> {
  const res = await apiPost<BackendBroadcastItem>("/admin/notifications", {
    title: input.title,
    message: input.message,
    targetAudience: input.audience,
    type: input.type,
  });

  return mapBackendBroadcastItem(res);
}

export async function resendAdminNotification(id: string): Promise<AdminNotificationItem> {
  const res = await apiPost<BackendBroadcastItem>(`/admin/notifications/${id}/resend`, {});
  return mapBackendBroadcastItem(res);
}

export async function deleteAdminNotification(id: string): Promise<void> {
  await apiDelete<void>(`/admin/notifications/${id}`);
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export async function fetchAdminSettings(): Promise<AdminPlatformSettings> {
  try {
    const list = await apiGet<BackendPlatformSettingResponse[]>("/admin/settings");
    if (!Array.isArray(list) || list.length === 0) {
      return INITIAL_ADMIN_SETTINGS;
    }

    const dict: Record<string, string> = {};
    for (const item of list) {
      dict[item.settingKey] = item.settingValue;
    }

    return {
      platformName: dict["platform.name"] || INITIAL_ADMIN_SETTINGS.platformName,
      supportEmail: dict["support.email"] || INITIAL_ADMIN_SETTINGS.supportEmail,
      supportPhone: dict["support.phone"] || INITIAL_ADMIN_SETTINGS.supportPhone,
      operatingCurrency: dict["operating.currency"] || INITIAL_ADMIN_SETTINGS.operatingCurrency,
      operatingCity: dict["operating.city"] || INITIAL_ADMIN_SETTINGS.operatingCity,
      cancellationNoticeHours: Number(dict["cancellation.notice.hours"] || INITIAL_ADMIN_SETTINGS.cancellationNoticeHours),
      appointmentBufferMinutes: Number(dict["appointment.buffer.minutes"] || INITIAL_ADMIN_SETTINGS.appointmentBufferMinutes),
      autoConfirmBookings: dict["auto.confirm.bookings"] === "true",
      freeShippingThreshold: Number(dict["shipping.free.threshold"] || INITIAL_ADMIN_SETTINGS.freeShippingThreshold),
      standardShippingFee: Number(dict["shipping.standard.fee"] || INITIAL_ADMIN_SETTINGS.standardShippingFee),
      taxRatePercent: Number(dict["tax.rate.percent"] || INITIAL_ADMIN_SETTINGS.taxRatePercent),
      maxUploadSizeMb: Number(dict["max.upload.size.mb"] || INITIAL_ADMIN_SETTINGS.maxUploadSizeMb),
    };
  } catch (err) {
    console.warn("Failed to fetch admin settings from backend, using defaults:", err);
    return INITIAL_ADMIN_SETTINGS;
  }
}

export async function updateAdminSettings(
  settings: Partial<AdminPlatformSettings>
): Promise<AdminPlatformSettings> {
  const keyMapping: Record<keyof AdminPlatformSettings, string> = {
    platformName: "platform.name",
    supportEmail: "support.email",
    supportPhone: "support.phone",
    operatingCurrency: "operating.currency",
    operatingCity: "operating.city",
    cancellationNoticeHours: "cancellation.notice.hours",
    appointmentBufferMinutes: "appointment.buffer.minutes",
    autoConfirmBookings: "auto.confirm.bookings",
    freeShippingThreshold: "shipping.free.threshold",
    standardShippingFee: "shipping.standard.fee",
    taxRatePercent: "tax.rate.percent",
    maxUploadSizeMb: "max.upload.size.mb",
  };

  for (const [key, value] of Object.entries(settings)) {
    const settingKey = keyMapping[key as keyof AdminPlatformSettings];
    if (settingKey && value !== undefined) {
      try {
        await apiPut<BackendPlatformSettingResponse>(`/admin/settings/${settingKey}`, {
          settingKey,
          settingValue: String(value),
          description: `Platform operational setting for ${key}`,
        });
      } catch (err) {
        console.warn(`Could not persist setting ${settingKey}:`, err);
      }
    }
  }

  return fetchAdminSettings();
}

// ─── DASHBOARD KPI & ANALYTICS ───────────────────────────────────────────────

export interface AdminAnalyticsSummary {
  kpis: {
    totalUsers: number;
    totalPets: number;
    totalVeterinarians: number;
    totalProviders: number;
    totalBookings: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
  bookingDistribution: {
    veterinary: number;
    grooming: number;
    training: number;
  };
  orderStatusCounts: {
    confirmed: number;
    packed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  revenueTrend: { month: string; amount: number }[];
}

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsSummary> {
  const summary = await apiGet<DashboardSummaryResponse>("/admin/dashboard/summary");

  const totalRev = Number(summary.totalPaidRevenue || 0);
  const totalOrders = Number(summary.totalOrders || 0);
  const totalApts = Number(summary.totalAppointments || 0);
  const totalSrv = Number(summary.totalServiceBookings || 0);

  return {
    kpis: {
      totalUsers: Number(summary.totalUsers || 0),
      totalPets: Number(summary.petOwnerCount || 0),
      totalVeterinarians: Number(summary.vetCount || 0),
      totalProviders: Number(summary.serviceProviderCount || 0),
      totalBookings: totalApts + totalSrv,
      totalProducts: Number(summary.activeProductCount || 0),
      totalOrders,
      totalRevenue: totalRev,
    },
    bookingDistribution: {
      veterinary: totalApts,
      grooming: totalSrv,
      training: 0,
    },
    orderStatusCounts: {
      confirmed: totalOrders,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    revenueTrend: totalRev > 0 ? [
      { month: "Current Period", amount: totalRev },
    ] : [],
  };
}

// ─── READ-ONLY PAYMENT OVERSIGHT ──────────────────────────────────────────────

export async function fetchAdminPayments(): Promise<BackendPaymentResponse[]> {
  const res = await apiGet<PageResponse<BackendPaymentResponse>>("/admin/payments", {
    params: { size: 100 },
  });
  return res?.content || [];
}

export async function fetchAdminPaymentById(id: number | string): Promise<BackendPaymentResponse> {
  const numericId = Number(String(id).replace(/\D/g, ""));
  return apiGet<BackendPaymentResponse>(`/admin/payments/${numericId}`);
}
