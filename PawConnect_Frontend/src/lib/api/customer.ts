/**
 * Customer Core API
 * Connects to Spring Boot /api/me profile and /api/me/addresses endpoints.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./client";
import { getCurrentUser, type AuthUser } from "./auth";
import { useAuthStore } from "@/stores/auth.store";
import type { CustomerProfile, CustomerAddress } from "@/lib/mock/customer";

export type { CustomerProfile, CustomerAddress };

interface BackendUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  profileImage?: string;
  emailNotificationsEnabled?: boolean;
  createdAt?: string;
}

interface BackendAddress {
  id: number;
  userId: number;
  addressType: "HOME" | "OFFICE" | "OTHER";
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapUserToCustomerProfile(user: BackendUser): CustomerProfile {
  return {
    id: String(user.id),
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
    avatar:
      user.profileImage ||
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    memberSince: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "Active Member",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  };
}

function normalizeAddressType(label?: string): "HOME" | "OFFICE" | "OTHER" {
  const norm = (label || "").trim().toUpperCase();
  if (norm === "HOME") return "HOME";
  if (norm === "OFFICE" || norm === "WORK") return "OFFICE";
  return "OTHER";
}

function mapBackendAddressToCustomer(addr: BackendAddress): CustomerAddress {
  const norm = (addr.addressType || "").toUpperCase();
  const label: CustomerAddress["label"] =
    norm === "HOME" ? "Home" : norm === "OFFICE" || norm === "WORK" ? "Work" : "Other";

  return {
    id: String(addr.id),
    label,
    recipientName: addr.recipientName,
    street: addr.addressLine1,
    unit: addr.addressLine2 || "",
    city: addr.city,
    state: addr.state,
    zipCode: addr.postalCode,
    phone: addr.phone,
    latitude: addr.latitude != null ? Number(addr.latitude) : undefined,
    longitude: addr.longitude != null ? Number(addr.longitude) : undefined,
    isDefault: Boolean(addr.isDefault),
    deliveryInstructions: "",
  };
}

export async function fetchCustomerProfile(): Promise<CustomerProfile> {
  try {
    const user = await getCurrentUser();
    if (user) {
      return mapUserToCustomerProfile(user as unknown as BackendUser);
    }
  } catch {
    // fallback to store
  }

  const storeUser = useAuthStore.getState().user;
  if (storeUser) {
    return mapUserToCustomerProfile(storeUser as unknown as BackendUser);
  }

  throw new Error("User not found");
}

export async function updateCustomerProfile(
  data: Partial<CustomerProfile>
): Promise<CustomerProfile> {
  const updatedUser = await apiPut<BackendUser>("/me", {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    profileImage: data.avatar,
    emailNotificationsEnabled: data.emailNotificationsEnabled,
  });
  useAuthStore.getState().setUser(updatedUser as unknown as AuthUser);
  return mapUserToCustomerProfile(updatedUser);
}

export async function fetchAddresses(): Promise<CustomerAddress[]> {
  const addresses = await apiGet<BackendAddress[]>("/me/addresses");
  if (!Array.isArray(addresses)) return [];
  return addresses.map(mapBackendAddressToCustomer);
}

export async function addAddress(
  data: Omit<CustomerAddress, "id">
): Promise<CustomerAddress> {
  const rawPhone = (data.phone || "+919876543210").trim();
  const cleanPhone = rawPhone.startsWith("+")
    ? `+${rawPhone.slice(1).replace(/\D/g, "")}`
    : rawPhone.replace(/\D/g, "");

  const payload = {
    recipientName: data.recipientName,
    phone: cleanPhone || "+919876543210",
    addressLine1: data.street,
    addressLine2: data.unit || "",
    city: data.city,
    state: data.state,
    postalCode: data.zipCode,
    country: data.country || "United States",
    addressType: normalizeAddressType(data.label),
    latitude: data.latitude != null ? Number(data.latitude) : undefined,
    longitude: data.longitude != null ? Number(data.longitude) : undefined,
    isDefault: Boolean(data.isDefault),
  };

  const created = await apiPost<BackendAddress>("/me/addresses", payload);
  return mapBackendAddressToCustomer(created);
}

export async function updateAddress(
  id: string,
  data: Partial<CustomerAddress>
): Promise<CustomerAddress> {
  const payload: Record<string, unknown> = {};
  if (data.recipientName) payload.recipientName = data.recipientName;
  if (data.phone) {
    const rawPhone = data.phone.trim();
    payload.phone = rawPhone.startsWith("+")
      ? `+${rawPhone.slice(1).replace(/\D/g, "")}`
      : rawPhone.replace(/\D/g, "");
  }
  if (data.street) payload.addressLine1 = data.street;
  if (data.unit !== undefined) payload.addressLine2 = data.unit;
  if (data.city) payload.city = data.city;
  if (data.state) payload.state = data.state;
  if (data.zipCode) payload.postalCode = data.zipCode;
  if (data.label) payload.addressType = normalizeAddressType(data.label);
  if (data.latitude !== undefined) payload.latitude = data.latitude;
  if (data.longitude !== undefined) payload.longitude = data.longitude;
  if (data.isDefault !== undefined) payload.isDefault = data.isDefault;
  payload.country = data.country || "United States";

  const updated = await apiPut<BackendAddress>(`/me/addresses/${id}`, payload);
  return mapBackendAddressToCustomer(updated);
}

export async function deleteAddress(id: string): Promise<boolean> {
  await apiDelete<void>(`/me/addresses/${id}`);
  return true;
}

export async function setDefaultAddress(id: string): Promise<CustomerAddress[]> {
  await apiPatch<BackendAddress>(`/me/addresses/${id}/default`, {});
  return fetchAddresses();
}
