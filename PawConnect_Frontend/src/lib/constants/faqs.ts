export interface FAQItem {
  category: "General" | "Veterinary" | "Grooming" | "Training" | "Pet Shop" | "Bookings" | "Accounts";
  question: string;
  answer: string;
}

export const PAWCONNECT_FAQS: FAQItem[] = [
  {
    category: "General",
    question: "What is PawConnect?",
    answer: "PawConnect is a unified, all-in-one pet care ecosystem. We bring together certified veterinary clinics, professional groomers, certified positive trainers, and premium in-house pet essentials under one seamless platform.",
  },
  {
    category: "General",
    question: "Are your specialists and clinics verified?",
    answer: "Yes. Every veterinarian, clinic, groomer, and behavioral trainer on PawConnect undergoes rigorous credential checks, licensing verification, facility inspections, and code-of-conduct agreements before being listed.",
  },
  {
    category: "Veterinary",
    question: "How do veterinary appointments work on PawConnect?",
    answer: "You can browse certified veterinarians by specialty, location, or next available slot. Selecting a specialist opens their real-time calendar derivations. Once booked, you receive instant confirmation and pre-visit reminders.",
  },
  {
    category: "Veterinary",
    question: "What should I do in a pet medical emergency?",
    answer: "For immediate life-threatening emergencies, visit our Veterinary page to find the nearest 24/7 emergency clinic or call our dedicated urgent helpline listed on our Contact page immediately.",
  },
  {
    category: "Grooming",
    question: "What safety protocols are followed during grooming sessions?",
    answer: "All PawConnect groomers are certified in Fear-Free animal handling and pet CPR. Salons use sanitized tools between clients, temperature-regulated drying rooms, and hypoallergenic grooming products.",
  },
  {
    category: "Training",
    question: "What training methodology do PawConnect trainers use?",
    answer: "PawConnect strictly adheres to humane, science-backed positive reinforcement techniques. We do not support prong collars, shock devices, or intimidation-based techniques.",
  },
  {
    category: "Pet Shop",
    question: "Who manufactures and ships products from the PawConnect Pet Shop?",
    answer: "All pet food, treats, toys, beds, and health accessories are curated and directly supplied by PawConnect's in-house inventory. We do not host third-party drop-shippers or unverified external vendors, guaranteeing authentic quality and freshness.",
  },
  {
    category: "Pet Shop",
    question: "What is your return and satisfaction policy on products?",
    answer: "We offer an unconditional 30-day happiness guarantee on unopened items and toys. If your pet dislikes their new food or harness, our support team will help exchange or refund promptly.",
  },
  {
    category: "Bookings",
    question: "Can I reschedule or cancel a booking?",
    answer: "Yes. Appointments can be rescheduled or cancelled up to 24 hours prior to the scheduled time without any cancellation fees directly from your appointment confirmation.",
  },
  {
    category: "Accounts",
    question: "Do I need an account to browse PawConnect?",
    answer: "No. You can freely explore services, specialist profiles, training programs, and the pet shop. When you are ready to book an appointment or place an order, our secure modal login/sign-up lets you authenticate instantly.",
  },
];
