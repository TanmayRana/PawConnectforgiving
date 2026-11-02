export interface CustomerAddress {
  id: string;
  label: "Home" | "Work" | "Other";
  recipientName: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  deliveryInstructions?: string;
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  emailNotificationsEnabled?: boolean;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export const INITIAL_MOCK_CUSTOMER_PROFILE: CustomerProfile = {
  id: "cust-1",
  firstName: "Sarah",
  lastName: "Jenkins",
  email: "sarah.jenkins@example.com",
  phone: "+1 (555) 234-5678",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  memberSince: "March 2024",
  emailNotificationsEnabled: true,
  emergencyContact: {
    name: "Michael Jenkins",
    phone: "+1 (555) 876-5432",
    relationship: "Partner",
  },
};

export const INITIAL_MOCK_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr-1",
    label: "Home",
    recipientName: "Sarah Jenkins",
    street: "742 Evergreen Terrace",
    unit: "Apt 4B",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    phone: "+1 (555) 234-5678",
    isDefault: true,
    deliveryInstructions: "Ring bell #4B or leave in secure lobby parcel locker.",
  },
  {
    id: "addr-2",
    label: "Work",
    recipientName: "Sarah Jenkins",
    street: "500 Howard Street",
    unit: "Suite 1200",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    phone: "+1 (555) 234-5678",
    isDefault: false,
    deliveryInstructions: "Front desk reception on 12th floor during business hours (9am-5pm).",
  },
];
