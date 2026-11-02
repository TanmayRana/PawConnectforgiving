export interface CustomerBooking {
  id: string;
  appointmentNumber: string;
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
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  paymentStatus: "paid" | "pending" | "refunded";
  paymentExpiresAt?: string;
  remainingPaymentSeconds?: number;
  canRetryPayment?: boolean;
  notes?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export const INITIAL_MOCK_BOOKINGS: CustomerBooking[] = [
  {
    id: "bk-1",
    appointmentNumber: "PC-VET-9281",
    type: "veterinary",
    providerId: "vet-1",
    providerName: "Dr. Sarah Vance, DVM",
    providerTitle: "Board-Certified Small Animal Surgeon",
    providerClinicOrBusiness: "PawConnect Central Animal Hospital",
    providerImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    serviceId: "srv-vet-1",
    serviceTitle: "Comprehensive Clinical Examination",
    petId: "pet-1",
    petName: "Milo",
    petBreed: "Golden Retriever",
    petPhoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    date: "2026-10-15",
    time: "10:30 AM",
    durationMinutes: 45,
    price: 85,
    status: "scheduled",
    paymentStatus: "paid",
    notes: "Follow-up check on right ear allergen sensitivity. Milo was energetic all week.",
    location: "PawConnect Central Animal Hospital, 742 Evergreen Terrace, San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    createdAt: "2026-10-06T09:12:00Z",
  },
  {
    id: "bk-2",
    appointmentNumber: "PC-GRM-4019",
    type: "grooming",
    providerId: "groom-1",
    providerName: "Chloe Dupont",
    providerTitle: "Posh Paws Luxury Spa & Grooming",
    providerClinicOrBusiness: "Posh Paws Luxury Spa",
    providerImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    serviceId: "srv-grm-1",
    serviceTitle: "Signature Spa & Hydro-Massage Bath",
    petId: "pet-2",
    petName: "Luna",
    petBreed: "French Bulldog",
    petPhoto: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    date: "2026-10-22",
    time: "02:00 PM",
    durationMinutes: 60,
    price: 65,
    status: "scheduled",
    paymentStatus: "paid",
    notes: "Sensitive skin shampoo request. Keep water temperature lukewarm.",
    location: "Posh Paws Suite #12, 108 Marina Blvd, San Francisco, CA",
    latitude: 37.8035,
    longitude: -122.4368,
    createdAt: "2026-10-07T14:30:00Z",
  },
  {
    id: "bk-3",
    appointmentNumber: "PC-TRN-7732",
    type: "training",
    providerId: "train-1",
    providerName: "Noah Bennett, CPDT-KA",
    providerTitle: "Certified Professional Dog Trainer",
    providerClinicOrBusiness: "Canine Mind Positive Academy",
    providerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    serviceId: "srv-trn-1",
    serviceTitle: "Puppy Foundational Manners & Socialization",
    petId: "pet-1",
    petName: "Milo",
    petBreed: "Golden Retriever",
    petPhoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    date: "2026-09-28",
    time: "11:00 AM",
    durationMinutes: 60,
    price: 95,
    status: "completed",
    paymentStatus: "paid",
    notes: "Focused on loose-leash walking around park distractions. Great response to clicker reward.",
    location: "Golden Gate Park Training Field B, San Francisco, CA",
    latitude: 37.7694,
    longitude: -122.4862,
    createdAt: "2026-09-20T11:00:00Z",
  },
  {
    id: "bk-4",
    appointmentNumber: "PC-VET-3301",
    type: "veterinary",
    providerId: "vet-2",
    providerName: "Dr. Marcus Chen, DVM",
    providerTitle: "Veterinary Dental & Urgent Care Specialist",
    providerClinicOrBusiness: "Mission District Pet Care",
    providerImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    serviceId: "srv-vet-2",
    serviceTitle: "Dental Prophylaxis & Ultrasonic Polish",
    petId: "pet-3",
    petName: "Oliver",
    petBreed: "Ragdoll",
    petPhoto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    date: "2026-08-14",
    time: "09:00 AM",
    durationMinutes: 90,
    price: 180,
    status: "completed",
    paymentStatus: "paid",
    notes: "Feline dental assessment and cleaning. Oliver woke gently with no distress.",
    location: "Mission District Pet Care, 2489 Mission St, San Francisco, CA",
    latitude: 37.7587,
    longitude: -122.4191,
    createdAt: "2026-08-01T16:45:00Z",
  },
  {
    id: "bk-5",
    appointmentNumber: "PC-GRM-2108",
    type: "grooming",
    providerId: "groom-2",
    providerName: "Marcus Sterling",
    providerTitle: "The Hound Lounge & Spa",
    providerClinicOrBusiness: "The Hound Lounge",
    providerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    serviceId: "srv-grm-2",
    serviceTitle: "Full Breed-Standard Haircut & Styling",
    petId: "pet-1",
    petName: "Milo",
    petBreed: "Golden Retriever",
    petPhoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-10",
    time: "03:30 PM",
    durationMinutes: 90,
    price: 95,
    status: "cancelled",
    paymentStatus: "refunded",
    notes: "Cancelled due to owner scheduling conflict. Full refund issued.",
    location: "The Hound Lounge, 520 Haight St, San Francisco, CA",
    latitude: 37.7719,
    longitude: -122.4312,
    createdAt: "2026-07-02T10:15:00Z",
  },
];
