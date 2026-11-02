"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminReports,
  useUpdateAdminReportStatus,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ReportResolutionDialog } from "@/components/admin/report-resolution-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast";
import {
  ShieldAlert,
  Eye,
} from "lucide-react";
import type { AdminReport } from "@/lib/mock/admin";

type StatusTab = "all" | AdminReport["status"];

export function AdminReportsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [activeReport, setActiveReport] = useState<AdminReport | null>(null);

  const { data: reports = [], isLoading, isError, refetch } = useAdminReports();
  const { mutateAsync: updateReportStatus, isPending: isUpdating } = useUpdateAdminReportStatus();

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (statusTab !== "all") {
      result = result.filter((r) => r.status === statusTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.reportNumber.toLowerCase().includes(q) ||
          r.targetTitle.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [reports, statusTab, searchQuery]);

  const handleResolve = async (id: string, status: AdminReport["status"], resolutionNote?: string) => {
    try {
      await updateReportStatus({ id, status, resolutionNote });
      toast.success("Report Handled", {
        description: `Case updated to '${status}'.`,
      });
      setActiveReport(null);
    } catch (err) {
      toast.error("Operation Failed");
      throw err;
    }
  };

  const statusBadgeMap: Record<AdminReport["status"], { label: string; className: string }> = {
    open: { label: "Open & Pending", className: "bg-destructive/10 text-destructive border-destructive/20" },
    "in-review": { label: "Under Review", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    rejected: { label: "Dismissed", className: "bg-secondary text-muted-foreground border-border" },
  };

  const columns: Column<AdminReport>[] = [
    {
      key: "report",
      header: "Report # & Target",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-foreground text-xs">{r.reportNumber}</span>
            <Badge variant="outline" className="text-[9px] capitalize py-0 px-1">
              {r.targetType}
            </Badge>
          </div>
          <span className="text-xs font-semibold text-foreground block truncate max-w-[220px]">
            {r.targetTitle}
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Stated Reason / Details",
      render: (r) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
          {r.reason}
        </p>
      ),
    },
    {
      key: "reporter",
      header: "Submitted By",
      render: (r) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-foreground block">{r.reporterName}</span>
          <span className="text-[11px] text-muted-foreground block truncate">{r.reporterEmail}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Case Status",
      render: (r) => {
        const badge = statusBadgeMap[r.status];
        return (
          <Badge variant="outline" className={badge.className + " text-[10px] font-semibold"}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveReport(r)}
          className="rounded-xl text-xs h-8 gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          Handle
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState variant="table" count={6} message="Loading community reports and safety queue..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load reports"
          description="Failed to load safety reports."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Abuse & Policy Reports"
        description="Review reported catalog discrepancies, community feedback violations, and user service grievances."
      />

      {/* Filter Tabs by Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={statusTab}
          onValueChange={(val) => setStatusTab(val as StatusTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="rounded-xl text-xs px-3">
              Open ({reports.filter((r) => r.status === "open").length})
            </TabsTrigger>
            <TabsTrigger value="in-review" className="rounded-xl text-xs px-3">
              In Review
            </TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-xl text-xs px-3">
              Resolved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl text-xs px-3">
              Dismissed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search report #, target, reason..."
            className="w-full"
          />
        </div>
      </div>

      {/* Reports DataTable */}
      <DataTable
        columns={columns}
        data={filteredReports}
        keyExtractor={(r) => r.id}
        emptyTitle="No reports in queue"
        emptyDescription="Platform safety queue is currently clear."
        emptyIcon={<ShieldAlert className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Resolution Dialog */}
      <ReportResolutionDialog
        report={activeReport}
        open={Boolean(activeReport)}
        onOpenChange={(op) => !op && setActiveReport(null)}
        onResolve={handleResolve}
        loading={isUpdating}
      />
    </div>
  );
}
