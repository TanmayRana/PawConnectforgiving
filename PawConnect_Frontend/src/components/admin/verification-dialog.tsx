"use client";

import React, { useState } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Ban,
  Clock,
  Sparkles,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import type {
  VeterinarianProfile,
  ServiceProviderProfile,
  VerificationStatus,
} from "@/lib/mock/professionals";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: VeterinarianProfile | ServiceProviderProfile | null;
  role: "vet" | "provider";
  onUpdateStatus: (id: string, status: VerificationStatus, rejectionReason?: string) => Promise<void> | void;
  loading?: boolean;
}

export function VerificationDialog({
  open,
  onOpenChange,
  professional,
  role,
  onUpdateStatus,
  loading = false,
}: VerificationDialogProps) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  if (!professional) return null;

  const isVet = role === "vet";
  const vet = isVet ? (professional as VeterinarianProfile) : null;
  const provider = !isVet ? (professional as ServiceProviderProfile) : null;

  const handleAction = async (newStatus: VerificationStatus) => {
    setRootError(null);
    setRejectionError(null);

    if (newStatus === "rejected") {
      if (!rejecting) {
        setRejecting(true);
        return;
      }
      if (rejectionReason.trim().length < 5) {
        setRejectionError("Please provide a reason with at least 5 characters for rejecting verification.");
        return;
      }
    }

    try {
      await onUpdateStatus(
        professional.id,
        newStatus,
        newStatus === "rejected" ? rejectionReason.trim() : undefined
      );
      setRejecting(false);
      setRejectionReason("");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update professional verification status.";
      setRootError(msg);
    }
  };

  const handleClose = () => {
    setRejecting(false);
    setRejectionReason("");
    setRejectionError(null);
    setRootError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="wide">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <DialogTitle>
              {isVet ? "Veterinarian Credential Review" : "Service Provider Partner Audit"}
            </DialogTitle>
          </div>
          <DialogDescription>
            Verify clinical licenses, medical qualifications, and facility registrations before granting public booking availability.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">

        {rootError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Verification Update Error</p>
              <p>{rootError}</p>
            </div>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/70 bg-surface/50">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-secondary shrink-0 border border-primary/20 flex items-center justify-center">
            {professional.photo ? (
              <Image
                src={professional.photo}
                alt={professional.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-lg text-primary bg-primary/10">
                {professional.name.replace(/^Dr\.\s*/i, "").charAt(0) || "P"}
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground text-sm truncate">{professional.name}</h3>
              <StatusBadge status={professional.verificationStatus} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isVet ? vet?.qualification : provider?.businessName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              {isVet ? (
                <>
                  <Stethoscope className="h-3 w-3" />
                  <span>{vet?.specialization}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span className="capitalize">{provider?.providerType} Specialist</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Practice / Workplace
            </span>
            <p className="font-semibold text-foreground text-xs">
              {isVet ? vet?.clinic : provider?.businessName}
            </p>
            <p className="text-muted-foreground text-[11px] flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {professional.location}
            </p>
            {((isVet && vet?.clinicLatitude != null && vet?.clinicLongitude != null) ||
              (!isVet && provider?.latitude != null && provider?.longitude != null)) && (
              <div className="pt-0.5">
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-primary/5 text-primary border-primary/20">
                  GPS: {isVet ? `${vet?.clinicLatitude?.toFixed(4)}, ${vet?.clinicLongitude?.toFixed(4)}` : `${provider?.latitude?.toFixed(4)}, ${provider?.longitude?.toFixed(4)}`}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Verified Experience
            </span>
            <p className="font-semibold text-foreground text-xs">
              {professional.experienceYears} Years Clinical Practice
            </p>
            <p className="text-muted-foreground text-[11px]">Active Good Standing</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Direct Phone
            </span>
            <p className="font-semibold text-foreground text-xs">{professional.phone}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Email Address
            </span>
            <p className="font-semibold text-foreground text-xs truncate">{professional.email}</p>
          </div>
        </div>

        {/* Specializations Tags if Provider */}
        {!isVet && provider?.specializations && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Specialized Care Disciplines
            </span>
            <div className="flex flex-wrap gap-1.5">
              {provider.specializations.map((spec) => (
                <Badge key={spec} variant="outline" className="text-[10px] rounded-lg">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Biography & Philosophy */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Professional Statement
          </span>
          <p className="text-xs text-foreground/80 leading-relaxed p-3.5 rounded-xl bg-secondary/30 border border-border/60">
            {professional.bio}
          </p>
        </div>

        {/* Rejection Reason Form */}
        {rejecting && (
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2 animate-in fade-in duration-200">
            <label className="text-xs font-bold text-destructive block">
              Reason for Rejection *
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (rejectionError) setRejectionError(null);
              }}
              placeholder="Specify license discrepancy, missing certificate, or justification for rejection..."
              rows={3}
              className="text-xs"
            />
            {rejectionError && (
              <p className="text-[11px] text-destructive">{rejectionError}</p>
            )}
          </div>
        )}
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {rejecting ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejecting(false)}
                className="rounded-xl text-xs h-9"
              >
                Cancel Rejection
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleAction("rejected")}
                disabled={loading}
                className="rounded-xl text-xs h-9"
              >
                Confirm Rejection
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto mr-auto">
                {professional.verificationStatus !== "blocked" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction("blocked")}
                    disabled={loading}
                    className="rounded-xl text-xs h-9 gap-1"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Block Practitioner
                  </Button>
                )}
                {professional.verificationStatus !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction("rejected")}
                    disabled={loading}
                    className="rounded-xl text-xs h-9 gap-1 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction("verified")}
                  disabled={loading || professional.verificationStatus === "verified"}
                  className="rounded-xl text-xs font-semibold h-9 gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  {professional.verificationStatus === "verified" ? "Verified" : "Approve & Verify"}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
