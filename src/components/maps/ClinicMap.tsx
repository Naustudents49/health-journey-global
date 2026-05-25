/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

interface ClinicMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
}

export function ClinicMap({ markers, center, zoom = 13, className, onClick }: ClinicMapProps) {
  const { ready, error } = useGoogleMaps();
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);

  // Init map
  useEffect(() => {
    if (!ready || !elRef.current || mapRef.current) return;
    const fallback = center ?? markers[0] ?? { lat: 30.0444, lng: 31.2357 }; // Cairo
    mapRef.current = new google.maps.Map(elRef.current, {
      center: fallback,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    if (onClick) {
      mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) onClick(e.latLng.lat(), e.latLng.lng());
      });
    }
  }, [ready, center, zoom, markers, onClick]);

  // Sync markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = markers.map(
      (m) =>
        new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map: mapRef.current!,
          title: m.title,
        }),
    );
    if (markers.length > 0) {
      const c = center ?? markers[0];
      mapRef.current.setCenter(c);
    }
  }, [ready, markers, center]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground rounded-lg ${className ?? "h-48"}`}>
        {error}
      </div>
    );
  }

  return <div ref={elRef} className={`rounded-lg overflow-hidden ${className ?? "h-48"} bg-muted`} />;
}
