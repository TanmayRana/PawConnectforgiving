import type { ProfessionalAppointmentStatus } from "./professionals";

// ─── USER MANAGEMENT TYPES ───────────────────────────────────────────────────

export type PlatformRole = "pet_owner" | "veterinarian" | "service_provider" | "admin";
export type UserStatus = "active" | "blocked";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  status: UserStatus;
  avatar?: string;
  petCount: number;
  bookingCount: number;
  orderCount: number;
  createdAt: string;
  lastActive: string;
}

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: "usr-1",
    name: "Alex Morgan",
    email: "alex.morgan@pawconnect.care",
    phone: "+1 (555) 234-5678",
    role: "pet_owner",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    petCount: 2,
    bookingCount: 5,
    orderCount: 3,
    createdAt: "2026-08-14",
    lastActive: "Today at 09:20 AM",
  },
  {
    id: "usr-2",
    name: "Dr. Sarah Vance, DVM",
    email: "dr.vance@pawconnect.care",
    phone: "+1 (555) 742-8800",
    role: "veterinarian",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80",
    petCount: 1,
    bookingCount: 24,
    orderCount: 1,
    createdAt: "2026-07-02",
    lastActive: "Today at 08:45 AM",
  },
  {
    id: "usr-3",
    name: "Dr. Marcus Hayes, DVM",
    email: "m.hayes@bayvets.care",
    phone: "+1 (555) 345-6789",
    role: "veterinarian",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
    petCount: 0,
    bookingCount: 18,
    orderCount: 0,
    createdAt: "2026-07-19",
    lastActive: "Yesterday",
  },
  {
    id: "usr-4",
    name: "Chloe Dupont",
    email: "chloe.dupont@poshpaws.care",
    phone: "+1 (555) 912-3450",
    role: "service_provider",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    petCount: 1,
    bookingCount: 32,
    orderCount: 4,
    createdAt: "2026-08-01",
    lastActive: "Today at 10:05 AM",
  },
  {
    id: "usr-5",
    name: "Brett Sterling",
    email: "b.sterling@k9academy.care",
    phone: "+1 (555) 456-7890",
    role: "service_provider",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    petCount: 2,
    bookingCount: 14,
    orderCount: 2,
    createdAt: "2026-08-11",
    lastActive: "2 days ago",
  },
  {
    id: "usr-6",
    name: "David Chen",
    email: "david.chen@example.com",
    phone: "+1 (555) 678-9012",
    role: "pet_owner",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    petCount: 1,
    bookingCount: 2,
    orderCount: 2,
    createdAt: "2026-09-03",
    lastActive: "3 days ago",
  },
  {
    id: "usr-7",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    phone: "+1 (555) 789-0123",
    role: "pet_owner",
    status: "blocked",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    petCount: 1,
    bookingCount: 0,
    orderCount: 0,
    createdAt: "2026-09-12",
    lastActive: "1 week ago",
  },
  {
    id: "usr-8",
    name: "Elena Rostova",
    email: "admin.elena@pawconnect.care",
    phone: "+1 (555) 000-1122",
    role: "admin",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    petCount: 1,
    bookingCount: 0,
    orderCount: 0,
    createdAt: "2026-06-01",
    lastActive: "Just now",
  },
];

// ─── CATEGORY MANAGEMENT ─────────────────────────────────────────────────────

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  active: boolean;
  createdAt: string;
}

export const INITIAL_ADMIN_CATEGORIES: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Food & Nutrition",
    slug: "food-and-nutrition",
    description: "Veterinarian-approved dry kibble, raw dehydrated meals, and wet nutrition formulas.",
    productCount: 4,
    active: true,
    createdAt: "2026-06-15",
  },
  {
    id: "cat-2",
    name: "Treats & Chews",
    slug: "treats-and-chews",
    description: "Freeze-dried meats, functional dental sticks, and low-calorie training rewards.",
    productCount: 3,
    active: true,
    createdAt: "2026-06-15",
  },
  {
    id: "cat-3",
    name: "Toys & Enrichment",
    slug: "toys-and-enrichment",
    description: "Brain puzzle feeders, durable natural rubber toys, and feline feather wands.",
    productCount: 3,
    active: true,
    createdAt: "2026-06-15",
  },
  {
    id: "cat-4",
    name: "Grooming & Coat Care",
    slug: "grooming-and-coat-care",
    description: "Hypoallergenic oatmeal shampoos, de-shedding rakes, and paw balms.",
    productCount: 3,
    active: true,
    createdAt: "2026-06-15",
  },
  {
    id: "cat-5",
    name: "Beds & Furniture",
    slug: "beds-and-furniture",
    description: "Memory foam orthopedic beds, waterproof pet throws, and scratching loungers.",
    productCount: 2,
    active: true,
    createdAt: "2026-07-01",
  },
  {
    id: "cat-6",
    name: "Health & Wellness",
    slug: "health-and-wellness",
    description: "Digestive probiotics, joint care supplements, and calming botanicals.",
    productCount: 2,
    active: true,
    createdAt: "2026-07-10",
  },
];

// ─── GLOBAL ADMIN BOOKINGS ───────────────────────────────────────────────────

export interface AdminGlobalBooking {
  id: string;
  bookingNumber: string;
  type: "veterinary" | "grooming" | "training";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  providerName: string;
  providerClinic: string;
  serviceTitle: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  status: ProfessionalAppointmentStatus;
  paymentStatus: "paid" | "pending" | "refunded";
  notes?: string;
  createdAt: string;
}

export const INITIAL_ADMIN_BOOKINGS: AdminGlobalBooking[] = [
  {
    id: "abk-1",
    bookingNumber: "PC-VET-9281",
    type: "veterinary",
    customerName: "Alex Morgan",
    customerEmail: "alex.morgan@pawconnect.care",
    customerPhone: "+1 (555) 234-5678",
    petName: "Milo",
    petSpecies: "Canine",
    petBreed: "Golden Retriever",
    providerName: "Dr. Sarah Vance, DVM",
    providerClinic: "PawConnect Central Animal Hospital",
    serviceTitle: "Comprehensive Clinical Examination",
    date: "2026-10-15",
    time: "10:30 AM",
    durationMinutes: 45,
    price: 85,
    status: "confirmed",
    paymentStatus: "paid",
    notes: "Follow-up check on right ear allergen sensitivity.",
    createdAt: "2026-10-06T09:12:00Z",
  },
  {
    id: "abk-2",
    bookingNumber: "PC-GRM-4019",
    type: "grooming",
    customerName: "Alex Morgan",
    customerEmail: "alex.morgan@pawconnect.care",
    customerPhone: "+1 (555) 234-5678",
    petName: "Bella",
    petSpecies: "Feline",
    petBreed: "Ragdoll",
    providerName: "Chloe Dupont",
    providerClinic: "Posh Paws Luxury Spa",
    serviceTitle: "Full Coat Bath, De-shed & Spa Trimming",
    date: "2026-10-18",
    time: "02:00 PM",
    durationMinutes: 60,
    price: 65,
    status: "upcoming",
    paymentStatus: "paid",
    notes: "Sensitive to loud dryers, please towel dry gently.",
    createdAt: "2026-10-06T14:30:00Z",
  },
  {
    id: "abk-3",
    bookingNumber: "PC-TRN-7731",
    type: "training",
    customerName: "David Chen",
    customerEmail: "david.chen@example.com",
    customerPhone: "+1 (555) 678-9012",
    petName: "Rocky",
    petSpecies: "Canine",
    petBreed: "German Shepherd",
    providerName: "Brett Sterling",
    providerClinic: "Bay Area Canine Coaching Academy",
    serviceTitle: "Advanced Leash Manners & Impulse Control",
    date: "2026-10-21",
    time: "11:00 AM",
    durationMinutes: 60,
    price: 90,
    status: "upcoming",
    paymentStatus: "paid",
    notes: "Pulls hard when approaching squirrels.",
    createdAt: "2026-10-07T11:00:00Z",
  },
  {
    id: "abk-4",
    bookingNumber: "PC-VET-8802",
    type: "veterinary",
    customerName: "Jessica Wong",
    customerEmail: "jessica.w@example.com",
    customerPhone: "+1 (555) 888-9900",
    petName: "Oliver",
    petSpecies: "Feline",
    petBreed: "Domestic Shorthair",
    providerName: "Dr. Marcus Hayes, DVM",
    providerClinic: "Bay Area Veterinary Care",
    serviceTitle: "Annual Feline Core Vaccination & Vitals",
    date: "2026-10-08",
    time: "09:00 AM",
    durationMinutes: 30,
    price: 65,
    status: "in-progress",
    paymentStatus: "paid",
    notes: "Requires rabies booster and weight assessment.",
    createdAt: "2026-10-01T15:20:00Z",
  },
  {
    id: "abk-5",
    bookingNumber: "PC-GRM-3321",
    type: "grooming",
    customerName: "Robert Taylor",
    customerEmail: "rtaylor@example.com",
    customerPhone: "+1 (555) 333-4411",
    petName: "Daisy",
    petSpecies: "Canine",
    petBreed: "Poodle",
    providerName: "Chloe Dupont",
    providerClinic: "Posh Paws Luxury Spa",
    serviceTitle: "Standard Breed Cut & Hydrobath",
    date: "2026-10-04",
    time: "01:30 PM",
    durationMinutes: 75,
    price: 85,
    status: "completed",
    paymentStatus: "paid",
    notes: "Finished successfully without incident.",
    createdAt: "2026-09-28T10:00:00Z",
  },
];

// ─── ABUSE & CONTENT REPORTS ─────────────────────────────────────────────────

export interface AdminReport {
  id: string;
  reportNumber: string;
  targetType: "review" | "product" | "user" | "service";
  targetId: string;
  targetTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: "open" | "in-review" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export const INITIAL_ADMIN_REPORTS: AdminReport[] = [
  {
    id: "rep-1",
    reportNumber: "REP-9102",
    targetType: "review",
    targetId: "rev-2",
    targetTitle: "Review on PawConnect Wild Alaskan Salmon",
    reporterName: "Dr. Marcus Hayes",
    reporterEmail: "m.hayes@bayvets.care",
    reason: "Contains suspicious external commercial URL link in comment.",
    status: "open",
    createdAt: "2026-10-07T08:15:00Z",
  },
  {
    id: "rep-2",
    reportNumber: "REP-9088",
    targetType: "user",
    targetId: "usr-7",
    targetTitle: "Sophia Martinez (usr-7)",
    reporterName: "Chloe Dupont",
    reporterEmail: "chloe.dupont@poshpaws.care",
    reason: "Repeated last-minute booking cancellations violating pet wellness guidelines.",
    status: "resolved",
    createdAt: "2026-10-03T14:20:00Z",
    resolvedAt: "2026-10-04T09:00:00Z",
    resolutionNote: "Account flagged and blocked after review by customer care standards.",
  },
  {
    id: "rep-3",
    reportNumber: "REP-9041",
    targetType: "product",
    targetId: "prod-4",
    targetTitle: "Organic Oatmeal Pet Shampoo (prod-4)",
    reporterName: "David Chen",
    reporterEmail: "david.chen@example.com",
    reason: "Customer noted mismatched allergen information on front packaging batch label.",
    status: "in-review",
    createdAt: "2026-10-05T16:45:00Z",
  },
];

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: PlatformRole;
  module:
    | "users"
    | "veterinarians"
    | "service-providers"
    | "bookings"
    | "products"
    | "categories"
    | "orders"
    | "reviews"
    | "settings"
    | "reports";
  action:
    | "create"
    | "update"
    | "delete"
    | "verify"
    | "reject"
    | "block"
    | "unblock"
    | "status_change"
    | "stock_change";
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string;
}

export const INITIAL_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: "aud-1",
    timestamp: "2026-10-08T09:15:00Z",
    actorName: "Elena Rostova",
    actorEmail: "admin.elena@pawconnect.care",
    actorRole: "admin",
    module: "orders",
    action: "status_change",
    entityType: "Order",
    entityId: "ord-1",
    description: "Updated order #PC-90281 status from 'confirmed' to 'shipped'",
    ipAddress: "192.168.1.104",
  },
  {
    id: "aud-2",
    timestamp: "2026-10-08T08:40:00Z",
    actorName: "Elena Rostova",
    actorEmail: "admin.elena@pawconnect.care",
    actorRole: "admin",
    module: "veterinarians",
    action: "verify",
    entityType: "Veterinarian",
    entityId: "vet-1",
    description: "Approved clinical licensing credentials for Dr. Sarah Vance, DVM",
    ipAddress: "192.168.1.104",
  },
  {
    id: "aud-3",
    timestamp: "2026-10-07T18:22:00Z",
    actorName: "Elena Rostova",
    actorEmail: "admin.elena@pawconnect.care",
    actorRole: "admin",
    module: "products",
    action: "stock_change",
    entityType: "Product",
    entityId: "prod-1",
    description: "Restocked PawConnect Wild Alaskan Salmon Dry Food (+50 units)",
    ipAddress: "192.168.1.104",
  },
  {
    id: "aud-4",
    timestamp: "2026-10-07T14:10:00Z",
    actorName: "Elena Rostova",
    actorEmail: "admin.elena@pawconnect.care",
    actorRole: "admin",
    module: "users",
    action: "block",
    entityType: "User",
    entityId: "usr-7",
    description: "Suspended customer account for Sophia Martinez following repeated abuse reports",
    ipAddress: "192.168.1.104",
  },
  {
    id: "aud-5",
    timestamp: "2026-10-06T11:05:00Z",
    actorName: "Elena Rostova",
    actorEmail: "admin.elena@pawconnect.care",
    actorRole: "admin",
    module: "settings",
    action: "update",
    entityType: "PlatformSettings",
    entityId: "global-settings",
    description: "Updated free delivery threshold to ₹49.00 and standard rate to ₹5.99",
    ipAddress: "192.168.1.104",
  },
];

// ─── ADMIN NOTIFICATIONS ─────────────────────────────────────────────────────

export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  audience: "all" | "pet_owners" | "veterinarians" | "service_providers";
  targetAudience?: string;
  type: "system" | "maintenance" | "announcement" | "alert";
  status: "sent" | "draft" | "scheduled";
  recipientCount?: number;
  createdAt: string;
  sentAt?: string;
}

export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: "notif-adm-1",
    title: "Seasonal Flea & Tick Health Advisory",
    message: "Advised all registered dog and cat owners to schedule preventative clinical screenings for spring weather changes.",
    audience: "pet_owners",
    type: "announcement",
    status: "sent",
    createdAt: "2026-10-05T10:00:00Z",
    sentAt: "2026-10-05T10:30:00Z",
  },
  {
    id: "notif-adm-2",
    title: "Platform Maintenance & Database Upgrade Window",
    message: "Scheduled infrastructure maintenance will take place Sunday 02:00 AM - 04:00 AM UTC. Booking APIs will be cached during this period.",
    audience: "all",
    type: "maintenance",
    status: "sent",
    createdAt: "2026-10-06T08:00:00Z",
    sentAt: "2026-10-06T08:15:00Z",
  },
  {
    id: "notif-adm-3",
    title: "New Digital Vaccination Health Passport Feature",
    message: "Clinicians can now attach digital vaccination certificates directly to completed patient records.",
    audience: "veterinarians",
    type: "system",
    status: "draft",
    createdAt: "2026-10-07T14:20:00Z",
  },
];

// ─── ADMIN SETTINGS ──────────────────────────────────────────────────────────

export interface AdminPlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  operatingCurrency: string;
  operatingCity: string;
  cancellationNoticeHours: number;
  appointmentBufferMinutes: number;
  autoConfirmBookings: boolean;
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxRatePercent: number;
  maxUploadSizeMb: number;
}

export const INITIAL_ADMIN_SETTINGS: AdminPlatformSettings = {
  platformName: "PawConnect Pet Health & Care Platform",
  supportEmail: "support@pawconnect.care",
  supportPhone: "+1 (800) 729-2666",
  operatingCurrency: "INR (₹)",
  operatingCity: "San Francisco, CA",
  cancellationNoticeHours: 24,
  appointmentBufferMinutes: 15,
  autoConfirmBookings: false,
  freeShippingThreshold: 49,
  standardShippingFee: 5.99,
  taxRatePercent: 8.5,
  maxUploadSizeMb: 10,
};
