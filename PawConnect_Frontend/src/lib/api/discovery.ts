/**
 * Public Discovery & Reviews API Service
 * Connects public directory pages and genuine review systems to Spring Boot backend.
 */

import { apiGet, apiPost, type PageResponse } from "./client";

export interface BackendPublicVeterinarian {
  id: number;
  name: string;
  email?: string;
  phone?: string;
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
  rating?: number;
  reviewCount?: number;
  isAvailableToday?: boolean;
  profileImage?: string;
  profileImageUrl?: string;
  photo?: string;
}

export interface BackendPublicServiceProvider {
  id: number;
  name: string;
  providerType: "GROOMER" | "TRAINER";
  businessName: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  profileImage?: string;
  profileImageUrl?: string;
  photo?: string;
}

export interface BackendPublicReview {
  id: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  createdAt?: string;
  targetType?: "VETERINARIAN" | "SERVICE_PROVIDER" | "PRODUCT";
  targetId?: number;
  targetTitle?: string;
}

export interface CreateReviewInput {
  appointmentId?: number;
  serviceBookingId?: number;
  orderItemId?: number;
  rating: number;
  reviewText: string;
}

export async function fetchPublicVeterinarians(params?: {
  search?: string;
  specialization?: string;
}): Promise<BackendPublicVeterinarian[]> {
  const queryParams: Record<string, string> = { size: "50" };
  if (params?.search) queryParams.search = params.search;
  if (params?.specialization && params.specialization !== "All Specialties") {
    queryParams.specialization = params.specialization;
  }

  const res = await apiGet<PageResponse<BackendPublicVeterinarian>>("/public/veterinarians", {
    params: queryParams,
  });
  return res?.content || [];
}

export async function fetchPublicVeterinarianById(
  id: string | number
): Promise<BackendPublicVeterinarian | null> {
  const numericId = Number(id);
  if (isNaN(numericId) || numericId <= 0) return null;
  return apiGet<BackendPublicVeterinarian>(`/public/veterinarians/${numericId}`);
}

export async function fetchPublicServiceProviders(params?: {
  search?: string;
  providerType?: "GROOMER" | "TRAINER";
}): Promise<BackendPublicServiceProvider[]> {
  const queryParams: Record<string, string> = { size: "50" };
  if (params?.search) queryParams.search = params.search;
  if (params?.providerType) queryParams.providerType = params.providerType;

  const res = await apiGet<PageResponse<BackendPublicServiceProvider>>("/public/service-providers", {
    params: queryParams,
  });
  return res?.content || [];
}

export async function fetchPublicServiceProviderById(
  id: string | number
): Promise<BackendPublicServiceProvider | null> {
  const numericId = Number(id);
  if (isNaN(numericId) || numericId <= 0) return null;
  return apiGet<BackendPublicServiceProvider>(`/public/service-providers/${numericId}`);
}

export async function fetchPublicReviews(params?: {
  veterinarianId?: number;
  providerId?: number;
  productId?: number;
}): Promise<BackendPublicReview[]> {
  const queryParams: Record<string, string> = { size: "20" };
  if (params?.veterinarianId) queryParams.veterinarianId = String(params.veterinarianId);
  if (params?.providerId) queryParams.providerId = String(params.providerId);
  if (params?.productId) queryParams.productId = String(params.productId);

  const res = await apiGet<PageResponse<BackendPublicReview>>("/public/reviews", {
    params: queryParams,
  });
  return res?.content || [];
}

export async function submitCustomerReview(
  input: CreateReviewInput
): Promise<BackendPublicReview> {
  return apiPost<BackendPublicReview>("/reviews", input);
}
