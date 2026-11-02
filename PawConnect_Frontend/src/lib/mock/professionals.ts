export type ProfessionalAppointmentStatus =
  | "upcoming"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export type VerificationStatus = "verified" | "pending" | "rejected" | "blocked";

export interface DaySchedule {
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  active: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number; // 15, 30, 45, 60
}

export interface ProfessionalAvailability {
  id: string;
  role: "vet" | "provider";
  professionalId: string;
  weeklySchedule: DaySchedule[];
  notes?: string;
  updatedAt: string;
}

export interface ProfessionalAppointment {
  id: string;
  appointmentNumber: string;
  veterinarianId: string;
  date: string; // YYYY-MM-DD
  time: string; // "10:30 AM"
  durationMinutes: number;
  type: string;
  status: ProfessionalAppointmentStatus;
  reason: string;
  notes?: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    gender: "Male" | "Female";
    weight: number;
    photo: string;
    color?: string;
    microchipId?: string;
    vaccinations?: { name: string; date: string; nextDue: string }[];
    medicalHistory?: { date: string; type: string; description: string }[];
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
    preferredContact?: string;
  };
  createdAt: string;
}

export interface ProviderBooking {
  id: string;
  bookingNumber: string;
  providerId: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: "grooming" | "training";
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  status: ProfessionalAppointmentStatus;
  notes?: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    gender: "Male" | "Female";
    weight: number;
    photo: string;
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  name: string;
  category: "grooming" | "training";
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
}

export interface VeterinarianProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  clinic: string;
  location: string;
  clinicLatitude?: number;
  clinicLongitude?: number;
  bio: string;
  photo: string;
  verificationStatus: VerificationStatus;
}

export interface ServiceProviderProfile {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  providerType: "grooming" | "training";
  specializations: string[];
  experienceYears: number;
  location: string;
  latitude?: number;
  longitude?: number;
  bio: string;
  photo: string;
  verificationStatus: VerificationStatus;
}

// ─── INITIAL MOCK DATA ────────────────────────────────────────────────────────

export const INITIAL_VET_PROFILE: VeterinarianProfile = {
  id: "vet-1",
  name: "Dr. Sarah Vance, DVM",
  email: "dr.vance@pawconnect.care",
  phone: "+1 (555) 742-8800",
  qualification: "Doctor of Veterinary Medicine (UC Davis), DACVS",
  specialization: "Small Animal Surgery & Preventative Clinical Medicine",
  experienceYears: 12,
  clinic: "PawConnect Central Animal Hospital",
  location: "San Francisco, CA",
  bio: "Dedicated veterinarian with over a decade of clinical experience in canine and feline wellness, comprehensive diagnostics, soft tissue procedures, and compassionate chronic care management.",
  photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
  verificationStatus: "verified",
};

export const INITIAL_PROVIDER_PROFILE: ServiceProviderProfile = {
  id: "provider-1",
  name: "Chloe Dupont",
  businessName: "Posh Paws Luxury Spa & Positive Canine Academy",
  email: "chloe.dupont@poshpaws.care",
  phone: "+1 (555) 912-3450",
  providerType: "grooming",
  specializations: ["Breed-Specific Styling", "Hypoallergenic Spa Therapy", "Fear-Free Handling"],
  experienceYears: 8,
  location: "San Francisco, CA",
  bio: "Master Certified Pet Stylist and certified positive reinforcement trainer providing calm, restorative coat care and behavioral enrichment tailored to each animal's emotional comfort.",
  photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
  verificationStatus: "verified",
};

const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: "Monday", active: true, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
  { day: "Tuesday", active: true, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
  { day: "Wednesday", active: true, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
  { day: "Thursday", active: true, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
  { day: "Friday", active: true, startTime: "09:00", endTime: "16:00", slotDurationMinutes: 30 },
  { day: "Saturday", active: true, startTime: "10:00", endTime: "14:00", slotDurationMinutes: 30 },
  { day: "Sunday", active: false, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
];

export const INITIAL_VET_AVAILABILITY: ProfessionalAvailability = {
  id: "avail-vet-1",
  role: "vet",
  professionalId: "vet-1",
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  notes: "Emergency walk-in triage reserved on Fridays 15:00-16:00.",
  updatedAt: "2026-10-01",
};

export const INITIAL_PROVIDER_AVAILABILITY: ProfessionalAvailability = {
  id: "avail-prov-1",
  role: "provider",
  professionalId: "provider-1",
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  notes: "Full spa transformations require 60-minute appointment slots.",
  updatedAt: "2026-10-01",
};

export const INITIAL_VET_APPOINTMENTS: ProfessionalAppointment[] = [
  {
    id: "appt-1",
    appointmentNumber: "PC-VET-9281",
    veterinarianId: "vet-1",
    date: "2026-10-08",
    time: "10:30 AM",
    durationMinutes: 45,
    type: "Comprehensive Clinical Examination",
    status: "confirmed",
    reason: "Follow-up check on right ear allergen sensitivity. Milo was energetic all week.",
    notes: "Patient exhibited clear tympanic membrane on previous visit. Verify cytology progress.",
    pet: {
      id: "pet-1",
      name: "Milo",
      species: "Dog",
      breed: "Golden Retriever",
      age: 3,
      gender: "Male",
      weight: 29.5,
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
      color: "Honey Blonde",
      microchipId: "985141002934812",
      vaccinations: [
        { name: "DHPP (Distemper, Parvo)", date: "2026-02-10", nextDue: "2027-02-10" },
        { name: "Rabies 3-Year", date: "2025-05-15", nextDue: "2028-05-15" },
        { name: "Bordetella Oral", date: "2026-04-12", nextDue: "2027-04-12" },
      ],
      medicalHistory: [
        { date: "2026-09-18", type: "Examination", description: "Seasonal allergic otitis externa treated with topical suspension." },
        { date: "2025-11-04", type: "Dental", description: "Routine ultrasonic scale and polish. Zero extractions." },
      ],
    },
    owner: {
      id: "cust-1",
      name: "Jane Doe",
      phone: "+1 (555) 234-5678",
      email: "jane.doe@example.com",
      preferredContact: "Phone call or SMS",
    },
    createdAt: "2026-10-06T09:12:00Z",
  },
  {
    id: "appt-2",
    appointmentNumber: "PC-VET-9282",
    veterinarianId: "vet-1",
    date: "2026-10-08",
    time: "02:00 PM",
    durationMinutes: 30,
    type: "Annual Vaccination & Heartworm Screen",
    status: "confirmed",
    reason: "Annual wellness booster and 4Dx heartworm/tick antigen blood draw.",
    notes: "No known vaccine reactions. Fasting blood draw not required.",
    pet: {
      id: "pet-2",
      name: "Luna",
      species: "Cat",
      breed: "Ragdoll",
      age: 2,
      gender: "Female",
      weight: 4.8,
      photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
      color: "Seal Point",
      microchipId: "985141002934991",
      vaccinations: [
        { name: "FVRCP 3-Year", date: "2025-10-02", nextDue: "2026-10-02" },
        { name: "Feline Leukemia (FeLV)", date: "2025-10-02", nextDue: "2026-10-02" },
      ],
      medicalHistory: [
        { date: "2025-10-02", type: "Examination", description: "Juvenile health checkup. Clean cardiopulmonary auscultation." },
      ],
    },
    owner: {
      id: "cust-2",
      name: "Michael Chen",
      phone: "+1 (555) 345-6789",
      email: "michael.chen@example.com",
    },
    createdAt: "2026-10-05T14:30:00Z",
  },
  {
    id: "appt-3",
    appointmentNumber: "PC-VET-9283",
    veterinarianId: "vet-1",
    date: "2026-10-08",
    time: "04:30 PM",
    durationMinutes: 30,
    type: "Dermatological Allergy Consult",
    status: "upcoming",
    reason: "Persistent paw chewing and abdominal erythema over the past 48 hours.",
    pet: {
      id: "pet-3",
      name: "Oliver",
      species: "Cat",
      breed: "Domestic Shorthair",
      age: 4,
      gender: "Male",
      weight: 5.2,
      photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-3",
      name: "Emily Rodriguez",
      phone: "+1 (555) 456-7890",
      email: "emily.r@example.com",
    },
    createdAt: "2026-10-07T11:00:00Z",
  },
  {
    id: "appt-4",
    appointmentNumber: "PC-VET-9279",
    veterinarianId: "vet-1",
    date: "2026-10-09",
    time: "11:00 AM",
    durationMinutes: 60,
    type: "Orthopedic Evaluation & Mobility Check",
    status: "upcoming",
    reason: "Mild stiffness in hind legs after rising in the morning.",
    pet: {
      id: "pet-4",
      name: "Bella",
      species: "Dog",
      breed: "French Bulldog",
      age: 5,
      gender: "Female",
      weight: 12.1,
      photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-4",
      name: "David Kim",
      phone: "+1 (555) 567-8901",
      email: "david.kim@example.com",
    },
    createdAt: "2026-10-04T16:20:00Z",
  },
  {
    id: "appt-5",
    appointmentNumber: "PC-VET-9270",
    veterinarianId: "vet-1",
    date: "2026-10-06",
    time: "09:30 AM",
    durationMinutes: 30,
    type: "Post-Op Wound Care & Suture Removal",
    status: "completed",
    reason: "14-day post-spay suture check. Incision site clean and dry.",
    notes: "Sutures successfully removed. Incision healed with primary intention. Discharged without restrictions.",
    pet: {
      id: "pet-1",
      name: "Milo",
      species: "Dog",
      breed: "Golden Retriever",
      age: 3,
      gender: "Male",
      weight: 29.5,
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-1",
      name: "Jane Doe",
      phone: "+1 (555) 234-5678",
      email: "jane.doe@example.com",
    },
    createdAt: "2026-09-28T10:15:00Z",
  },
  {
    id: "appt-6",
    appointmentNumber: "PC-VET-9265",
    veterinarianId: "vet-1",
    date: "2026-10-05",
    time: "03:00 PM",
    durationMinutes: 30,
    type: "Senior Feline Blood Chemistry Panel",
    status: "completed",
    reason: "Semi-annual geriatrics monitoring. Renal markers stable.",
    pet: {
      id: "pet-3",
      name: "Oliver",
      species: "Cat",
      breed: "Domestic Shorthair",
      age: 4,
      gender: "Male",
      weight: 5.2,
      photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-3",
      name: "Emily Rodriguez",
      phone: "+1 (555) 456-7890",
      email: "emily.r@example.com",
    },
    createdAt: "2026-09-30T08:00:00Z",
  },
  {
    id: "appt-7",
    appointmentNumber: "PC-VET-9258",
    veterinarianId: "vet-1",
    date: "2026-10-04",
    time: "01:30 PM",
    durationMinutes: 30,
    type: "Routine Puppy Wellness Visit",
    status: "cancelled",
    reason: "Owner requested reschedule due to out-of-town travel conflict.",
    notes: "Cancelled by owner with 24-hr advance notice.",
    pet: {
      id: "pet-2",
      name: "Luna",
      species: "Cat",
      breed: "Ragdoll",
      age: 2,
      gender: "Female",
      weight: 4.8,
      photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-2",
      name: "Michael Chen",
      phone: "+1 (555) 345-6789",
      email: "michael.chen@example.com",
    },
    createdAt: "2026-09-29T15:45:00Z",
  },
];

export const INITIAL_PROVIDER_SERVICES: ProviderService[] = [
  {
    id: "srv-grm-1",
    providerId: "provider-1",
    name: "Full Royal Spa Bath & Coat Styling",
    category: "grooming",
    description: "Hydro-massage therapeutic warm bath with hypoallergenic blueberry facial, hand blow-dry, breed-standard scissor sculpting, ear flush, and nail buffing.",
    price: 95,
    durationMinutes: 75,
    active: true,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "srv-grm-2",
    providerId: "provider-1",
    name: "Undercoat De-Shedding & Dermal Therapy",
    category: "grooming",
    description: "Specialized low-stress undercoat release utilizing organic botanical conditioner and high-velocity deshedding to eliminate up to 90% of dead fur.",
    price: 75,
    durationMinutes: 60,
    active: true,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "srv-grm-3",
    providerId: "provider-1",
    name: "Pawdicure & Organic Pad Balm Treatment",
    category: "grooming",
    description: "Gentle diamond-rotary nail filing, pad hair clearing, and soothing shea butter foot treatment for dry or cracked paws.",
    price: 35,
    durationMinutes: 25,
    active: true,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "srv-trn-1",
    providerId: "provider-1",
    name: "Puppy Foundation & Positive Socialization",
    category: "training",
    description: "Private one-on-one session emphasizing crate comfort, potty routine consistency, bite inhibition, and polite greeting manners.",
    price: 110,
    durationMinutes: 60,
    active: true,
    createdAt: "2026-09-10T09:00:00Z",
  },
  {
    id: "srv-trn-2",
    providerId: "provider-1",
    name: "Leash Reactivity & Loose-Leash Walking",
    category: "training",
    description: "Targeted counter-conditioning and desensitization for dogs that pull, bark, or lunge during neighborhood walks.",
    price: 130,
    durationMinutes: 60,
    active: true,
    createdAt: "2026-09-10T09:00:00Z",
  },
  {
    id: "srv-trn-3",
    providerId: "provider-1",
    name: "Advanced Recall & Off-Leash Reliability",
    category: "training",
    description: "Proofing emergency recall cues with high-value reinforcement, long-line field training, and handler engagement drills.",
    price: 140,
    durationMinutes: 60,
    active: false,
    createdAt: "2026-09-15T10:00:00Z",
  },
];

export const INITIAL_PROVIDER_BOOKINGS: ProviderBooking[] = [
  {
    id: "pbook-1",
    bookingNumber: "PC-GRM-4019",
    providerId: "provider-1",
    serviceId: "srv-grm-1",
    serviceName: "Full Royal Spa Bath & Coat Styling",
    serviceCategory: "grooming",
    date: "2026-10-08",
    time: "11:00 AM",
    durationMinutes: 75,
    price: 95,
    status: "confirmed",
    notes: "Milo loves the blueberry face massage. Sensitive skin on lower back.",
    pet: {
      id: "pet-1",
      name: "Milo",
      species: "Dog",
      breed: "Golden Retriever",
      age: 3,
      gender: "Male",
      weight: 29.5,
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-1",
      name: "Jane Doe",
      phone: "+1 (555) 234-5678",
      email: "jane.doe@example.com",
    },
    createdAt: "2026-10-06T12:00:00Z",
  },
  {
    id: "pbook-2",
    bookingNumber: "PC-GRM-4020",
    providerId: "provider-1",
    serviceId: "srv-grm-3",
    serviceName: "Pawdicure & Organic Pad Balm Treatment",
    serviceCategory: "grooming",
    date: "2026-10-08",
    time: "01:30 PM",
    durationMinutes: 25,
    price: 35,
    status: "confirmed",
    notes: "Luna is calm during claw trimming if cuddled gently.",
    pet: {
      id: "pet-2",
      name: "Luna",
      species: "Cat",
      breed: "Ragdoll",
      age: 2,
      gender: "Female",
      weight: 4.8,
      photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-2",
      name: "Michael Chen",
      phone: "+1 (555) 345-6789",
      email: "michael.chen@example.com",
    },
    createdAt: "2026-10-07T09:40:00Z",
  },
  {
    id: "pbook-3",
    bookingNumber: "PC-TRN-8821",
    providerId: "provider-1",
    serviceId: "srv-trn-1",
    serviceName: "Puppy Foundation & Positive Socialization",
    serviceCategory: "training",
    date: "2026-10-09",
    time: "10:00 AM",
    durationMinutes: 60,
    price: 110,
    status: "upcoming",
    notes: "Working on door greeting without jumping and name attention reflex.",
    pet: {
      id: "pet-4",
      name: "Bella",
      species: "Dog",
      breed: "French Bulldog",
      age: 1,
      gender: "Female",
      weight: 10.4,
      photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-4",
      name: "David Kim",
      phone: "+1 (555) 567-8901",
      email: "david.kim@example.com",
    },
    createdAt: "2026-10-05T15:10:00Z",
  },
  {
    id: "pbook-4",
    bookingNumber: "PC-GRM-4015",
    providerId: "provider-1",
    serviceId: "srv-grm-2",
    serviceName: "Undercoat De-Shedding & Dermal Therapy",
    serviceCategory: "grooming",
    date: "2026-10-05",
    time: "02:00 PM",
    durationMinutes: 60,
    price: 75,
    status: "completed",
    notes: "Over 2 bags of undercoat removed. Client thrilled with coat sheen.",
    pet: {
      id: "pet-1",
      name: "Milo",
      species: "Dog",
      breed: "Golden Retriever",
      age: 3,
      gender: "Male",
      weight: 29.5,
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-1",
      name: "Jane Doe",
      phone: "+1 (555) 234-5678",
      email: "jane.doe@example.com",
    },
    createdAt: "2026-09-30T11:20:00Z",
  },
  {
    id: "pbook-5",
    bookingNumber: "PC-TRN-8812",
    providerId: "provider-1",
    serviceId: "srv-trn-2",
    serviceName: "Leash Reactivity & Loose-Leash Walking",
    serviceCategory: "training",
    date: "2026-10-03",
    time: "03:30 PM",
    durationMinutes: 60,
    price: 130,
    status: "completed",
    notes: "Introduced U-turn cue and marker word 'Yes'. Homework assigned for week 1.",
    pet: {
      id: "pet-4",
      name: "Bella",
      species: "Dog",
      breed: "French Bulldog",
      age: 1,
      gender: "Female",
      weight: 10.4,
      photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-4",
      name: "David Kim",
      phone: "+1 (555) 567-8901",
      email: "david.kim@example.com",
    },
    createdAt: "2026-09-28T09:00:00Z",
  },
  {
    id: "pbook-6",
    bookingNumber: "PC-GRM-4008",
    providerId: "provider-1",
    serviceId: "srv-grm-1",
    serviceName: "Full Royal Spa Bath & Coat Styling",
    serviceCategory: "grooming",
    date: "2026-10-02",
    time: "10:00 AM",
    durationMinutes: 75,
    price: 95,
    status: "cancelled",
    notes: "Cancelled by owner due to pet feeling under the weather.",
    pet: {
      id: "pet-3",
      name: "Oliver",
      species: "Cat",
      breed: "Domestic Shorthair",
      age: 4,
      gender: "Male",
      weight: 5.2,
      photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80",
    },
    owner: {
      id: "cust-3",
      name: "Emily Rodriguez",
      phone: "+1 (555) 456-7890",
      email: "emily.r@example.com",
    },
    createdAt: "2026-09-25T14:15:00Z",
  },
];
