"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";
import type { LocationCoordinates } from "./types";

interface LocationMapProps {
  center: LocationCoordinates;
  markerPosition: LocationCoordinates;
  zoom?: number;
  onMarkerChange?: (coords: LocationCoordinates) => void;
  className?: string;
  isDraggable?: boolean;
  popupText?: string;
}

// Disable SSR for Leaflet map component to prevent browser-global errors in Next.js App Router
const DynamicLeafletMap = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-secondary/30 rounded-2xl border border-border/50 text-muted-foreground gap-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-foreground">Loading interactive map...</p>
        <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
          <MapPin className="h-3 w-3" />
          OpenStreetMap Standard Tiles
        </p>
      </div>
    </div>
  ),
});

export function LocationMap(props: LocationMapProps) {
  return <DynamicLeafletMap {...props} />;
}
