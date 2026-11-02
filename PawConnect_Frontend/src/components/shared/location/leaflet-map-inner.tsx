"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { LocationCoordinates } from "./types";

interface LeafletMapInnerProps {
  center: LocationCoordinates;
  markerPosition: LocationCoordinates;
  zoom?: number;
  onMarkerChange?: (coords: LocationCoordinates) => void;
  className?: string;
  isDraggable?: boolean;
  popupText?: string;
}

// Custom modern SVG marker with pulse effect to avoid broken image asset paths in Next.js
function createPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "pawconnect-map-pin",
    html: `
      <div style="position: relative; width: 42px; height: 52px; transform: translate(-50%, -100%); cursor: grab;">
        <!-- Pulsing radar ring -->
        <span style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 12px;
          background: rgba(16, 185, 129, 0.35);
          border-radius: 50%;
          animation: mapPinPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>

        <!-- Drop Shadow -->
        <span style="
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 6px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 50%;
          filter: blur(1.5px);
        "></span>

        <!-- Pin Head -->
        <svg width="42" height="52" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <path d="M21 0C9.402 0 0 9.402 0 21C0 35.5 21 52 21 52C21 52 42 35.5 42 21C42 9.402 32.598 0 21 0Z" fill="#10B981" />
          <path d="M21 3C11.059 3 3 11.059 3 21C3 33.2 21 48 21 48C21 48 39 33.2 39 21C39 11.059 30.941 3 21 3Z" fill="#059669" />
          <circle cx="21" cy="20" r="10" fill="#FFFFFF" />
          <!-- Inner Pin Core -->
          <circle cx="21" cy="20" r="5" fill="#10B981" />
        </svg>
      </div>
      <style>
        @keyframes mapPinPulse {
          0% { transform: translateX(-50%) scale(0.6); opacity: 0.9; }
          70% { transform: translateX(-50%) scale(1.8); opacity: 0; }
          100% { transform: translateX(-50%) scale(1.8); opacity: 0; }
        }
      </style>
    `,
    iconSize: [42, 52],
    iconAnchor: [21, 52],
  });
}

export default function LeafletMapInner({
  center,
  markerPosition,
  zoom = 15,
  onMarkerChange,
  className = "w-full h-full",
  isDraggable = true,
  popupText,
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMarkerChangeRef = useRef(onMarkerChange);

  useEffect(() => {
    onMarkerChangeRef.current = onMarkerChange;
  }, [onMarkerChange]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = markerPosition.lat || center.lat || 20.5937;
    const initialLng = markerPosition.lng || center.lng || 78.9629;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Standard OpenStreetMap tiles
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create Pin Marker
    const icon = createPinIcon();
    const marker = L.marker([initialLat, initialLng], {
      icon,
      draggable: isDraggable,
      autoPan: true,
    }).addTo(map);

    if (popupText) {
      marker.bindPopup(`<div style="font-family: inherit; font-size: 12px; font-weight: 600; padding: 2px;">${popupText}</div>`);
      marker.openPopup();
    }

    if (isDraggable) {
      // Draggable marker event listener
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMarkerChangeRef.current?.({ lat: pos.lat, lng: pos.lng });
      });

      // Map click relocates marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onMarkerChangeRef.current?.({ lat, lng });
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    // Invalidate size once DOM settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isDraggable, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize map center when external center changes (e.g. search / GPS click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentCenter = map.getCenter();
    const diffLat = Math.abs(currentCenter.lat - center.lat);
    const diffLng = Math.abs(currentCenter.lng - center.lng);

    if (diffLat > 0.0001 || diffLng > 0.0001) {
      map.flyTo([center.lat, center.lng], zoom || 16, {
        duration: 1.2,
      });
    }
  }, [center.lat, center.lng, zoom]);

  // Synchronize marker position when coordinates change externally
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const currentPos = marker.getLatLng();
    const diffLat = Math.abs(currentPos.lat - markerPosition.lat);
    const diffLng = Math.abs(currentPos.lng - markerPosition.lng);

    if (diffLat > 0.00001 || diffLng > 0.00001) {
      marker.setLatLng([markerPosition.lat, markerPosition.lng]);
    }
  }, [markerPosition.lat, markerPosition.lng]);

  // Window resize observer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden shadow-inner z-0 ${className}`}
      style={{ minHeight: "260px" }}
    />
  );
}
