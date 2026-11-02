import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PAWCONNECT_FAQS } from "@/lib/constants/faqs";
import { FadeInView } from "@/lib/animations/motion-components";
import { HelpCircle, MessageCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - PawConnect",
  description:
    "Find answers to common questions about veterinary appointments, grooming standards, positive dog training, in-house products, and account management.",
};

export default function FAQPage() {
  const categories = [
    "General",
    "Veterinary",
    "Grooming",
    "Training",
    "Pet Shop",
    "Bookings",
    "Accounts",
  ] as const;

  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cream" className="text-xs">
            Help & Guidance
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="font-decorative text-2xl font-bold text-primary sm:text-3xl">
            Everything you need to know about PawConnect
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Have questions about our vetted clinics, in-house product fulfillment,
            or how to reschedule a visit? Find answers by category below.
          </p>
        </div>

        {/* Categorized FAQ Sections */}
        <div className="space-y-10">
          {categories.map((category, catIdx) => {
            const categoryFaqs = PAWCONNECT_FAQS.filter((f) => f.category === category);
            if (categoryFaqs.length === 0) return null;

            return (
              <FadeInView
                key={category}
                delay={catIdx * 0.04}
                className="rounded-[32px] border border-border/70 bg-white p-6 shadow-sm sm:p-8 dark:bg-card"
              >
                <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary text-xs font-bold">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {category} Questions
                  </h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`${category}-${idx}`}>
                      <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FadeInView>
            );
          })}
        </div>

        {/* Still Have Questions CTA */}
        <div className="rounded-[36px] bg-surface p-8 text-center sm:p-12 dark:bg-muted/30 border border-border">
          <div className="max-w-md mx-auto space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Still have questions?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our friendly pet care concierge team is here to assist you 7 days a week.
            </p>
            <div className="pt-2">
              <Button asChild className="rounded-full shadow-sm">
                <Link href="/contact" className="flex items-center gap-1.5">
                  <span>Contact Our Support Team</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
