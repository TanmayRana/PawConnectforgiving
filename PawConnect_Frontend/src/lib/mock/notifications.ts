export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  type: "booking" | "health" | "order" | "system";
  createdAt?: string;
}

export const INITIAL_MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Appointment Tomorrow",
    message: "Reminder: Milo's clinical exam with Dr. Sarah Vance is tomorrow at 10:30 AM.",
    time: "2 hours ago",
    read: false,
    link: "/app/bookings/appointments/bk-1",
    type: "booking",
  },
  {
    id: "notif-2",
    title: "Vaccine Booster Due Next Month",
    message: "Luna's DHPP Core booster is due in 30 days. Book in advance to secure preferred times.",
    time: "1 day ago",
    read: false,
    link: "/app/pets/pet-2",
    type: "health",
  },
  {
    id: "notif-3",
    title: "Grooming Session Confirmed",
    message: "Luna's luxury spa hydro-massage bath is confirmed for Oct 22 at Posh Paws.",
    time: "3 days ago",
    read: true,
    link: "/app/bookings/bk-2",
    type: "booking",
  },
  {
    id: "notif-4",
    title: "Training Progress Summary Available",
    message: "Coach Noah Bennett submitted evaluation notes for Milo's loose-leash milestone.",
    time: "1 week ago",
    read: true,
    link: "/app/bookings/bk-3",
    type: "health",
  },
];
