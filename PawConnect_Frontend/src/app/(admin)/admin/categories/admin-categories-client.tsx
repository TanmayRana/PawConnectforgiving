"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminCategories,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useDeleteAdminCategory,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { CategoryFormModal, type CategoryFormValues } from "@/components/admin/category-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/utils/toast";
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import type { AdminCategory } from "@/lib/mock/admin";

export function AdminCategoriesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);

  const { data: categories = [], isLoading, isError, refetch } = useAdminCategories();
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateAdminCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateAdminCategory();
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteAdminCategory();

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [categories, searchQuery]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSaveCategory = async (formData: CategoryFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, input: formData });
        toast.success("Category Updated", {
          description: `Modifications to '${formData.name}' saved.`,
        });
      } else {
        await createCategory(formData);
        toast.success("Category Created", {
          description: `New category '${formData.name}' created.`,
        });
      }
    } catch {
      toast.error("Operation Failed");
    }
  };

  const handleToggleActive = async (cat: AdminCategory) => {
    try {
      await updateCategory({ id: cat.id, input: { active: !cat.active } });
      toast.success(cat.active ? "Category Hidden" : "Category Activated", {
        description: `'${cat.name}' visibility updated.`,
      });
    } catch {
      toast.error("Status Change Failed");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      toast.success("Category Deleted", {
        description: `'${deletingCategory.name}' removed.`,
      });
      setDeletingCategory(null);
    } catch (err: unknown) {
      toast.error("Cannot Delete Category", {
        description: err instanceof Error ? err.message : "Error deleting category",
      });
      setDeletingCategory(null);
    }
  };

  const columns: Column<AdminCategory>[] = [
    {
      key: "name",
      header: "Category & Taxonomy",
      render: (c) => (
        <div className="space-y-0.5">
          <span className="font-bold text-foreground text-xs block">{c.name}</span>
          <span className="text-[11px] text-muted-foreground font-mono block">/{c.slug}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (c) => (
        <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
          {c.description}
        </p>
      ),
    },
    {
      key: "products",
      header: "Active Products",
      render: (c) => (
        <Badge variant="outline" className="text-xs font-semibold rounded-lg bg-surface">
          {c.productCount} items
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Navigation Status",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={c.active}
            onCheckedChange={() => handleToggleActive(c)}
            aria-label={`Toggle active status for ${c.name}`}
          />
          <span className="text-[11px] text-muted-foreground">
            {c.active ? "Active" : "Hidden"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(c)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Edit Category"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingCategory(c)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Category"
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
        <LoadingState variant="table" count={6} message="Loading catalog taxonomy categories..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load categories"
          description="Failed to load category taxonomy."
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
        title="Catalogue Categories"
        description="Configure product taxonomy and customer discovery navigation departments."
      >
        <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs font-semibold h-9 gap-1.5">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex justify-between items-center gap-4">
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search categories by name or slug..."
            className="w-full"
          />
        </div>
      </div>

      {/* Categories DataTable */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(c) => c.id}
        emptyTitle="No categories found"
        emptyDescription="Try clearing your search query or creating a new category."
        emptyIcon={<FolderOpen className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Add / Edit Category Modal */}
      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        onSubmit={handleSaveCategory}
        loading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(op) => !op && setDeletingCategory(null)}
        title={`Delete category '${deletingCategory?.name}'?`}
        description={
          (deletingCategory?.productCount || 0) > 0
            ? `Safety Warning: '${deletingCategory?.name}' currently contains ${deletingCategory?.productCount} active products. You must reassign or remove those products before deleting this category.`
            : "This category contains 0 products and can safely be removed from storefront taxonomy."
        }
        confirmLabel="Confirm Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
