"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationMap } from "./location-map";
import { AddressSearchInput } from "./address-search-input";
import { reverseGeocode } from "./geocoding-service";
import type {
  LocationCoordinates,
  GeocodedAddress,
  SearchResultItem,
  LocationPickerResult,
} from "./types";
import {
  MapPin,
  Navigation,
  Loader2,
  Check,
  AlertTriangle,
  Info,
  Compass,
} from "lucide-react";
import { showError, showSuccess, showInfo } from "@/lib/utils/toast";

// Default geographic fallback center if no initial coordinates are passed
const DEFAULT_CENTER: LocationCoordinates = {
  lat: 28.6139, // New Delhi / India center
  lng: 77.209,
};

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  initialCoordinates?: LocationCoordinates | null;
  initialAddressText?: string;
  onConfirmLocation: (result: LocationPickerResult) => void;
}

export function LocationPickerModal({
  open,
  onOpenChange,
  title = "Select Delivery Location",
  description = "Search your address or drag the pin to pinpoint your doorstep for free delivery.",
  initialCoordinates,
  initialAddressText,
  onConfirmLocation,
}: LocationPickerModalProps) {
  const [mapCenter, setMapCenter] = useState<LocationCoordinates>(
    initialCoordinates || DEFAULT_CENTER
  );
  const [pinPosition, setPinPosition] = useState<LocationCoordinates>(
    initialCoordinates || DEFAULT_CENTER
  );
  const [selectedAddress, setSelectedAddress] = useState<GeocodedAddress | null>(null);
  const [isReverseLoading, setIsReverseLoading] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Reverse geocode handler with cancellation
  const performReverseGeocode = useCallback(async (coords: LocationCoordinates) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortRef.current = abortCtrl;

    setIsReverseLoading(true);
    try {
      const addr = await reverseGeocode(coords, abortCtrl.signal);
      setSelectedAddress(addr);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        // Fallback address retaining coordinates
        setSelectedAddress({
          displayName: `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          street: "Selected Delivery Point",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    } finally {
      setIsReverseLoading(false);
    }
  }, []);

  // Initialize or reset coordinates whenever dialog opens
  useEffect(() => {
    if (open) {
      const coords = initialCoordinates || DEFAULT_CENTER;
      setMapCenter(coords);
      setPinPosition(coords);
      setGpsError(null);

      if (initialCoordinates) {
        // Reverse geocode initial coordinates
        performReverseGeocode(initialCoordinates);
      } else if (initialAddressText) {
        setSelectedAddress({
          displayName: initialAddressText,
          street: initialAddressText,
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    }
  }, [open, initialCoordinates, initialAddressText, performReverseGeocode]);

  // When marker is moved by clicking map or dragging pin
  const handleMarkerChange = (coords: LocationCoordinates) => {
    setPinPosition(coords);
    performReverseGeocode(coords);
  };

  // When user selects an address from search suggestions
  const handleSearchSelect = (result: SearchResultItem) => {
    const coords: LocationCoordinates = { lat: result.lat, lng: result.lng };
    setMapCenter(coords);
    setPinPosition(coords);

    if (result.address && result.address.displayName) {
      setSelectedAddress(result.address as GeocodedAddress);
    } else {
      performReverseGeocode(coords);
    }
  };

  // Browser Geolocation API ("Use My Current Location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      showError("GPS Unavailable", "Browser does not support geolocation.");
      return;
    }

    setIsLocatingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGPS(false);
        const coords: LocationCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(coords);
        setPinPosition(coords);
        performReverseGeocode(coords);
        showSuccess("GPS Location Found", "Map centered to your current device location.");
      },
      (error) => {
        setIsLocatingGPS(false);
        let msg = "Could not detect your current location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access or pick manually on the map.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS signal is currently unavailable. Try searching for your street name.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please retry or click on the map.";
        }
        setGpsError(msg);
        showInfo("Location Access Notice", msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleConfirm = () => {
    const formatted = selectedAddress?.displayName || `Lat: ${pinPosition.lat.toFixed(5)}, Lng: ${pinPosition.lng.toFixed(5)}`;
    const finalAddress: GeocodedAddress = selectedAddress || {
      displayName: formatted,
      street: "Selected Delivery Point",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      lat: pinPosition.lat,
      lng: pinPosition.lng,
    };

    onConfirmLocation({
      coordinates: pinPosition,
      address: finalAddress,
      formattedAddress: formatted,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide" className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Interactive Map
            </span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <DialogBody className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Top Actions: Address Search Bar & GPS Locate Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1">
              <AddressSearchInput onSelectResult={handleSearchSelect} />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingGPS}
              className="rounded-2xl h-10.5 px-3.5 text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-secondary/70 border-border/80 shadow-xs"
            >
              {isLocatingGPS ? (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              {isLocatingGPS ? "Locating..." : "Use My Current Location"}
            </Button>
          </div>

          {/* GPS Error notice if permissions denied */}
          {gpsError && (
            <div className="p-2.5 text-xs rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Interactive Map Viewport with draggable pin */}
          <div className="relative rounded-2xl overflow-hidden border border-border/70 shadow-sm h-[280px] sm:h-[360px]">
            <LocationMap
              center={mapCenter}
              markerPosition={pinPosition}
              onMarkerChange={handleMarkerChange}
              className="h-full w-full"
            />

            {/* Quick helper badge overlay */}
            <div className="absolute top-3 left-3 z-[400] pointer-events-none">
              <Badge className="bg-background/90 text-foreground backdrop-blur-md border border-border/60 shadow-sm text-[10px] font-medium py-1 px-2.5 gap-1.5 flex items-center">
                <Compass className="h-3 w-3 text-primary animate-spin-slow" />
                Click map or drag the pin to adjust doorstep
              </Badge>
            </div>

            {/* Live Coordinates Floating Chip */}
            <div className="absolute bottom-3 right-3 z-[400] pointer-events-none">
              <Badge variant="outline" className="bg-background/90 text-muted-foreground backdrop-blur-md text-[10px] font-mono py-1 px-2">
                {pinPosition.lat.toFixed(5)}, {pinPosition.lng.toFixed(5)}
              </Badge>
            </div>
          </div>

          {/* Swiggy/Zomato style Live Delivery Address Preview Card */}
          <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-2.5 transition-all duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {selectedAddress?.street || "Selected Delivery Point"}
                  </h4>
                  {selectedAddress?.suburb && (
                    <span className="text-[11px] text-muted-foreground block">
                      {selectedAddress.suburb}
                    </span>
                  )}
                </div>
              </div>

              {isReverseLoading && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Fetching address...</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-9">
              {selectedAddress?.displayName || (
                <span className="italic">
                  Pin placed at latitude {pinPosition.lat.toFixed(5)}, longitude {pinPosition.lng.toFixed(5)}
                </span>
              )}
            </p>

            <div className="pl-9 pt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3 text-primary shrink-0" />
              <span>You will be able to review and add flat/unit numbers on the confirmation form.</span>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 bg-background/50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full h-10 px-5 text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="rounded-full h-10 px-6 text-xs font-bold gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm Delivery Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
