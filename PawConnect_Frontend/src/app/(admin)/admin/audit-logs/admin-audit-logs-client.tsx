"use client";

import React, { useState, useMemo } from "react";
import { useAuditLogs } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Lock,
} from "lucide-react";
import type { AdminAuditLog } from "@/lib/mock/admin";

export function AdminAuditLogsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const { data: logs = [], isLoading, isError, refetch } = useAuditLogs();

  const modules = useMemo(() => {
    const set = new Set(logs.map((l) => l.module));
    return ["all", ...Array.from(set)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (moduleFilter !== "all") {
      result = result.filter((l) => l.module === moduleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.entityType.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, moduleFilter, searchQuery]);

  const actionColorMap: Record<string, string> = {
    create: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    update: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    delete: "bg-destructive/10 text-destructive border-destructive/20",
    verify: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    reject: "bg-destructive/10 text-destructive border-destructive/20",
    block: "bg-destructive/10 text-destructive border-destructive/20",
    unblock: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    status_change: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    stock_change: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  };

  const columns: Column<AdminAuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (l) => (
        <div className="space-y-0.5 text-xs font-mono">
          <span className="font-semibold text-foreground block">
            {new Date(l.timestamp).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-muted-foreground block">
            {new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Authorized Actor",
      render: (l) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-foreground block">{l.actorName}</span>
          <span className="text-[11px] text-muted-foreground block capitalize">
            {l.actorRole} • {l.ipAddress}
          </span>
        </div>
      ),
    },
    {
      key: "module",
      header: "Module & Action",
      render: (l) => (
        <div className="space-y-1">
          <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider rounded-md py-0 px-1.5">
            {l.module}
          </Badge>
          <Badge
            variant="outline"
            className={`${actionColorMap[l.action] || ""} text-[10px] capitalize block w-fit font-semibold py-0 px-1.5`}
          >
            {l.action.replace("_", " ")}
          </Badge>
        </div>
      ),
    },
    {
      key: "description",
      header: "Audit Description",
      render: (l) => (
        <div className="space-y-0.5 max-w-md">
          <p className="text-xs text-foreground/90 font-medium leading-relaxed">
            {l.description}
          </p>
          <span className="text-[10px] text-muted-foreground font-mono">
            Target: {l.entityType} ({l.entityId})
          </span>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState variant="table" count={8} message="Loading immutable compliance audit log..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load audit log"
          description="Failed to retrieve administrative security event records."
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
        title="Administrative Audit Trail"
        description="Append-only immutable record of configuration adjustments, credential verifications, and compliance enforcement."
      >
        <Badge variant="outline" className="gap-1.5 bg-secondary text-xs px-3 py-1 rounded-xl">
          <Lock className="h-3 w-3 text-emerald-600" />
          Read-Only Ledger
        </Badge>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {modules.map((mod) => (
            <Button
              key={mod}
              variant={moduleFilter === mod ? "default" : "outline"}
              size="sm"
              onClick={() => setModuleFilter(mod)}
              className="rounded-xl text-xs h-8 capitalize"
            >
              {mod}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search actor, action, target..."
            className="w-full"
          />
        </div>
      </div>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        emptyTitle="No audit records found"
        emptyDescription="Try clearing filters or search criteria."
        emptyIcon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
