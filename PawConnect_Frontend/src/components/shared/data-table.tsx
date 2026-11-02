"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  getRowKey?: (row: T, index: number) => string | number;
  keyExtractor?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
}

function SkeletonRows({ columns, count }: { columns: number; count: number }) {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-1/3"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="animate-in fade-in duration-150">
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j}>
              <div className="flex items-center gap-2.5">
                {j === 0 && <Skeleton className="h-7 w-7 rounded-lg shrink-0" />}
                <Skeleton
                  className={cn(
                    "h-4 rounded",
                    j === columns - 1 ? "w-16 ml-auto" : widths[(i + j) % widths.length]
                  )}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription = "No records match your current filters.",
  emptyIcon,
  emptyAction,
  getRowKey,
  keyExtractor,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const getCellValue = (row: T, col: Column<T>): React.ReactNode => {
    if (col.cell) return col.cell(row);
    if (col.render) return col.render(row);
    const key = col.key as keyof T;
    const value = row[key];
    if (value === null || value === undefined) return "—";
    return String(value);
  };

  return (
    <div className={cn("w-full overflow-auto rounded-2xl border border-border", className)}>
      <Table aria-busy={loading ? "true" : undefined}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn("whitespace-nowrap", col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows columns={columns.length} count={5} />
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 p-0">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  icon={emptyIcon}
                  action={emptyAction}
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow
                key={keyExtractor ? keyExtractor(row, i) : getRowKey ? getRowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    className={cn("whitespace-nowrap", col.className)}
                  >
                    {getCellValue(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
