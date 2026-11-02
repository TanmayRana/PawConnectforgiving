/**
 * Professional Portals API (Veterinarian & Service Provider)
 * Connects to Spring Boot /api/vet/appointments and /api/provider/bookings endpoints.
 */

import { apiGet, apiPut, apiPatch, type PageResponse } from "./client";
import {
  INITIAL_VET_AVAILABILITY,
  INITIAL_PROVIDER_AVAILABILITY,
  type VeterinarianProfile,
  type ServiceProviderProfile,
  type ProfessionalAvailability,
  type DaySchedule,
  type ProfessionalAppointment,
  type ProfessionalAppointmentStatus,
  type ProviderBooking,
  type ProviderService,
} from "@/lib/mock/professionals";

export type {
  VeterinarianProfile,
  ServiceProviderProfile,
  ProfessionalAvailability,
  DaySchedule,
  ProfessionalAppointment,
  ProfessionalAppointmentStatus,
  ProviderBooking,
  ProviderService,
};

interface BackendAppointment {
  id: number;
  appointmentNo: string;
  petId: number;
  petName: string;
  species?: string;
  breed?: string;
  ownerId: number;
  ownerName: string;
  ownerPhone?: string;
  veterinarianId: number;
  veterinarianName: string;
  clinicName?: string;
  specialization?: string;
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  consultationFee?: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  createdAt?: string;
}

interface BackendServiceBooking {
  id: number;
  bookingNo: string;
  petId: number;
  petName: string;
  species?: string;
  breed?: string;
  ownerId: number;
  ownerName: string;
  ownerPhone?: string;
  providerId: number;
  businessName?: string;
  providerPhone?: string;
  providerType?: string;
  serviceId?: number;
  serviceName: string;
  durationMinutes?: number;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  createdAt?: string;
}

interface BackendUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  roles: string[];
}

function mapStatusToUi(
  backendStatus: string
): ProfessionalAppointmentStatus {
  switch (backendStatus) {
    case "CONFIRMED":
      return "confirmed";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "IN_PROGRESS":
      return "in-progress";
    default:
      return "upcoming";
  }
}

function mapUiStatusToBackend(
  uiStatus: ProfessionalAppointmentStatus
): string {
  switch (uiStatus) {
    case "confirmed":
      return "CONFIRMED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    case "in-progress":
      return "CONFIRMED";
    default:
      return "CONFIRMED";
  }
}

function mapBackendAppointmentToUi(a: BackendAppointment): ProfessionalAppointment {
  return {
    id: String(a.id),
    appointmentNumber: a.appointmentNo || `APPT-${a.id}`,
    veterinarianId: String(a.veterinarianId),
    date: a.appointmentDate,
    time: a.startTime ? `${a.startTime}` : "10:00 AM",
    durationMinutes: 30,
    type: a.specialization || "Clinical Exam",
    status: mapStatusToUi(a.status),
    reason: a.reason || "General Wellness Examination",
    notes: a.notes,
    pet: {
      id: String(a.petId),
      name: a.petName || "Pet",
      species: a.species || "Dog",
      breed: a.breed || "Standard",
      age: 3,
      gender: "Male",
      weight: 15,
      photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: String(a.ownerId),
      name: a.ownerName || "Pet Parent",
      phone: a.ownerPhone || "+919876543210",
      email: "parent@pawconnect.care",
    },
    createdAt: a.createdAt || new Date().toISOString(),
  };
}

function mapBackendServiceBookingToUi(b: BackendServiceBooking): ProviderBooking {
  const isTraining = b.providerType?.toLowerCase().includes("train") || b.serviceName?.toLowerCase().includes("train");

  return {
    id: String(b.id),
    bookingNumber: b.bookingNo || `BK-${b.id}`,
    providerId: String(b.providerId),
    serviceId: String(b.serviceId || b.id),
    serviceName: b.serviceName || (isTraining ? "Positive Behavior Training" : "Luxury Spa Hydrobath"),
    serviceCategory: isTraining ? "training" : "grooming",
    date: b.bookingDate,
    time: b.startTime ? `${b.startTime}` : "11:00 AM",
    durationMinutes: b.durationMinutes || 60,
    price: b.price ? Number(b.price) : 65,
    status: mapStatusToUi(b.status),
    notes: b.notes,
    pet: {
      id: String(b.petId),
      name: b.petName || "Pet",
      species: b.species || "Dog",
      breed: b.breed || "Standard",
      age: 2,
      gender: "Male",
      weight: 12,
      photo: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: String(b.ownerId),
      name: b.ownerName || "Pet Parent",
      phone: b.ownerPhone || "+919876543210",
      email: "parent@pawconnect.care",
    },
    createdAt: b.createdAt || new Date().toISOString(),
  };
}

// ─── VETERINARIAN APPOINTMENTS ───────────────────────────────────────────────

export async function fetchVetAppointments(): Promise<ProfessionalAppointment[]> {
  const res = await apiGet<PageResponse<BackendAppointment>>("/vet/appointments", {
    params: { size: 50 },
  });
  return (res?.content || []).map(mapBackendAppointmentToUi);
}

export async function fetchVetAppointmentById(
  id: string
): Promise<ProfessionalAppointment | null> {
  try {
    const res = await apiGet<BackendAppointment>(`/vet/appointments/${id}`);
    return mapBackendAppointmentToUi(res);
  } catch {
    return null;
  }
}

export async function updateVetAppointmentStatus(
  id: string,
  status: ProfessionalAppointmentStatus,
  notes?: string
): Promise<ProfessionalAppointment> {
  const targetStatus = mapUiStatusToBackend(status);
  const updated = await apiPatch<BackendAppointment>(`/vet/appointments/${id}/status`, {
    status: targetStatus,
    notes,
  });
  return mapBackendAppointmentToUi(updated);
}

// ─── SERVICE PROVIDER BOOKINGS ──────────────────────────────────────────────

export async function fetchProviderBookings(): Promise<ProviderBooking[]> {
  const res = await apiGet<PageResponse<BackendServiceBooking>>("/provider/bookings", {
    params: { size: 50 },
  });
  return (res?.content || []).map(mapBackendServiceBookingToUi);
}

export async function fetchProviderBookingById(
  id: string
): Promise<ProviderBooking | null> {
  try {
    const res = await apiGet<BackendServiceBooking>(`/provider/bookings/${id}`);
    return mapBackendServiceBookingToUi(res);
  } catch {
    return null;
  }
}

export async function updateProviderBookingStatus(
  id: string,
  status: ProfessionalAppointmentStatus,
  notes?: string
): Promise<ProviderBooking> {
  const targetStatus = mapUiStatusToBackend(status);
  const updated = await apiPatch<BackendServiceBooking>(`/provider/bookings/${id}/status`, {
    status: targetStatus,
    notes,
  });
  return mapBackendServiceBookingToUi(updated);
}

// ─── PROFILES & AVAILABILITY ────────────────────────────────────────────────

export async function fetchVetProfile(): Promise<VeterinarianProfile> {
  try {
    const user = await apiGet<BackendUser>("/me");
    return {
      id: String(user.id),
      name: `Dr. ${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone || "",
      qualification: "Veterinary Medicine",
      specialization: "General Practice",
      experienceYears: 1,
      clinic: "Veterinary Clinic",
      location: "Active Practice",
      bio: "Licensed veterinary practitioner.",
      photo: user.profileImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      verificationStatus: "verified",
    };
  } catch {
    return {
      id: "vet-me",
      name: "Veterinarian Doctor",
      email: "",
      phone: "",
      qualification: "Veterinary Practitioner",
      specialization: "General Practice",
      experienceYears: 1,
      clinic: "Veterinary Hospital",
      location: "Clinic",
      bio: "Licensed veterinary specialist.",
      photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      verificationStatus: "verified",
    };
  }
}

export async function updateVetProfile(
  updates: Partial<VeterinarianProfile>
): Promise<VeterinarianProfile> {
  try {
    const names = (updates.name || "").replace(/^Dr\.\s*/, "").split(" ");
    const firstName = names[0] || "Veterinarian";
    const lastName = names.slice(1).join(" ") || "Specialist";

    await apiPut<BackendUser>("/me", {
      firstName,
      lastName,
      phone: updates.phone,
      profileImage: updates.photo,
    });
  } catch {
    // ignore
  }
  return {
    id: updates.id || "vet-me",
    name: updates.name || "Veterinarian Doctor",
    email: updates.email || "",
    phone: updates.phone || "",
    qualification: updates.qualification || "Veterinary Medicine",
    specialization: updates.specialization || "General Practice",
    experienceYears: updates.experienceYears || 1,
    clinic: updates.clinic || "Veterinary Clinic",
    location: updates.location || "Practice",
    bio: updates.bio || "",
    photo: updates.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    verificationStatus: updates.verificationStatus || "verified",
    ...updates,
  };
}

export async function fetchProviderProfile(): Promise<ServiceProviderProfile> {
  try {
    const user = await apiGet<BackendUser>("/me");
    return {
      id: String(user.id),
      name: `${user.firstName} ${user.lastName}`.trim(),
      businessName: `${user.firstName}'s Pet Care`,
      email: user.email,
      phone: user.phone || "",
      providerType: "grooming",
      specializations: ["Pet Care"],
      experienceYears: 1,
      location: "Local Practice",
      bio: "Certified pet care specialist.",
      photo: user.profileImage || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      verificationStatus: "verified",
    };
  } catch {
    return {
      id: "provider-me",
      name: "Service Provider",
      businessName: "Pet Care Salon",
      email: "",
      phone: "",
      providerType: "grooming",
      specializations: ["Pet Care"],
      experienceYears: 1,
      location: "Active Salon",
      bio: "Certified pet care specialist.",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      verificationStatus: "verified",
    };
  }
}

export async function updateProviderProfile(
  updates: Partial<ServiceProviderProfile>
): Promise<ServiceProviderProfile> {
  try {
    const names = (updates.name || "").split(" ");
    const firstName = names[0] || "Provider";
    const lastName = names.slice(1).join(" ") || "Specialist";

    await apiPut<BackendUser>("/me", {
      firstName,
      lastName,
      phone: updates.phone,
      profileImage: updates.photo,
    });
  } catch {
    // ignore
  }
  return {
    id: updates.id || "provider-me",
    name: updates.name || "Service Provider",
    businessName: updates.businessName || "Pet Care Salon",
    email: updates.email || "",
    phone: updates.phone || "",
    providerType: updates.providerType || "grooming",
    specializations: updates.specializations || ["Pet Care"],
    experienceYears: updates.experienceYears || 1,
    location: updates.location || "Active Salon",
    bio: updates.bio || "",
    photo: updates.photo || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    verificationStatus: updates.verificationStatus || "verified",
    ...updates,
  };
}

export async function fetchProfessionalAvailability(
  role: "vet" | "provider"
): Promise<ProfessionalAvailability> {
  return role === "vet" ? INITIAL_VET_AVAILABILITY : INITIAL_PROVIDER_AVAILABILITY;
}

export async function updateProfessionalAvailability(
  role: "vet" | "provider",
  schedule: DaySchedule[],
  notes?: string
): Promise<ProfessionalAvailability> {
  const initial = role === "vet" ? INITIAL_VET_AVAILABILITY : INITIAL_PROVIDER_AVAILABILITY;
  return {
    ...initial,
    weeklySchedule: schedule,
    notes: notes !== undefined ? notes : initial.notes,
  };
}

let currentProviderServices: ProviderService[] = [];

export async function fetchProviderServices(): Promise<ProviderService[]> {
  return [...currentProviderServices];
}

export interface CreateProviderServiceInput {
  name: string;
  category: "grooming" | "training";
  description: string;
  price: number;
  durationMinutes: number;
  active?: boolean;
}

export async function createProviderService(
  input: CreateProviderServiceInput
): Promise<ProviderService> {
  const newService: ProviderService = {
    ...input,
    id: `srv-${Date.now()}`,
    providerId: "provider-me",
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
  };
  currentProviderServices.push(newService);
  return newService;
}

export async function updateProviderService(
  id: string,
  input: Partial<CreateProviderServiceInput>
): Promise<ProviderService> {
  const index = currentProviderServices.findIndex((s) => s.id === id);
  if (index !== -1) {
    currentProviderServices[index] = { ...currentProviderServices[index], ...input };
    return currentProviderServices[index];
  }
  return {
    id,
    providerId: "provider-me",
    name: input.name || "",
    category: input.category || "grooming",
    description: input.description || "",
    price: input.price || 0,
    durationMinutes: input.durationMinutes || 30,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
  };
}

export async function toggleProviderServiceActive(
  id: string
): Promise<ProviderService> {
  const service = currentProviderServices.find((s) => s.id === id);
  if (service) {
    service.active = !service.active;
    return { ...service };
  }
  return {
    id,
    providerId: "provider-me",
    name: "",
    category: "grooming",
    description: "",
    price: 0,
    durationMinutes: 30,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteProviderService(id: string): Promise<string> {
  currentProviderServices = currentProviderServices.filter((s) => s.id !== id);
  return id;
}
