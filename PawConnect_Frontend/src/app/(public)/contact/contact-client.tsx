"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { FadeInView } from "@/lib/animations/motion-components";
import { showSuccess, showError } from "@/lib/utils/toast";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: "Please enter a valid phone number (10-15 digits)",
    }),
  petName: z.string().trim().max(50).optional(),
  topic: z.string().trim().min(1, "Please select an inquiry topic"),
  message: z.string().trim().min(10, "Message must be at least 10 characters long").max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactClient() {
  const [submissionState, setSubmissionState] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      topic: "General Inquiry",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmissionState("loading");

    // Mocked submission handler with a realistic delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      setSubmissionState("success");
      showSuccess(
        "Message Sent Successfully",
        `Thank you ${data.name}, our team will get back to you at ${data.email} within 24 hours.`
      );
      reset();
    } catch {
      setSubmissionState("error");
      showError("Failed to Send Message", "Please check your connection and try again.");
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      {/* ─── Contact Information Cards ──────────────────────────────────────── */}
      <FadeInView aboveTheFold direction="left" distance={20} className="space-y-6 lg:col-span-5">
        <div className="rounded-[32px] border border-border/70 bg-white p-7 shadow-sm dark:bg-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Get in touch</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Whether you need help booking a specialty veterinarian or have a question
              about our in-house pet food, our dedicated care team is here.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Email Support</p>
                <a
                  href="mailto:support@pawconnect.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  support@pawconnect.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone & Hotline</p>
                <p className="text-muted-foreground">+1 (800) 555-PAWS (7297)</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Headquarters & Fulfillment</p>
                <p className="text-muted-foreground">
                  742 Evergreen Terrace, Suite 400<br />San Francisco, CA 94107
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Operating Hours</p>
                <p className="text-muted-foreground">Monday – Saturday: 8:00 AM – 8:00 PM PST</p>
                <p className="text-emerald-600 font-medium dark:text-emerald-400">24/7 Urgent Care Helpline Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rapid Medical Triage Box */}
        <div className="rounded-[32px] border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Need Urgent Medical Triage?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If your pet has ingested a toxic substance or suffered an acute injury,
                do not wait for an email response. Please call our direct emergency dispatch line immediately.
              </p>
            </div>
          </div>
        </div>
      </FadeInView>

      {/* ─── Contact Form ───────────────────────────────────────────────────── */}
      <FadeInView aboveTheFold direction="right" distance={20} delay={0.1} className="lg:col-span-7">
        <div className="rounded-[36px] border border-border/70 bg-white p-7 shadow-sm sm:p-10 dark:bg-card">
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Send us a message</h2>
            <p className="text-xs text-muted-foreground">
              Fill in the details below and we&apos;ll be in touch promptly.
            </p>
          </div>

          <AnimatePresence>
            {submissionState === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Thank you! Your message was delivered.</p>
                  <p>One of our pet care coordinators will review your request and reply shortly.</p>
                  <button
                    onClick={() => setSubmissionState("idle")}
                    className="mt-2 text-xs font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-100"
                  >
                    Send another message
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Full Name *"
                placeholder="Sarah Jenkins"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="sarah@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Phone (optional)"
                placeholder="+1 (555) 019-2834"
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                label="Pet Name & Breed (optional)"
                placeholder="Milo (Golden Retriever)"
                error={errors.petName?.message}
                {...register("petName")}
              />
            </div>

            <SelectField
              label="Topic *"
              defaultValue="General Inquiry"
              onValueChange={(val) => setValue("topic", val)}
              options={[
                { value: "General Inquiry", label: "General Inquiry" },
                { value: "Veterinary Appointment", label: "Veterinary Appointment" },
                { value: "Grooming Salon Question", label: "Grooming Salon Question" },
                { value: "Dog Training Consultation", label: "Dog Training Consultation" },
                { value: "Pet Shop Order Status", label: "Pet Shop Order Status" },
                { value: "Specialist Partnership", label: "Specialist / Clinic Partnership" },
              ]}
              error={errors.topic?.message}
            />

            <Textarea
              label="How can we help? *"
              placeholder="Describe your question, request, or pet's situation..."
              rows={5}
              error={errors.message?.message}
              {...register("message")}
            />

            <Button
              type="submit"
              size="lg"
              disabled={submissionState === "loading"}
              className="w-full rounded-full shadow-md active:scale-[0.99] transition-transform"
            >
              {submissionState === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending message...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </span>
              )}
            </Button>
          </form>
        </div>
      </FadeInView>
    </div>
  );
}

