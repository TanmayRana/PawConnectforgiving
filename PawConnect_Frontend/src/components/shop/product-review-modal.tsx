"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyServerErrors } from "@/lib/utils/form-errors";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select at least 1 star").max(5),
  comment: z
    .string()
    .trim()
    .min(5, "Please provide at least 5 characters describing your experience")
    .max(500, "Review is too long (max 500 characters)"),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

interface ProductReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onSubmit: (data: ReviewFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ProductReviewModal({
  open,
  onOpenChange,
  productName,
  onSubmit,
  isSubmitting = false,
}: ProductReviewModalProps) {
  const [selectedRating, setSelectedRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [rootError, setRootError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      setRootError(null);
      setSelectedRating(5);
      reset({
        rating: 5,
        comment: "",
      });
    }
  }, [open, reset]);

  const handleStarClick = (rate: number) => {
    setSelectedRating(rate);
    setValue("rating", rate, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: ReviewFormData) => {
    setRootError(null);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to submit review. Please try again.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Customer Purchase</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Rate & Review
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share feedback for &quot;{productName}&quot; to help fellow pet parents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {rootError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Review Submission Failed</p>
                  <p>{rootError}</p>
                </div>
              </div>
            )}
          {/* Star selector */}
          <div className="space-y-2 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Overall Rating *
            </span>
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating !== null ? hoverRating : selectedRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-115 focus-visible:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {errors.rating && (
              <p className="text-xs text-destructive">{errors.rating.message}</p>
            )}
          </div>

          {/* Comment text */}
          <div>
            <Textarea
              label="Your Review *"
              placeholder="What did your pet love about this product? How was the quality and durability?"
              rows={4}
              error={errors.comment?.message}
              {...register("comment")}
            />
          </div>

          </DialogBody>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-6"
            >
              {isSubmitting ? "Submitting..." : "Post Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
