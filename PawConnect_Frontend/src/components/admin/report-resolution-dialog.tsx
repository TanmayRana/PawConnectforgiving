"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminReport } from "@/lib/mock/admin";
import { ShieldAlert, AlertCircle } from "lucide-react";

interface ReportResolutionDialogProps {
  report: AdminReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (id: string, status: AdminReport["status"], resolutionNote?: string) => Promise<void> | void;
  loading?: boolean;
}

export function ReportResolutionDialog({
  report,
  open,
  onOpenChange,
  onResolve,
  loading = false,
}: ReportResolutionDialogProps) {
  const [overrideStatus, setOverrideStatus] = useState<AdminReport["status"] | null>(null);
  const [overrideNote, setOverrideNote] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  if (!report) return null;

  const currentStatus = overrideStatus ?? (report.status === "open" ? "in-review" : report.status);
  const currentNote = overrideNote ?? (report.resolutionNote || "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOverrideStatus(null);
      setOverrideNote(null);
      setNoteError(null);
      setRootError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    setNoteError(null);
    setRootError(null);

    const trimmedNote = currentNote.trim();
    if (trimmedNote.length < 3) {
      setNoteError("A resolution note of at least 3 characters is required to record an administrative decision.");
      return;
    }

    try {
      await onResolve(report.id, currentStatus, trimmedNote);
      setOverrideStatus(null);
      setOverrideNote(null);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record resolution decision. Please try again.";
      setRootError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Moderate Issue Report #{report.reportNumber}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Review reported violation and take resolution or dismissal action.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {rootError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Resolution Update Error</p>
                <p>{rootError}</p>
              </div>
            </div>
          )}
          {/* Target Summary */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-secondary/30 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Target Entity ({report.targetType})
              </span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {report.targetType}
              </Badge>
            </div>
            <p className="font-bold text-foreground text-xs">{report.targetTitle}</p>
            <p className="text-muted-foreground text-[11px]">
              Reported by: <span className="font-semibold text-foreground">{report.reporterName}</span> ({report.reporterEmail})
            </p>
          </div>

          {/* Stated Reason */}
          <div className="space-y-1">
            <span className="font-semibold text-foreground">Reported Infraction Details</span>
            <p className="p-3 rounded-xl border border-border/60 bg-surface/50 text-foreground/80 leading-relaxed text-[11px]">
              &ldquo;{report.reason}&rdquo;
            </p>
          </div>

          {/* Action Decision */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Action Status *</label>
            <Select
              value={currentStatus}
              onValueChange={(val: AdminReport["status"]) => {
                setOverrideStatus(val);
                setNoteError(null);
              }}
            >
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-review">Under Active Review</SelectItem>
                <SelectItem value="resolved">Resolved & Action Taken</SelectItem>
                <SelectItem value="rejected">Rejected / False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Note */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Internal Resolution Note {currentStatus !== "in-review" ? "*" : "(Optional)"}
            </label>
            <Textarea
              value={currentNote}
              onChange={(e) => {
                setOverrideNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              placeholder="e.g. Content reviewed and adjusted. User notified of policy compliance."
              rows={3}
              error={noteError || undefined}
              className="rounded-xl text-xs resize-none"
            />
          </div>
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="rounded-xl text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl text-xs font-semibold h-9 px-5"
          >
            {loading ? "Submitting..." : "Submit Resolution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
