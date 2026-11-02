"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useVetAppointments } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Calendar, Stethoscope, Clock, FileText } from "lucide-react";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import type { ProfessionalAppointment, ProfessionalAppointmentStatus } from "@/lib/mock/professionals";

const FALLBACK_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";

type StatusFilterTab = "all" | ProfessionalAppointmentStatus;

export function VetAppointmentsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilterTab>("all");
  const [invoiceAppointmentId, setInvoiceAppointmentId] = useState<string | null>(null);

  const { data: appointments = [], isLoading, isError, refetch } = useVetAppointments();

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // Status filter
    if (activeTab !== "all") {
      result = result.filter((a) => a.status === activeTab);
    }

    // Search query: appointment number, pet name, owner name, appointment type
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.pet.name.toLowerCase().includes(q) ||
          a.pet.breed.toLowerCase().includes(q) ||
          a.owner.name.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
      );
    }

    // Sort: upcoming & confirmed first, then by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [appointments, activeTab, searchQuery]);

  const columns: Column<ProfessionalAppointment>[] = [
    {
      key: "appointmentNumber",
      header: "Appointment",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-foreground block">
            {row.appointmentNumber}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {row.type}
          </span>
        </div>
      ),
    },
    {
      key: "pet",
      header: "Patient (Pet)",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
            <Image
              src={row.pet?.photo || FALLBACK_PET_IMAGE}
              alt={row.pet?.name || "Patient"}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              {row.pet.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.pet.species} • {row.pet.breed}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Client / Owner",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground block">{row.owner.name}</span>
          <span className="text-muted-foreground text-[11px]">{row.owner.phone}</span>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      cell: (row) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <Calendar className="h-3 w-3 text-primary" />
            <span>{row.date}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <Clock className="h-3 w-3" />
            <span>{row.time} ({row.durationMinutes}m)</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setInvoiceAppointmentId(row.id);
            }}
            className="rounded-xl text-xs h-8 px-2.5 gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="View & Print Clinical Tax Invoice"
          >
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-8 px-2.5 gap-1 font-medium"
          >
            <Link href={`/vet/appointments/${row.id}`}>
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Patient Appointments"
        description="Review clinical examination schedule, medical consults, and procedural follow-ups."
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as StatusFilterTab)}
            className="w-auto"
          >
            <TabsList className="h-10 p-1 rounded-2xl bg-secondary/80">
              <TabsTrigger value="all" className="rounded-xl text-xs px-3 font-semibold">
                All ({appointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-xl text-xs px-3 font-semibold">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-xl text-xs px-3 font-semibold">
                Confirmed
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-xl text-xs px-3 font-semibold">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl text-xs px-3 font-semibold">
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl text-xs px-3 font-semibold">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search patient, client, appt #..."
          />
        </div>
      </div>

      {/* Content / DataTable */}
      {isLoading ? (
        <LoadingState variant="cards" count={6} columns={3} />
      ) : isError ? (
        <ErrorState
          title="Could not load appointments"
          description="Encountered an issue retrieving clinical records. Please retry."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xs">
          <DataTable
            columns={columns}
            data={filteredAppointments}
            emptyTitle="No appointments found"
            emptyDescription={
              searchQuery
                ? `No records match "${searchQuery}". Try modifying your search criteria.`
                : activeTab === "all"
                ? "No appointments are on record."
                : `No appointments currently marked as "${activeTab}".`
            }
            emptyIcon={<Stethoscope className="h-8 w-8 text-muted-foreground" />}
          />
        </div>
      )}

      {/* Printable Clinical GST Tax Invoice Modal */}
      <InvoiceModal
        open={Boolean(invoiceAppointmentId)}
        onOpenChange={(open) => !open && setInvoiceAppointmentId(null)}
        invoiceType="APPOINTMENT"
        resourceId={invoiceAppointmentId}
      />
    </div>
  );
}
