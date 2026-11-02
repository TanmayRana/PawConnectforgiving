/**
 * Customer Bookings API
 * Connects to Spring Boot /api/me/appointments, /api/me/service-bookings, and /api/me/bookings endpoints.
 */

import { apiGet, apiPost, apiPatch, type PageResponse } from "./client";
import {
  type CustomerBooking,
} from "@/lib/mock/bookings";
import { fetchPets } from "./pets";

export type { CustomerBooking };

interface BackendBookingSummary {
  id: number;
  bookingType: "VETERINARY" | "SERVICE";
  referenceNo: string;
  petId: number;
  petName: string;
  species?: string;
  breed?: string;
  petPhotoUrl?: string;
  providerId: number;
  providerName: string;
  providerType?: string;
  providerPhone?: string;
  providerImageUrl?: string;
  clinicOrBusinessName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  serviceId?: number;
  serviceOrReason?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  amount?: number;
  status: string;
  paymentStatus?: string;
  notes?: string;
  paymentExpiresAt?: string;
  remainingPaymentSeconds?: number;
  canRetryPayment?: boolean;
  createdAt?: string;
}

function mapStatus(status: string): CustomerBooking["status"] {
  const norm = status?.toUpperCase();
  if (norm === "COMPLETED") return "completed";
  if (norm === "CANCELLED") return "cancelled";
  if (norm === "NO_SHOW") return "no-show";
  return "scheduled";
}

function mapBackendBooking(b: BackendBookingSummary): CustomerBooking {
  const isVet = b.bookingType === "VETERINARY";
  const isTraining =
    !isVet &&
    (b.serviceOrReason?.toLowerCase().includes("train") ||
      b.providerType?.toLowerCase().includes("train"));
  const bookingType: CustomerBooking["type"] = isVet
    ? "veterinary"
    : isTraining
    ? "training"
    : "grooming";

  const dynamicPetPhoto = b.petPhotoUrl?.trim() || "";

  const pStatus = b.paymentStatus?.toUpperCase();
  const mappedPaymentStatus: CustomerBooking["paymentStatus"] =
    pStatus === "SUCCESS" || pStatus === "PAID" ? "paid" : "pending";

  return {
    id: String(b.id),
    appointmentNumber: b.referenceNo || `BK-${b.id}`,
    type: bookingType,
    providerId: String(b.providerId),
    providerName:
      b.providerName ||
      (isVet ? "PawConnect Veterinarian" : "PawConnect Specialist"),
    providerTitle: isVet
      ? "Licensed Veterinary Practitioner"
      : "Certified Specialist",
    providerClinicOrBusiness:
      b.clinicOrBusinessName ||
      (isVet
        ? "PawConnect Central Animal Hospital"
        : "PawConnect Care Center"),
    providerImage: b.providerImageUrl || "",
    serviceId: String(b.serviceId || b.id),
    serviceTitle:
      b.serviceOrReason ||
      (isVet ? "Clinical Examination" : "Specialist Service"),
    petId: String(b.petId),
    petName: b.petName || "Pet",
    petBreed: b.breed || b.species || "Companion",
    petPhoto: dynamicPetPhoto,
    date: b.date,
    time: b.startTime ? String(b.startTime) : "10:30 AM",
    durationMinutes: 45,
    price: b.amount ? Number(b.amount) : 80,
    status: mapStatus(b.status),
    paymentStatus: mappedPaymentStatus,
    paymentExpiresAt: b.paymentExpiresAt,
    remainingPaymentSeconds: b.remainingPaymentSeconds,
    canRetryPayment: b.canRetryPayment,
    notes: b.notes,
    location:
      b.locationAddress ||
      (isVet
        ? "PawConnect Central Animal Hospital, San Francisco, CA"
        : "PawConnect Care Center, San Francisco, CA"),
    latitude: b.latitude != null ? Number(b.latitude) : undefined,
    longitude: b.longitude != null ? Number(b.longitude) : undefined,
    createdAt: b.createdAt || new Date().toISOString(),
  };
}

export async function fetchBookings(): Promise<CustomerBooking[]> {
  try {
    const [res, pets] = await Promise.all([
      apiGet<PageResponse<BackendBookingSummary>>("/me/bookings", {
        params: { size: 50 },
      }),
      fetchPets().catch(() => []),
    ]);

    const petPhotoMap = new Map<string, string>();
    pets.forEach((p) => {
      const photo = (p.photo || p.photoUrl || "").trim();
      if (photo) {
        petPhotoMap.set(String(p.id), photo);
      }
    });

    const content = res?.content || [];
    return content.map((b) => {
      const mapped = mapBackendBooking(b);
      const dynamicPhoto =
        b.petPhotoUrl?.trim() || petPhotoMap.get(String(b.petId));
      if (dynamicPhoto) {
        mapped.petPhoto = dynamicPhoto;
      }
      return mapped;
    });
  } catch (err) {
    console.warn("Failed to fetch bookings from server:", err);
    return [];
  }
}

export async function fetchBookingById(
  id: string,
): Promise<CustomerBooking | null> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (isNaN(numericId) || numericId <= 0) {
    return null;
  }
  try {
    const [res, pets] = await Promise.all([
      apiGet<BackendBookingSummary>(`/me/bookings/${numericId}`),
      fetchPets().catch(() => []),
    ]);
    if (res) {
      const mapped = mapBackendBooking(res);
      const matchedPet = pets.find((p) => String(p.id) === String(res.petId));
      const dynamicPhoto =
        res.petPhotoUrl?.trim() ||
        matchedPet?.photo?.trim() ||
        matchedPet?.photoUrl?.trim();
      if (dynamicPhoto) {
        mapped.petPhoto = dynamicPhoto;
      }
      return mapped;
    }
  } catch {
    // Return null if booking not found
  }
  return null;
}

export interface CreateBookingInput {
  type: "veterinary" | "grooming" | "training";
  providerId: string;
  providerName: string;
  providerTitle: string;
  providerClinicOrBusiness: string;
  providerImage: string;
  serviceId: string;
  serviceTitle: string;
  petId: string;
  petName: string;
  petBreed: string;
  petPhoto: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  notes?: string;
  location: string;
}

function parseToLocalTime(timeStr?: string): string {
  if (!timeStr) return "10:00:00";
  const clean = timeStr.trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(clean)) {
    return clean.length === 5 ? `${clean}:00` : clean;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridian = match[3]?.toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}:00`;
  }
  return "10:00:00";
}

export async function createBooking(input: CreateBookingInput): Promise<CustomerBooking> {
  const petIdNum = Number(input.petId.replace(/\D/g, "") || "1");
  const providerIdNum = Number(input.providerId.replace(/\D/g, "") || "1");
  const serviceIdNum = Number(input.serviceId.replace(/\D/g, "") || "1");

  if (input.type === "veterinary") {
    const appointmentPayload = {
      petId: !isNaN(petIdNum) && petIdNum > 0 ? petIdNum : 1,
      veterinarianId: !isNaN(providerIdNum) && providerIdNum > 0 ? providerIdNum : 1,
      appointmentDate: input.date,
      startTime: parseToLocalTime(input.time),
      reason: input.serviceTitle || "Clinical Examination",
    };

    const res = await apiPost<{
      id: number;
      appointmentNo?: string;
      appointmentDate: string;
      status: string;
      consultationFee?: number;
    }>("/me/appointments", appointmentPayload);

    return {
      ...input,
      id: String(res.id),
      appointmentNumber: res.appointmentNo || `PC-VET-${res.id}`,
      status: "scheduled",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };
  } else {
    const servicePayload = {
      petId: !isNaN(petIdNum) && petIdNum > 0 ? petIdNum : 1,
      providerId: !isNaN(providerIdNum) && providerIdNum > 0 ? providerIdNum : 1,
      serviceId: !isNaN(serviceIdNum) && serviceIdNum > 0 ? serviceIdNum : 1,
      bookingDate: input.date,
      startTime: parseToLocalTime(input.time),
      notes: input.notes || "Requested via web portal",
    };

    const res = await apiPost<{
      id: number;
      bookingNo?: string;
      bookingDate: string;
      status: string;
      price?: number;
    }>("/me/service-bookings", servicePayload);

    return {
      ...input,
      id: String(res.id),
      appointmentNumber: res.bookingNo || `PC-SRV-${res.id}`,
      status: "scheduled",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };
  }
}

export async function cancelBooking(id: string): Promise<CustomerBooking> {
  const numericId = Number(id.replace(/\D/g, ""));
  if (!isNaN(numericId) && numericId > 0) {
    const res = await apiPatch<BackendBookingSummary>(`/me/bookings/${numericId}/cancel`, {
      reason: "Customer requested cancellation",
    });
    return mapBackendBooking(res);
  }

  const existing = await fetchBookingById(id);
  if (!existing) throw new Error("Booking not found");
  return {
    ...existing,
    status: "cancelled",
    paymentStatus: "paid",
  };
}

export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string
): Promise<CustomerBooking> {
  const existing = await fetchBookingById(id);
  if (!existing) throw new Error("Booking not found");
  return {
    ...existing,
    date: newDate,
    time: newTime,
    status: "scheduled",
  };
}
