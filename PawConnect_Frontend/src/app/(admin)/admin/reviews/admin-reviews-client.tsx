"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminReviews,
  useToggleAdminReviewVisibility,
  useDeleteAdminReview,
  useResolveAdminReviewReport,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from "@/lib/utils/toast";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import type { AdminReviewItem } from "@/lib/api/admin";

type FilterTab = "all" | "reported" | "visible" | "hidden";

export function AdminReviewsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [deletingReview, setDeletingReview] = useState<AdminReviewItem | null>(null);

  const { data: reviews = [], isLoading, isError, refetch } = useAdminReviews();
  const { mutateAsync: toggleVisibility } = useToggleAdminReviewVisibility();
  const { mutateAsync: deleteReview, isPending: isDeleting } = useDeleteAdminReview();
  const { mutateAsync: resolveReport } = useResolveAdminReviewReport();

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (filterTab === "reported") {
      result = result.filter((r) => r.reported);
    } else if (filterTab === "visible") {
      result = result.filter((r) => r.status === "visible");
    } else if (filterTab === "hidden") {
      result = result.filter((r) => r.status === "hidden");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.authorName.toLowerCase().includes(q) ||
          r.itemTitle.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
      );
    }

    return result;
  }, [reviews, filterTab, searchQuery]);

  const handleToggleVisibility = async (review: AdminReviewItem) => {
    try {
      await toggleVisibility(review.id);
      const isHiding = review.status === "visible";
      showSuccess(
        isHiding ? "Review Hidden" : "Review Restored",
        `Feedback by ${review.authorName} is now ${isHiding ? "hidden from storefront" : "visible"}.`
      );
    } catch {
      showError("Operation Failed", "Could not update review visibility.");
    }
  };

  const handleResolveReport = async (review: AdminReviewItem) => {
    try {
      await resolveReport(review.id);
      showSuccess(
        "Moderation Flag Cleared",
        `Flagged report dismissed for ${review.authorName}'s review.`
      );
    } catch {
      showError("Operation Failed", "Could not dismiss review flag.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    try {
      await deleteReview(deletingReview.id);
      showSuccess(
        "Review Permanently Removed",
        `Feedback by ${deletingReview.authorName} deleted.`
      );
      setDeletingReview(null);
    } catch {
      showError("Delete Failed", "Could not delete review.");
    }
  };

  const columns: Column<AdminReviewItem>[] = [
    {
      key: "review",
      header: "Rating & Feedback",
      render: (r) => (
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < r.rating ? "fill-amber-400 text-amber-400" : "text-border"
                }`}
              />
            ))}
            <span className="text-xs font-bold text-foreground ml-1.5">{r.rating}.0</span>
            {r.reported && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] ml-2">
                Reported
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
            &ldquo;{r.comment}&rdquo;
          </p>
          {r.reportReason && (
            <p className="text-[10px] text-destructive font-medium">
              Flag reason: {r.reportReason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "target",
      header: "Product / Service Target",
      render: (r) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="outline" className="text-[9px] capitalize py-0 px-1">
            {r.itemType}
          </Badge>
          <span className="font-semibold text-foreground block truncate max-w-[180px]">
            {r.itemTitle}
          </span>
        </div>
      ),
    },
    {
      key: "author",
      header: "Verified Author",
      render: (r) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-foreground block">{r.authorName}</span>
          <span className="text-[11px] text-muted-foreground block">{r.createdAt}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Moderation Status",
      render: (r) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${
            r.status === "visible"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {r.status === "visible" ? "Publicly Visible" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Moderation Controls",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.reported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolveReport(r)}
              className="rounded-xl text-xs h-8 gap-1 text-emerald-600 hover:bg-emerald-500/10"
              title="Dismiss Report"
            >
              <CheckCircle className="h-3 w-3" />
              Clear Flag
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleVisibility(r)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title={r.status === "visible" ? "Hide Review" : "Restore Review"}
          >
            {r.status === "visible" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingReview(r)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Permanently Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingState variant="table" count={6} message="Loading customer reviews moderation queue..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load reviews"
          description="Encountered an issue loading feedback items."
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
        title="Customer Feedback & Moderation"
        description="Audit product ratings and verified care testimonials against platform content guidelines."
      />

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={filterTab}
          onValueChange={(val) => setFilterTab(val as FilterTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-secondary/60 p-1 rounded-2xl h-10">
            <TabsTrigger value="all" className="rounded-xl text-xs px-3">
              All ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="reported" className="rounded-xl text-xs px-3">
              Flagged ({reviews.filter((r) => r.reported).length})
            </TabsTrigger>
            <TabsTrigger value="visible" className="rounded-xl text-xs px-3">
              Visible
            </TabsTrigger>
            <TabsTrigger value="hidden" className="rounded-xl text-xs px-3">
              Hidden
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by author, item, or comment..."
            className="w-full"
          />
        </div>
      </div>

      {/* Reviews DataTable */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        keyExtractor={(r) => r.id}
        emptyTitle="No reviews found"
        emptyDescription="Try clearing filters or search query."
        emptyIcon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Delete Review Confirm */}
      <ConfirmDialog
        open={Boolean(deletingReview)}
        onOpenChange={(op) => !op && setDeletingReview(null)}
        title={`Permanently delete review by ${deletingReview?.authorName}?`}
        description="This action cannot be undone. The review and its score impact will be permanently expunged."
        confirmLabel="Yes, Delete Review"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
