import type { Metadata } from "next";
import { TrainingClient } from "./training-client";

export const metadata: Metadata = {
  title: "Canine Coaching & Training | PawConnect",
  description: "Find certified dog trainers, puppy manners classes, and behavior coaching on PawConnect.",
};

export default function CustomerTrainingPage() {
  return <TrainingClient />;
}
