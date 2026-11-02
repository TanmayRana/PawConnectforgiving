/**
 * Pets & Health Records API
 * Connects to Spring Boot /api/me/pets, /vaccinations, and /medical-records.
 */

import { apiGet, apiPost, apiPut, apiDelete, type PageResponse } from "./client";
import type { Pet, VaccinationRecord, MedicalRecord } from "@/lib/mock/pets";

export type { Pet, VaccinationRecord, MedicalRecord };

interface BackendPet {
  id: number;
  ownerId: number;
  ownerName?: string;
  name: string;
  species: string;
  breed?: string;
  dateOfBirth?: string;
  age?: string;
  gender: "MALE" | "FEMALE";
  weight?: number;
  photoUrl?: string;
  notes?: string;
  microchipNumber?: string;
  microchipId?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

interface BackendVaccination {
  id: number;
  petId: number;
  petName?: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate: string;
  administeredBy?: string;
  notes?: string;
  certificateUrl?: string;
}

interface BackendMedicalRecord {
  id: number;
  petId: number;
  petName?: string;
  veterinarianId?: number;
  veterinarianName?: string;
  isVeterinarianVerified?: boolean;
  recordType?: string;
  diagnosis?: string;
  treatment?: string;
  medicines?: string;
  recordDate: string;
  attachmentUrl?: string;
  notes?: string;
}

function mapVaccination(v: BackendVaccination): VaccinationRecord {
  return {
    id: String(v.id),
    petId: String(v.petId),
    vaccineName: v.vaccineName,
    dateAdministered: v.vaccinationDate,
    nextDueDate: v.nextDueDate,
    veterinarian: v.administeredBy || "Licensed Veterinarian",
    notes: v.notes,
  };
}

function mapMedicalRecord(m: BackendMedicalRecord): MedicalRecord {
  const typeStr = (m.recordType || "Examination") as MedicalRecord["recordType"];
  return {
    id: String(m.id),
    petId: String(m.petId),
    recordType: ["Examination", "Surgery", "Dental", "Diagnostic", "Therapy"].includes(typeStr)
      ? typeStr
      : "Examination",
    date: m.recordDate,
    description: m.diagnosis || m.treatment || "Routine checkup",
    veterinarian: m.veterinarianName || "Attending Veterinarian",
    clinic: "PawConnect Animal Hospital",
    notes: m.notes,
  };
}

function calculateAge(dob?: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  if (diffMs <= 0) return 0;
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(diffYears * 10) / 10;
}

function getDobFromAge(ageYears: number): string {
  const daysAgo = Math.round(Number(ageYears) * 365.25);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function mapBackendPet(
  p: BackendPet,
  vaccinations: VaccinationRecord[] = [],
  medicalRecords: MedicalRecord[] = []
): Pet {
  // Extract color from notes if encoded as "Color: <val>"
  let color = "Standard";
  if (p.notes && /Color:\s*([^;\n]+)/i.test(p.notes)) {
    const match = p.notes.match(/Color:\s*([^;\n]+)/i);
    if (match) {
      color = match[1].trim();
    }
  }

  // Extract microchip from direct fields or notes fallback "Microchip: <val>"
  let chip = (p.microchipNumber || p.microchipId || "").trim();
  if (!chip && p.notes && /Microchip:\s*([^;\n]+)/i.test(p.notes)) {
    const match = p.notes.match(/Microchip:\s*([^;\n]+)/i);
    if (match) {
      chip = match[1].trim();
    }
  }

  // Handle species capitalization gracefully
  const rawSpecies = p.species || "Dog";
  const speciesNorm = rawSpecies.toLowerCase();
  const speciesVal: Pet["species"] =
    speciesNorm === "dog"
      ? "Dog"
      : speciesNorm === "cat"
      ? "Cat"
      : speciesNorm === "bird"
      ? "Bird"
      : rawSpecies;

  const isFemale =
    p.gender === "FEMALE" || (typeof p.gender === "string" && p.gender.toUpperCase() === "FEMALE");

  return {
    id: String(p.id),
    name: p.name,
    species: speciesVal,
    breed: p.breed || "",
    gender: isFemale ? "Female" : "Male",
    age: calculateAge(p.dateOfBirth),
    birthDate: p.dateOfBirth,
    dateOfBirth: p.dateOfBirth,
    weight: p.weight !== undefined && p.weight !== null ? Number(p.weight) : 0,
    color: color,
    photo: p.photoUrl || "",
    photoUrl: p.photoUrl || "",
    notes: p.notes || "",
    status: p.status || "ACTIVE",
    microchipId: chip,
    microchipNumber: chip,
    ownerId: String(p.ownerId),
    vaccinations,
    medicalRecords,
  };
}

export async function fetchPets(): Promise<Pet[]> {
  const res = await apiGet<PageResponse<BackendPet>>("/me/pets", {
    params: { size: 50 },
  });

  const petList = res?.content || [];
  const petsWithRecords = await Promise.all(
    petList.map(async (pet) => {
      try {
        const [vacRes, medRes] = await Promise.all([
          apiGet<PageResponse<BackendVaccination>>(`/me/pets/${pet.id}/vaccinations`, {
            params: { size: 50 },
          }),
          apiGet<PageResponse<BackendMedicalRecord>>(`/me/pets/${pet.id}/medical-records`, {
            params: { size: 50 },
          }),
        ]);
        const vacs = (vacRes?.content || []).map(mapVaccination);
        const meds = (medRes?.content || []).map(mapMedicalRecord);
        return mapBackendPet(pet, vacs, meds);
      } catch {
        return mapBackendPet(pet, [], []);
      }
    })
  );

  return petsWithRecords;
}

export async function fetchPetById(id: string): Promise<Pet | null> {
  try {
    const pet = await apiGet<BackendPet>(`/me/pets/${id}`);
    const [vacRes, medRes] = await Promise.all([
      apiGet<PageResponse<BackendVaccination>>(`/me/pets/${id}/vaccinations`, {
        params: { size: 50 },
      }),
      apiGet<PageResponse<BackendMedicalRecord>>(`/me/pets/${id}/medical-records`, {
        params: { size: 50 },
      }),
    ]);
    const vacs = (vacRes?.content || []).map(mapVaccination);
    const meds = (medRes?.content || []).map(mapMedicalRecord);
    return mapBackendPet(pet, vacs, meds);
  } catch {
    return null;
  }
}

export async function createPet(
  data: Partial<Pet> & { name: string; species: string }
): Promise<Pet> {
  const genderUpper =
    data.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE";

  const dob =
    data.dateOfBirth ||
    data.birthDate ||
    (data.age !== undefined && data.age !== null && !isNaN(Number(data.age))
      ? getDobFromAge(data.age)
      : new Date().toISOString().split("T")[0]);

  const chipStr = (data.microchipId || data.microchipNumber || "").trim();

  // Combine notes, color, and microchip intelligently without dropping either
  let finalNotes = data.notes?.trim() || "";
  const colorStr = data.color?.trim();
  if (colorStr && !finalNotes.toLowerCase().includes("color:")) {
    finalNotes = finalNotes ? `Color: ${colorStr}\n${finalNotes}` : `Color: ${colorStr}`;
  }
  if (chipStr && !finalNotes.toLowerCase().includes("microchip:")) {
    finalNotes = finalNotes ? `${finalNotes}\nMicrochip: ${chipStr}` : `Microchip: ${chipStr}`;
  }

  const weightNum =
    data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))
      ? Number(data.weight)
      : 1;

  const payload = {
    name: data.name.trim(),
    species: data.species.trim(),
    breed: data.breed?.trim() || null,
    dateOfBirth: dob,
    gender: genderUpper,
    weight: weightNum,
    photoUrl: data.photoUrl || data.photo || null,
    notes: finalNotes || null,
    microchipNumber: chipStr || null,
    microchipId: chipStr || null,
  };

  const created = await apiPost<BackendPet>("/me/pets", payload);
  return mapBackendPet(created, [], []);
}

export async function updatePet(
  id: string,
  data: Partial<Pet>
): Promise<Pet> {
  const existing = await fetchPetById(id);

  const genderUpper = data.gender
    ? data.gender.toUpperCase() === "FEMALE"
      ? "FEMALE"
      : "MALE"
    : existing?.gender?.toUpperCase() === "FEMALE"
    ? "FEMALE"
    : "MALE";

  const dob =
    data.dateOfBirth ||
    data.birthDate ||
    (data.age !== undefined && data.age !== null && !isNaN(Number(data.age))
      ? getDobFromAge(data.age)
      : existing?.dateOfBirth || existing?.birthDate);

  const chipStr =
    data.microchipId !== undefined
      ? data.microchipId.trim()
      : data.microchipNumber !== undefined
      ? data.microchipNumber.trim()
      : existing?.microchipId || existing?.microchipNumber || "";

  // Preserve and update notes & color & microchip
  let finalNotes: string | null = null;
  if (data.notes !== undefined) {
    finalNotes = data.notes.trim();
    const colorStr = data.color?.trim();
    if (colorStr && !finalNotes.toLowerCase().includes("color:")) {
      finalNotes = finalNotes ? `Color: ${colorStr}\n${finalNotes}` : `Color: ${colorStr}`;
    }
    if (chipStr && !finalNotes.toLowerCase().includes("microchip:")) {
      finalNotes = finalNotes ? `${finalNotes}\nMicrochip: ${chipStr}` : `Microchip: ${chipStr}`;
    }
  } else {
    finalNotes = existing?.notes || null;
    if (data.color !== undefined) {
      const colorStr = data.color.trim();
      const existingNotes = finalNotes || "";
      if (existingNotes.toLowerCase().includes("color:")) {
        finalNotes = existingNotes.replace(/Color:\s*([^;\n]+)/i, `Color: ${colorStr}`);
      } else {
        finalNotes = existingNotes ? `Color: ${colorStr}\n${existingNotes}` : `Color: ${colorStr}`;
      }
    }
    if (chipStr) {
      const existingNotes = finalNotes || "";
      if (existingNotes.toLowerCase().includes("microchip:")) {
        finalNotes = existingNotes.replace(/Microchip:\s*([^;\n]+)/i, `Microchip: ${chipStr}`);
      } else {
        finalNotes = existingNotes ? `${existingNotes}\nMicrochip: ${chipStr}` : `Microchip: ${chipStr}`;
      }
    }
  }

  const weightVal =
    data.weight !== undefined && data.weight !== null && !isNaN(Number(data.weight))
      ? Number(data.weight)
      : existing?.weight !== undefined && existing?.weight !== null
      ? Number(existing.weight)
      : 1;

  const payload: Record<string, unknown> = {
    name: data.name?.trim() || existing?.name || "Pet",
    species: data.species?.trim() || existing?.species || "Dog",
    breed: data.breed !== undefined ? (data.breed?.trim() || null) : existing?.breed,
    dateOfBirth: dob,
    gender: genderUpper,
    weight: weightVal,
    photoUrl: data.photoUrl || data.photo || existing?.photoUrl || existing?.photo,
    notes: finalNotes,
    microchipNumber: chipStr || null,
    microchipId: chipStr || null,
    status: data.status || existing?.status || "ACTIVE",
  };

  const updated = await apiPut<BackendPet>(`/me/pets/${id}`, payload);
  return mapBackendPet(
    updated,
    existing?.vaccinations || [],
    existing?.medicalRecords || []
  );
}

export async function deletePet(id: string): Promise<boolean> {
  await apiDelete<void>(`/me/pets/${id}`);
  return true;
}

export async function addVaccinationRecord(
  petId: string,
  record: Omit<VaccinationRecord, "id" | "petId">
): Promise<VaccinationRecord> {
  const payload = {
    vaccineName: record.vaccineName,
    vaccinationDate: record.dateAdministered,
    nextDueDate: record.nextDueDate || null,
    administeredBy: record.veterinarian,
    notes: record.notes,
  };

  const created = await apiPost<BackendVaccination>(
    `/me/pets/${petId}/vaccinations`,
    payload
  );
  return mapVaccination(created);
}

export async function deleteVaccinationRecord(
  petId: string,
  vaccinationId: string
): Promise<boolean> {
  await apiDelete<void>(`/me/pets/${petId}/vaccinations/${vaccinationId}`);
  return true;
}

export async function addMedicalRecord(
  petId: string,
  record: Omit<MedicalRecord, "id" | "petId">
): Promise<MedicalRecord> {
  const payload = {
    recordDate: record.date,
    recordType: record.recordType,
    diagnosis: record.description,
    treatment: record.description,
    notes: [
      record.clinic ? `Clinic: ${record.clinic}` : "",
      record.veterinarian ? `Veterinarian: ${record.veterinarian}` : "",
      record.notes || "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const created = await apiPost<BackendMedicalRecord>(
    `/me/pets/${petId}/medical-records`,
    payload
  );
  return mapMedicalRecord(created);
}

export async function deleteMedicalRecord(
  petId: string,
  recordId: string
): Promise<boolean> {
  await apiDelete<void>(`/me/pets/${petId}/medical-records/${recordId}`);
  return true;
}
