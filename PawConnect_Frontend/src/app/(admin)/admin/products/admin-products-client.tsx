"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  useAdminProducts,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useToggleAdminProductActive,
  useDeleteAdminProduct,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ProductFormDrawer } from "@/components/admin/product-form-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "@/lib/utils/toast";
import {
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import type { EnrichedProductItem } from "@/lib/mock/products";

export function AdminProductsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnrichedProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<EnrichedProductItem | null>(null);

  const { data: products = [], isLoading, isError, refetch } = useAdminProducts();
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateAdminProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateAdminProduct();
  const { mutateAsync: toggleActive } = useToggleAdminProductActive();
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteAdminProduct();

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, categoryFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (product: EnrichedProductItem) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleSaveProduct = async (formData: Omit<EnrichedProductItem, "id">) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, input: formData });
        toast.success("Product Updated", {
          description: `Catalog details for ${formData.name} saved.`,
        });
      } else {
        await createProduct(formData);
        toast.success("Product Created", {
          description: `Added ${formData.name} to in-house inventory.`,
        });
      }
    } catch {
      toast.error("Operation Failed");
    }
  };

  const handleToggleActive = async (product: EnrichedProductItem) => {
    try {
      await toggleActive(product.id);
      toast.success(product.inStock ? "Product Deactivated" : "Product Published", {
        description: `${product.name} shelf status updated.`,
      });
    } catch {
      toast.error("Status Change Failed");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      toast.success("Product Removed", {
        description: `${deletingProduct.name} deleted from active catalog.`,
      });
      setDeletingProduct(null);
    } catch {
      toast.error("Delete Failed");
    }
  };

  const stockBadgeMap: Record<string, { label: string; className: string }> = {
    "in-stock": {
      label: "In Stock",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
    "low-stock": {
      label: "Low Stock",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    "out-of-stock": {
      label: "Out of Stock",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const columns: Column<EnrichedProductItem>[] = [
    {
      key: "product",
      header: "Product Item",
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
            <Image
              src={p.images?.[0] || p.image || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80"}
              alt={p.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-foreground text-xs block truncate">{p.name}</span>
            <span className="text-[11px] text-muted-foreground block truncate">{p.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Retail Price",
      render: (p) => (
        <span className="font-bold text-foreground text-xs">{formatMoney(p.price)}</span>
      ),
    },
    {
      key: "inventory",
      header: "Inventory Units",
      render: (p) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground text-xs block">{p.stock} units</span>
          <Badge
            variant="outline"
            className={`${stockBadgeMap[p.stockStatus]?.className || ""} text-[9px] py-0 px-1.5`}
          >
            {stockBadgeMap[p.stockStatus]?.label || "Available"}
          </Badge>
        </div>
      ),
    },
    {
      key: "status",
      header: "Active on Shelf",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={p.inStock}
            onCheckedChange={() => handleToggleActive(p)}
            aria-label={`Toggle visibility for ${p.name}`}
          />
          <span className="text-[11px] text-muted-foreground">
            {p.inStock ? "Active" : "Draft"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(p)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Edit Product"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingProduct(p)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Product"
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
        <LoadingState variant="table" count={6} message="Loading in-house product inventory..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could not load products"
          description="Failed to load catalog inventory items."
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
        title="In-House Storefront Products"
        description="Admin inventory controls for all PawConnect curated nutrition, wellness formulas, and pet gear. No external vendor sellers."
      >
        <Button onClick={handleOpenCreate} size="sm" className="rounded-xl text-xs font-semibold h-9 gap-1.5">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="rounded-xl text-xs h-8 capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products by title, category..."
            className="w-full"
          />
        </div>
      </div>

      {/* Products DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        emptyTitle="No products found"
        emptyDescription="Try clearing active search queries or category filters."
        emptyIcon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
      />

      {/* Add / Edit Drawer */}
      <ProductFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        product={editingProduct}
        onSubmit={handleSaveProduct}
        loading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(op) => !op && setDeletingProduct(null)}
        title={`Remove ${deletingProduct?.name} from active inventory?`}
        description="Historical customer orders will maintain preserved price snapshots. However, this item will no longer appear on public shelves."
        confirmLabel="Yes, Remove Product"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
