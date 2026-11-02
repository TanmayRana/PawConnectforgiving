"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useOrders } from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { OrderCard } from "@/components/orders/order-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState, ErrorState } from "@/components/shared/states";
import { RefreshIndicator } from "@/components/ui/paw-spinner";
import { Package } from "lucide-react";
import type { OrderStatus } from "@/lib/mock/orders";

type FilterTab = "all" | OrderStatus;

export function OrdersClient() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [], isLoading, isFetching, isError, refetch } = useOrders();

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (activeTab !== "all") {
      result = result.filter((o) => o.status === activeTab);
    }

    // Search query by order number or item name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }

    // Sort by latest order first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="My Orders"
        description="Track your active shipments, view delivery timelines, and reorder pet favorites."
      >
        <RefreshIndicator isRefreshing={isFetching && !isLoading} label="Refreshing orders..." />
      </PageHeader>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as FilterTab)}
            className="w-auto"
          >
            <TabsList className="h-10 p-1 rounded-2xl bg-secondary/80">
              <TabsTrigger value="all" className="rounded-xl text-xs px-3 font-semibold">
                All ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-xl text-xs px-3 font-semibold">
                Confirmed
              </TabsTrigger>
              <TabsTrigger value="packed" className="rounded-xl text-xs px-3 font-semibold">
                Packed
              </TabsTrigger>
              <TabsTrigger value="shipped" className="rounded-xl text-xs px-3 font-semibold">
                Shipped
              </TabsTrigger>
              <TabsTrigger value="delivered" className="rounded-xl text-xs px-3 font-semibold">
                Delivered
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-xl text-xs px-3 font-semibold">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by order # or item..."
          />
        </div>
      </div>

      {/* Orders List / State Handling */}
      {isLoading ? (
        <div className="py-6">
          <LoadingState variant="cards" count={4} columns={2} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load orders"
          description="We had trouble fetching your order history. Please try again."
          action={
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 min-h-[380px] flex items-center justify-center">
          <EmptyState
            icon={<Package className="h-8 w-8 text-muted-foreground" />}
            title={
              activeTab === "all"
                ? "No orders found"
                : `No ${activeTab} orders`
            }
            description={
              searchQuery
                ? `No orders match "${searchQuery}". Try a different keyword.`
                : activeTab === "all"
                ? "You haven't placed any in-house orders yet. Visit our shop to explore vet-approved diets, toys, and care essentials."
                : `You currently have no orders in the "${activeTab}" stage.`
            }
            action={
              activeTab === "all" && !searchQuery ? (
                <Button asChild className="rounded-xl">
                  <Link href="/app/shop">Explore Pet Shop</Link>
                </Button>
              ) : activeTab !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("all")}
                  className="rounded-xl"
                >
                  View All Orders
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground px-1">
            Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
