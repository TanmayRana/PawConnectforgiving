"use client";

import * as React from "react";
import Image from "next/image";
import {
  Mail,
  Phone,
  Shield,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  KeyRound,
  HeartHandshake,
  Bell,
  Volume2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProfileFormModal } from "@/components/customer/profile-form-modal";
import { AddressModal } from "@/components/customer/address-modal";
import { ChangePasswordModal } from "@/components/customer/change-password-modal";
import { LoadingState, ErrorState } from "@/components/shared/states";
import {
  useCustomerProfile,
  useUpdateCustomerProfile,
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/api/hooks";
import type { CustomerAddress } from "@/lib/mock/customer";
import { showSuccess, showError, showInfo } from "@/lib/utils/toast";

export function ProfileClient() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useCustomerProfile();
  const updateProfileMutation = useUpdateCustomerProfile();

  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [addressModalOpen, setAddressModalOpen] = React.useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = React.useState(false);
  const [addressModalMode, setAddressModalMode] = React.useState<"create" | "edit">("create");
  const [selectedAddress, setSelectedAddress] = React.useState<CustomerAddress | null>(null);

  // Delete address dialog
  const [deleteAddressId, setDeleteAddressId] = React.useState<string | null>(null);

  // Desktop alert state
  const [desktopAlertsActive, setDesktopAlertsActive] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopAlertsActive(Notification.permission === "granted");
    }
  }, []);

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopAlertsActive(perm === "granted");
        if (perm === "granted") {
          showSuccess("Desktop Notifications Enabled", "You will now receive system notifications on your desktop.");
        } else {
          showError("Permission Denied", "Desktop notifications were blocked or not allowed by browser.");
        }
      } catch {
        // ignore
      }
    }
  };

  const handleToggleEmailNotifications = async (checked: boolean) => {
    if (!profile) return;
    try {
      await updateProfileMutation.mutateAsync({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatar: profile.avatar,
        emailNotificationsEnabled: checked,
      });
      if (checked) {
        showSuccess(
          "Email Notifications Enabled",
          "All system alerts, order updates, and broadcasts will now also be sent to your email."
        );
      } else {
        showInfo(
          "Email Notifications Disabled",
          "Email delivery for platform notifications has been turned off."
        );
      }
    } catch {
      showError("Update Failed", "Could not update notification preferences.");
    }
  };

  if (profileLoading || addressesLoading) {
    return <LoadingState variant="profile" message="Loading your customer profile..." className="min-h-[50vh] py-8" />;
  }

  if (profileError || !profile) {
    return (
      <ErrorState
        title="Could Not Load Profile"
        description="Unable to fetch your personal account details at this time."
      />
    );
  }

  const handleOpenAddAddress = () => {
    setSelectedAddress(null);
    setAddressModalMode("create");
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setSelectedAddress(addr);
    setAddressModalMode("edit");
    setAddressModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      <PageHeader
        title="Customer Profile & Settings"
        description="Manage your verified contact info, emergency contacts, security, and addresses."
      />

      {/* Main Account Card */}
      <div className="rounded-[32px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-border/60 bg-surface shadow-xs">
          <Image
            src={profile.avatar}
            alt={`${profile.firstName} ${profile.lastName}`}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            priority
            className="object-cover object-top"
          />
        </div>

        <div className="flex-1 w-full space-y-3 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-foreground">
                  {profile.firstName} {profile.lastName}
                </h2>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs">
                  Verified Member
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Member of PawConnect since {profile.memberSince}
              </p>
            </div>

            <Button
              onClick={() => setProfileModalOpen(true)}
              variant="outline"
              className="gap-2 rounded-full text-xs sm:text-sm self-center md:self-auto"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 bg-surface/70 p-2.5 rounded-xl border border-border/60">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-surface/70 p-2.5 rounded-xl border border-border/60">
              <Phone className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-semibold text-foreground">{profile.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Emergency Contact & Addresses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Emergency Contact */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary" />
                Designated Emergency Contact
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:bg-primary-soft/50 h-8 rounded-full"
                onClick={() => setProfileModalOpen(true)}
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used by veterinarians and boarders if you cannot be reached during an emergency.
            </p>

            <div className="p-4 rounded-2xl bg-surface/70 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-foreground text-sm block">
                  {profile.emergencyContact.name}
                </span>
                <span className="text-muted-foreground">
                  Relationship: {profile.emergencyContact.relationship}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-primary bg-primary-soft/60 px-3 py-1.5 rounded-xl border border-primary/20">
                <Phone className="w-3.5 h-3.5" />
                {profile.emergencyContact.phone}
              </div>
            </div>
          </div>

          {/* Saved Addresses Section */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Saved Addresses & Locations
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used for mobile groomers, home veterinary visits, and pet shop orders.
                </p>
              </div>

              <Button
                onClick={handleOpenAddAddress}
                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </Button>
            </div>

            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-5 rounded-2xl border border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 hover:shadow-xs transition-all"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        {addr.label === "Home" ? (
                          <Home className="w-4 h-4 text-primary" />
                        ) : (
                          <Building className="w-4 h-4 text-sky-600" />
                        )}
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Default
                        </Badge>
                      )}
                    </div>

                    <p className="font-semibold text-foreground">
                      {addr.recipientName} • {addr.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {addr.street} {addr.unit ? `, ${addr.unit}` : ""}, {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    {addr.deliveryInstructions && (
                      <p className="text-muted-foreground italic">
                        Note: &quot;{addr.deliveryInstructions}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-muted-foreground hover:text-foreground rounded-full"
                        onClick={async () => {
                          try {
                            await setDefaultAddressMutation.mutateAsync(addr.id);
                            showSuccess("Default Address Set", `${addr.label} set as your primary address.`);
                          } catch {
                            showError("Update Failed", "Unable to update default address at this time.");
                          }
                        }}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 rounded-full"
                      onClick={() => handleOpenEditAddress(addr)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => setDeleteAddressId(addr.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Account Security & Privacy & Notification Settings */}
        <div className="space-y-6">
          {/* Notification Preferences Card */}
          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Preferences
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure how you receive announcements, system alerts, order updates, and booking notifications.
            </p>

            <div className="space-y-4 pt-1 text-xs">
              {/* Email Notifications Option */}
              <div className="p-4 rounded-2xl bg-surface/70 border border-border/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-bold text-foreground text-sm">Email Notifications</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    When enabled, all system announcements, platform broadcasts, order receipts, and bookings will also be sent to{" "}
                    <span className="font-semibold text-foreground">{profile.email}</span>.
                  </p>
                </div>
                <Switch
                  id="email-notifications-toggle"
                  aria-label="Get notification on email"
                  checked={profile.emailNotificationsEnabled !== false}
                  onCheckedChange={handleToggleEmailNotifications}
                  disabled={updateProfileMutation.isPending}
                />
              </div>

              {/* Desktop / System Notifications Option */}
              <div className="p-4 rounded-2xl bg-surface/70 border border-border/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-bold text-foreground text-sm">System Desktop Alerts</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Instant system alerts on your desktop when notifications and announcements arrive.
                  </p>
                </div>
                {desktopAlertsActive ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] shrink-0">
                    Active
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 rounded-full shrink-0"
                    onClick={handleRequestDesktopPermission}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Security & Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface/70 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">Password</span>
                <span className="font-semibold text-foreground mt-0.5 block font-mono">••••••••••••</span>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Last updated 2 months ago
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-full text-xs"
                onClick={() => setChangePasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </div>
          </div>

          <div className="bg-primary-soft/30 rounded-[28px] p-6 border border-primary/20 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Shield className="w-4 h-4 text-primary" />
              Data Privacy Protection
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Your pet medical logs, contact numbers, and delivery locations are protected with end-to-end encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileFormModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        profile={profile}
        onSubmit={async (data) => {
          await updateProfileMutation.mutateAsync({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            avatar: data.avatar,
            emailNotificationsEnabled: profile.emailNotificationsEnabled,
            emergencyContact: {
              name: data.emergencyName,
              phone: data.emergencyPhone,
              relationship: data.emergencyRelation,
            },
          });
          showSuccess("Profile Saved", "Personal details and emergency contact updated.");
        }}
        isSubmitting={updateProfileMutation.isPending}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordModalOpen}
        onOpenChange={setChangePasswordModalOpen}
      />

      {/* Address Create / Edit Modal */}
      <AddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        mode={addressModalMode}
        initialData={selectedAddress}
        onSubmit={async (data) => {
          if (addressModalMode === "create") {
            await addAddressMutation.mutateAsync(data);
            showSuccess("Address Saved", "New address has been added to your profile.");
          } else if (selectedAddress) {
            await updateAddressMutation.mutateAsync({
              id: selectedAddress.id,
              data,
            });
            showSuccess("Address Updated", "Your address has been saved.");
          }
        }}
        isSubmitting={addAddressMutation.isPending || updateAddressMutation.isPending}
      />

      {/* Delete Address Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteAddressId)}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
        title="Remove Saved Address?"
        description="Are you sure you want to delete this address from your profile? This cannot be undone."
        confirmLabel="Yes, Remove Address"
        cancelLabel="Keep"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteAddressId) return;
          try {
            await deleteAddressMutation.mutateAsync(deleteAddressId);
            showSuccess("Address Removed", "Address removed successfully.");
            setDeleteAddressId(null);
          } catch {
            showError("Delete Failed", "Could not remove address. Please try again.");
          }
        }}
      />
    </div>
  );
}
