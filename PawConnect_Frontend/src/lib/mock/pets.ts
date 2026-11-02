export interface VaccinationRecord {
  id: string;
  petId: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  veterinarian: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  recordType: "Examination" | "Surgery" | "Dental" | "Diagnostic" | "Therapy";
  date: string;
  description: string;
  veterinarian: string;
  clinic: string;
  notes?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Other" | string;
  breed: string;
  gender: "Male" | "Female" | "MALE" | "FEMALE";
  age: number; // in years
  birthDate?: string;
  dateOfBirth?: string;
  weight: number; // in kg
  color: string;
  photo: string;
  photoUrl?: string;
  notes?: string;
  status?: "ACTIVE" | "INACTIVE";
  microchipId?: string;
  microchipNumber?: string;
  ownerId: string;
  vaccinations: VaccinationRecord[];
  medicalRecords: MedicalRecord[];
}

export const INITIAL_MOCK_PETS: Pet[] = [
  {
    id: "pet-1",
    name: "Milo",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "Male",
    age: 3,
    birthDate: "2023-04-12",
    weight: 29.5,
    color: "Honey Blonde",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    microchipId: "985141002934812",
    ownerId: "cust-1",
    vaccinations: [
      {
        id: "vac-1",
        petId: "pet-1",
        vaccineName: "DHPP (Distemper, Parvo)",
        dateAdministered: "2026-02-10",
        nextDueDate: "2027-02-10",
        veterinarian: "Dr. Sarah Vance, DVM",
        notes: "Three-year booster administered with no adverse reactions.",
      },
      {
        id: "vac-2",
        petId: "pet-1",
        vaccineName: "Rabies 3-Year",
        dateAdministered: "2025-05-18",
        nextDueDate: "2028-05-18",
        veterinarian: "Dr. Elena Rostova, DVM",
        notes: "Certified microchipped vaccination tag issued.",
      },
      {
        id: "vac-3",
        petId: "pet-1",
        vaccineName: "Bordetella (Kennel Cough)",
        dateAdministered: "2026-08-01",
        nextDueDate: "2027-02-01",
        veterinarian: "Dr. Marcus Chen, DVM",
        notes: "Oral mucosal dose ahead of scheduled autumn boarding.",
      },
    ],
    medicalRecords: [
      {
        id: "med-1",
        petId: "pet-1",
        recordType: "Examination",
        date: "2026-08-15",
        description: "Annual comprehensive wellness exam & ear cytology",
        veterinarian: "Dr. Sarah Vance, DVM",
        clinic: "PawConnect Central Animal Hospital",
        notes: "Mild yeast buildup cleared with Otomax drops. Heart and lungs clear.",
      },
      {
        id: "med-2",
        petId: "pet-1",
        recordType: "Dental",
        date: "2025-11-20",
        description: "Ultrasonic dental scaling and polish under sedation",
        veterinarian: "Dr. Marcus Chen, DVM",
        clinic: "Mission District Pet Care",
        notes: "All 42 teeth intact. Negligible tartar recurrence, gums healthy.",
      },
    ],
  },
  {
    id: "pet-2",
    name: "Luna",
    species: "Dog",
    breed: "French Bulldog",
    gender: "Female",
    age: 2,
    birthDate: "2024-06-20",
    weight: 11.2,
    color: "Lilac Fawn",
    photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    microchipId: "985141009841120",
    ownerId: "cust-1",
    vaccinations: [
      {
        id: "vac-4",
        petId: "pet-2",
        vaccineName: "DHPP Core Booster",
        dateAdministered: "2026-06-15",
        nextDueDate: "2027-06-15",
        veterinarian: "Dr. Sarah Vance, DVM",
        notes: "Tolerated well. Rest advised for 24 hours.",
      },
      {
        id: "vac-5",
        petId: "pet-2",
        vaccineName: "Leptospirosis 4-Way",
        dateAdministered: "2026-06-15",
        nextDueDate: "2027-06-15",
        veterinarian: "Dr. Sarah Vance, DVM",
        notes: "Recommended due to frequent park trail walking.",
      },
    ],
    medicalRecords: [
      {
        id: "med-3",
        petId: "pet-2",
        recordType: "Diagnostic",
        date: "2026-04-10",
        description: "Stenotic nares & soft palate airway check",
        veterinarian: "Dr. Sarah Vance, DVM",
        clinic: "PawConnect Central Animal Hospital",
        notes: "Breathing sounds normal; no surgical intervention required at this stage.",
      },
    ],
  },
  {
    id: "pet-3",
    name: "Oliver",
    species: "Cat",
    breed: "Ragdoll",
    gender: "Male",
    age: 4,
    birthDate: "2022-09-05",
    weight: 5.8,
    color: "Seal Point",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    microchipId: "985141004123998",
    ownerId: "cust-1",
    vaccinations: [
      {
        id: "vac-6",
        petId: "pet-3",
        vaccineName: "FVRCP (Feline Core)",
        dateAdministered: "2025-09-12",
        nextDueDate: "2028-09-12",
        veterinarian: "Dr. Elena Rostova, DVM",
        notes: "Indoor lifestyle maintained. Excellent body condition.",
      },
    ],
    medicalRecords: [
      {
        id: "med-4",
        petId: "pet-3",
        recordType: "Examination",
        date: "2026-01-18",
        description: "Routine senior-transition blood chemistry & urinalysis",
        veterinarian: "Dr. Elena Rostova, DVM",
        clinic: "Pacific Feline Medical Center",
        notes: "Kidney panel and thyroid values in optimal range.",
      },
    ],
  },
];
