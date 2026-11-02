"use client";

import * as React from "react";
import { Plus, CheckCircle2, Home, Building, MapPin, Edit, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressModal } from "@/components/customer/address-modal";
import { LocationPickerModal } from "@/components/shared/location/location-picker-modal";
import { useAddresses, useAddAddress, useUpdateAddress } from "@/lib/api/hooks";
import type { CustomerAddress } from "@/lib/mock/customer";
import { showSuccess } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";

interface CheckoutAddressSelectorProps {
  selectedAddressId: string | null;
  onSelectAddress: (address: CustomerAddress) => void;
}

export function CheckoutAddressSelector({
  selectedAddressId,
  onSelectAddress,
}: CheckoutAddressSelectorProps) {
  const { data: addresses = [] } = useAddresses();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [editingAddress, setEditingAddress] = React.useState<CustomerAddress | null>(null);
  const [isDirectMapPickerOpen, setIsDirectMapPickerOpen] = React.useState(false);

  // Auto-select default or first address if none is selected yet
  React.useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      onSelectAddress(defaultAddr);
    }
  }, [addresses, selectedAddressId, onSelectAddress]);

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, addr: CustomerAddress) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setModalMode("edit");
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Choose Delivery Address
        </h4>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDirectMapPickerOpen(true)}
            className="rounded-xl text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Navigation className="h-3.5 w-3.5 text-primary" />
            Select on Map
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="rounded-xl text-xs h-8 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Address
          </Button>
        </div>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            You don&apos;t have any saved shipping addresses yet.
          </p>
          <Button
            type="button"
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl text-xs bg-primary text-primary-foreground font-semibold"
          >
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={cn(
                  "relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none text-left",
                  isSelected
                    ? "border-primary bg-primary-soft/30 shadow-xs"
                    : "border-border/70 bg-white hover:border-border hover:bg-surface/50 dark:bg-card"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      {addr.label === "Home" ? (
                        <Home className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Building className="h-3.5 w-3.5 text-sky-600" />
                      )}
                      {addr.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {addr.isDefault && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                          Default
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-foreground truncate">
                    {addr.recipientName} ({addr.phone})
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {addr.street} {addr.unit ? `, ${addr.unit}` : ""}, {addr.city},{" "}
                    {addr.state} {addr.zipCode}
                  </p>
                  {addr.latitude != null && addr.longitude != null && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <MapPin className="h-2.5 w-2.5 text-emerald-600" />
                        GPS Mapped: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {addr.deliveryInstructions && (
                    <p className="text-[11px] text-muted-foreground italic truncate">
                      &quot;{addr.deliveryInstructions}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-border/40 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(e, addr)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Location Map Picker Modal */}
      <LocationPickerModal
        open={isDirectMapPickerOpen}
        onOpenChange={setIsDirectMapPickerOpen}
        title="Select Free Delivery Location"
        description="Search your address or place the pin precisely on the interactive map."
        onConfirmLocation={(result) => {
          setEditingAddress({
            id: `temp-${Date.now()}`,
            label: "Home",
            recipientName: addresses[0]?.recipientName || "",
            phone: addresses[0]?.phone || "",
            street: result.address.street || result.formattedAddress,
            unit: result.address.unit || "",
            city: result.address.city || "San Francisco",
            state: result.address.state || "CA",
            zipCode: result.address.postalCode || "",
            latitude: result.coordinates.lat,
            longitude: result.coordinates.lng,
            isDefault: addresses.length === 0,
          });
          setModalMode("create");
          setModalOpen(true);
        }}
      />

      {/* Address Create / Edit Modal (Reuses AddressModal) */}
      <AddressModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialData={editingAddress}
        onSubmit={async (data) => {
          if (modalMode === "create") {
            const newAddr = await addAddressMutation.mutateAsync(data);
            onSelectAddress(newAddr);
            showSuccess("Delivery Address Saved", "New address selected for your order.");
          } else if (editingAddress) {
            const updated = await updateAddressMutation.mutateAsync({
              id: editingAddress.id,
              data,
            });
            onSelectAddress(updated);
            showSuccess("Delivery Address Updated", "Updated address selected for your order.");
          }
        }}
        isSubmitting={addAddressMutation.isPending || updateAddressMutation.isPending}
      />
    </div>
  );
}
