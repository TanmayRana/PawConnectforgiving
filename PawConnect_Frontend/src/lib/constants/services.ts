export interface ServiceCatalogItem {
  id: string;
  category: "veterinary" | "grooming" | "training";
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  features: string[];
  iconName: string;
  image: string;
  badge?: string;
}

export const VETERINARY_CATALOG_SERVICES: ServiceCatalogItem[] = [
  {
    id: "vet-cat-1",
    category: "veterinary",
    title: "General Physical Examination",
    description: "Comprehensive nose-to-tail clinical wellness exam, temperature, heart and lung auscultation.",
    durationMinutes: 30,
    price: 45,
    features: ["Vital Signs Assessment", "Weight & Coat Inspection", "Preventative Counsel"],
    iconName: "Stethoscope",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    badge: "Routine Care",
  },
  {
    id: "vet-cat-2",
    category: "veterinary",
    title: "Vaccination & Booster Consultation",
    description: "Rabies, DHPP, Bordetella, and FVRCP core vaccines administered by licensed veterinary doctors.",
    durationMinutes: 20,
    price: 35,
    features: ["Core & Non-Core Vaccines", "Vaccine Certificate", "Adverse Reaction Monitoring"],
    iconName: "ShieldCheck",
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "vet-cat-3",
    category: "veterinary",
    title: "Dental & Oral Assessment",
    description: "Plaque scoring, gum disease staging, and recommendations for ultrasonic cleaning.",
    durationMinutes: 30,
    price: 55,
    features: ["Plaque & Tartar Grade", "Gingival Assessment", "Oral Care Plan"],
    iconName: "Sparkles",
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
  },
];

export const GROOMING_CATALOG_SERVICES: ServiceCatalogItem[] = [
  {
    id: "groom-cat-1",
    category: "grooming",
    title: "Full Coat Groom & Breed Styling",
    description: "Hydrating bath, blow dry, ear cleaning, sanitary trim, and breed-standard haircut.",
    durationMinutes: 60,
    price: 65,
    features: ["Soothing Bath", "Breed Haircut", "Ear Cleaning & Paw Trim"],
    iconName: "Scissors",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80",
    badge: "Popular",
  },
  {
    id: "groom-cat-2",
    category: "grooming",
    title: "De-Shedding & Undercoat Reset",
    description: "High-velocity blowout with FURminator specialized deshedding shampoo and treatment.",
    durationMinutes: 75,
    price: 80,
    features: ["Blowout Treatment", "Deep Brush-Out", "Nail Dremel Buffing"],
    iconName: "Sparkles",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "groom-cat-3",
    category: "grooming",
    title: "Express Bath & Paw Care",
    description: "Gentle hypoallergenic cleansing, blueberry facial, and organic paw pad balm.",
    durationMinutes: 45,
    price: 40,
    features: ["Hypoallergenic Wash", "Paw Pad Balm", "Teeth Brushing Spritz"],
    iconName: "Droplets",
    image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
  },
];

export const TRAINING_CATALOG_SERVICES: ServiceCatalogItem[] = [
  {
    id: "train-cat-1",
    category: "training",
    title: "Puppy Socialization Foundations",
    description: "Crucial early training (8-16 weeks) for house training, bite inhibition, and calm leash manners.",
    durationMinutes: 60,
    price: 70,
    features: ["House Training Protocol", "Bite Inhibition", "Leash Manners"],
    iconName: "Award",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80",
    badge: "Foundation",
  },
  {
    id: "train-cat-2",
    category: "training",
    title: "Loose-Leash Walking & Recall",
    description: "Master calm heel manners and reliable rocket recall under real-world distractions.",
    durationMinutes: 60,
    price: 85,
    features: ["Rocket Recall Drill", "Calm Heel Walking", "Distraction Proofing"],
    iconName: "Award",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "train-cat-3",
    category: "training",
    title: "Reactivity & Behavior Consultation",
    description: "Positive counter-conditioning for leash reactivity, separation anxiety, or fear.",
    durationMinutes: 90,
    price: 110,
    features: ["Trigger Assessment", "Counter-Conditioning", "Written Training Plan"],
    iconName: "Award",
    image: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80",
  },
];
