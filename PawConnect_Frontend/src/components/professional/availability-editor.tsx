"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormModal } from "@/components/shared/form-shells";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CheckCircle2, XCircle, Edit2, AlertCircle } from "lucide-react";
import { applyServerErrors } from "@/lib/utils/form-errors";
import type { ProfessionalAvailability, DaySchedule } from "@/lib/mock/professionals";
import { cn } from "@/lib/utils";

const dayScheduleSchema = z
  .object({
    day: z.string(),
    active: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter valid time (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter valid time (HH:MM)"),
    slotDurationMinutes: z.number().min(15).max(120),
  })
  .refine(
    (data) => {
      if (!data.active) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

type DayScheduleFormData = z.infer<typeof dayScheduleSchema>;

interface AvailabilityEditorProps {
  availability: ProfessionalAvailability;
  onUpdateSchedule: (schedule: DaySchedule[], notes?: string) => Promise<void> | void;
  isUpdating?: boolean;
}

export function AvailabilityEditor({
  availability,
  onUpdateSchedule,
  isUpdating = false,
}: AvailabilityEditorProps) {
  const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<DayScheduleFormData>({
    resolver: zodResolver(dayScheduleSchema),
  });

  const isActive = useWatch({ control, name: "active" });
  const selectedDuration = useWatch({ control, name: "slotDurationMinutes" });

  const handleOpenEdit = (daySchedule: DaySchedule) => {
    setRootError(null);
    setEditingDay(daySchedule);
    reset({
      day: daySchedule.day,
      active: daySchedule.active,
      startTime: daySchedule.startTime,
      endTime: daySchedule.endTime,
      slotDurationMinutes: daySchedule.slotDurationMinutes,
    });
  };

  const onSubmit = async (data: DayScheduleFormData) => {
    setRootError(null);
    try {
      const updatedWeekly = availability.weeklySchedule.map((d) =>
        d.day === data.day
          ? {
              ...d,
              active: data.active,
              startTime: data.startTime,
              endTime: data.endTime,
              slotDurationMinutes: data.slotDurationMinutes,
            }
          : d
      );

      await onUpdateSchedule(updatedWeekly);
      setEditingDay(null);
    } catch (err: unknown) {
      const msg = applyServerErrors(err, setError, "Unable to save schedule changes. Please check time ranges.");
      if (msg) {
        setRootError(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {availability.weeklySchedule.map((day) => (
          <div
            key={day.day}
            className={cn(
              "rounded-2xl border p-5 transition-[border-color,box-shadow,opacity] duration-200 motion-reduce:transition-none flex flex-col justify-between space-y-4 shadow-2xs",
              day.active
                ? "bg-card border-border/80 hover:border-primary/40 hover:shadow-xs"
                : "bg-surface/50 border-border/50 opacity-75"
            )}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="font-bold text-foreground text-sm">{day.day}</span>
                {day.active ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] px-2 py-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px] px-2 py-0 text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" />
                    Off Duty
                  </Badge>
                )}
              </div>

              <div className="pt-3 space-y-2 text-xs">
                {day.active ? (
                  <>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Working Hours:</span>
                      <span className="font-semibold text-foreground">
                        {day.startTime} — {day.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Slot Duration:</span>
                      <span className="font-semibold text-foreground">
                        {day.slotDurationMinutes} mins
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-xs py-2">
                    No bookable slots configured for this day.
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(day)}
              className="w-full rounded-xl text-xs font-semibold h-8.5 gap-1.5"
            >
              <Edit2 className="h-3 w-3" />
              Configure {day.day}
            </Button>
          </div>
        ))}
      </div>

      {/* Availability Operational Note */}
      {availability.notes && (
        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span>{availability.notes}</span>
        </div>
      )}

      {/* Edit Day Schedule Modal */}
      <FormModal
        open={Boolean(editingDay)}
        onOpenChange={(open) => !open && setEditingDay(null)}
        title={`Configure ${editingDay?.day} Schedule`}
        description="Set your operational working hours and client appointment slot lengths."
        onSubmit={handleSubmit(onSubmit)}
        loading={isUpdating}
        submitLabel="Save Schedule"
      >
        <div className="space-y-4 pt-1">
          {rootError && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 mb-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to Update Schedule</p>
                <p>{rootError}</p>
              </div>
            </div>
          )}

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface/50">
            <div>
              <p className="text-xs font-bold text-foreground">Accept Appointments</p>
              <p className="text-[11px] text-muted-foreground">
                Enable bookable time windows on {editingDay?.day}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue("active", !isActive)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5",
                isActive ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                  isActive ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {isActive && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Time *"
                  type="time"
                  error={errors.startTime?.message}
                  {...register("startTime")}
                  className="rounded-xl h-10 text-xs"
                />

                <Input
                  label="End Time *"
                  type="time"
                  error={errors.endTime?.message}
                  {...register("endTime")}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Appointment Slot Duration *
                </label>
                <Select
                  value={String(selectedDuration || 30)}
                  onValueChange={(val) => setValue("slotDurationMinutes", Number(val))}
                >
                  <SelectTrigger className="w-full rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes (Quick consult / triage)</SelectItem>
                    <SelectItem value="30">30 minutes (Standard examination)</SelectItem>
                    <SelectItem value="45">45 minutes (Comprehensive visit)</SelectItem>
                    <SelectItem value="60">60 minutes (Specialist procedure / Full spa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
