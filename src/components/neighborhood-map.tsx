"use client";

import { useEffect, useState } from "react";
import type { Neighborhood } from "@/lib/types";

interface MapProps {
  neighborhoods: Omit<Neighborhood, "id">[];
}

export function NeighborhoodMap({ neighborhoods }: MapProps) {
  const [MapContainer, setMapContainer] = useState<React.ComponentType<any> | null>(null);
  const [TileLayer, setTileLayer] = useState<React.ComponentType<any> | null>(null);
  const [CircleMarker, setCircleMarker] = useState<React.ComponentType<any> | null>(null);
  const [Tooltip, setTooltip] = useState<React.ComponentType<any> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      setMapContainer(() => mod.MapContainer);
      setTileLayer(() => mod.TileLayer);
      setCircleMarker(() => mod.CircleMarker);
      setTooltip(() => mod.Tooltip);
      setReady(true);
    });
    // @ts-ignore — CSS import for side effects
    import("leaflet/dist/leaflet.css");
  }, []);

  if (!ready || !MapContainer || !TileLayer || !CircleMarker || !Tooltip) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-sand-200 bg-sand-50">
        <p className="text-sm text-gray-400">Loading map...</p>
      </div>
    );
  }

  const maxRent = Math.max(...neighborhoods.map((n) => n.avg_rent_sqft));

  return (
    <div className="overflow-hidden rounded-lg border border-sand-200">
      <MapContainer
        center={[40.735, -73.96]}
        zoom={11}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {neighborhoods.map((n) => {
          const radius = 8 + (n.asian_dining_score / 100) * 20;
          const opacity = 0.4 + (n.avg_rent_sqft / maxRent) * 0.5;
          return (
            <CircleMarker
              key={n.name}
              center={[n.lat, n.lng]}
              radius={radius}
              pathOptions={{
                color: "#D85A30",
                fillColor: "#D85A30",
                fillOpacity: opacity,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="text-xs">
                  <p className="font-semibold">{n.name}</p>
                  <p>${n.avg_rent_sqft}/sqft &middot; Traffic: {n.foot_traffic_score}</p>
                  <p>Asian Dining: {n.asian_dining_score} &middot; Competitors: {n.competitor_count}</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="flex items-center justify-between bg-white px-4 py-2 text-xs text-gray-500">
        <span>Circle size = Asian dining demand &middot; Opacity = rent level</span>
        <span>Hover for details</span>
      </div>
    </div>
  );
}
