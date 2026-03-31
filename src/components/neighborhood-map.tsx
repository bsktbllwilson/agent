"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Neighborhood } from "@/lib/types";
import { Search, MapPin, X } from "lucide-react";

type NeighborhoodData = Omit<Neighborhood, "id">;

interface MapProps {
  neighborhoods: NeighborhoodData[];
}

interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestNeighborhoods(
  lat: number,
  lng: number,
  neighborhoods: NeighborhoodData[],
  count = 3
) {
  return neighborhoods
    .map((n) => ({
      ...n,
      distance: haversine(lat, lng, n.lat, n.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

function interpolateScore(
  nearby: { distance: number; foot_traffic_score: number; asian_dining_score: number; avg_rent_sqft: number; competitor_count: number }[]
) {
  const totalWeight = nearby.reduce((s, n) => s + 1 / (n.distance + 0.01), 0);
  const weighted = (key: keyof typeof nearby[0]) =>
    Math.round(
      nearby.reduce((s, n) => s + (n[key] as number) / (n.distance + 0.01), 0) / totalWeight
    );
  return {
    foot_traffic_score: weighted("foot_traffic_score"),
    asian_dining_score: weighted("asian_dining_score"),
    avg_rent_sqft: weighted("avg_rent_sqft"),
    competitor_count: weighted("competitor_count"),
  };
}

function ScoreBar({ label, value, max = 100, color = "bg-terracotta" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{value}{max === 100 ? "/100" : ""}</span>
      </div>
      <div className="mt-1 h-2.5 rounded-full bg-sand-200">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function NeighborhoodMap({ neighborhoods }: MapProps) {
  const [leafletMod, setLeafletMod] = useState<any>(null);
  const [leafletCore, setLeafletCore] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<GeoResult | null>(null);
  const [selectedData, setSelectedData] = useState<ReturnType<typeof interpolateScore> | null>(null);
  const [nearbyList, setNearbyList] = useState<(NeighborhoodData & { distance: number })[]>([]);
  const [error, setError] = useState("");
  const mapRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      // @ts-ignore — CSS import for side effects
      import("leaflet/dist/leaflet.css"),
    ]).then(([rl, L]) => {
      setLeafletMod(rl);
      setLeafletCore(L.default || L);
      setReady(true);
    });
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!query.trim()) return;
      setSearching(true);
      setError("");
      setSearchResult(null);
      setSelectedData(null);

      try {
        const searchQuery = query.toLowerCase().includes("nyc") || query.toLowerCase().includes("new york")
          ? query
          : `${query}, New York City, NY`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=us`
        );
        const data = await res.json();
        if (!data.length) {
          setError("Address not found. Try a more specific NYC address.");
          setSearching(false);
          return;
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        setSearchResult({ lat, lng, displayName });

        const nearby = findNearestNeighborhoods(lat, lng, neighborhoods);
        setNearbyList(nearby);
        setSelectedData(interpolateScore(nearby));

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
        }
      } catch {
        setError("Search failed. Please try again.");
      } finally {
        setSearching(false);
      }
    },
    [query, neighborhoods]
  );

  const clearSearch = () => {
    setSearchResult(null);
    setSelectedData(null);
    setNearbyList([]);
    setQuery("");
    setError("");
    if (mapRef.current) {
      mapRef.current.flyTo([40.735, -73.96], 11, { duration: 1 });
    }
  };

  if (!ready || !leafletMod || !leafletCore) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-sand-200 bg-sand-50">
        <p className="text-sm text-gray-400">Loading map...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip: LTooltip, Marker, Popup, useMap } = leafletMod;
  const maxRent = Math.max(...neighborhoods.map((n) => n.avg_rent_sqft));

  function MapRef() {
    const map = useMap();
    mapRef.current = map;
    return null;
  }

  function SearchMarker({ position, displayName }: { position: [number, number]; displayName: string }) {
    const icon = useMemo(() => {
      if (!leafletCore) return undefined;
      return leafletCore.divIcon({
        className: "custom-search-marker",
        html: `<div style="background:#D85A30;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });
    }, [leafletCore]);
    return (
      <Marker position={position} icon={icon}>
        <Popup>
          <p className="text-xs font-medium">{displayName.split(",").slice(0, 2).join(",")}</p>
        </Popup>
      </Marker>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any NYC address (e.g. 123 Main St, Flushing)"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
        {searchResult && (
          <Button type="button" variant="ghost" size="icon" onClick={clearSearch}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className={`overflow-hidden rounded-lg border border-sand-200 ${selectedData ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <MapContainer
            center={[40.735, -73.96]}
            zoom={11}
            style={{ height: "550px", width: "100%" }}
            scrollWheelZoom={true}
          >
            <MapRef />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {neighborhoods.map((n) => {
              const isNearby = nearbyList.some((nb) => nb.name === n.name);
              const radius = 8 + (n.asian_dining_score / 100) * 20;
              const opacity = isNearby ? 0.85 : 0.4 + (n.avg_rent_sqft / maxRent) * 0.5;
              return (
                <CircleMarker
                  key={n.name}
                  center={[n.lat, n.lng]}
                  radius={radius}
                  pathOptions={{
                    color: isNearby ? "#1A1A1A" : "#D85A30",
                    fillColor: "#D85A30",
                    fillOpacity: opacity,
                    weight: isNearby ? 3 : 2,
                  }}
                >
                  <LTooltip direction="top" offset={[0, -10]}>
                    <div className="text-xs">
                      <p className="font-semibold">{n.name}</p>
                      <p>${n.avg_rent_sqft}/sqft &middot; Traffic: {n.foot_traffic_score}</p>
                      <p>Asian Dining: {n.asian_dining_score} &middot; Competitors: {n.competitor_count}</p>
                    </div>
                  </LTooltip>
                </CircleMarker>
              );
            })}
            {searchResult && (
              <SearchMarker
                position={[searchResult.lat, searchResult.lng]}
                displayName={searchResult.displayName}
              />
            )}
          </MapContainer>
          <div className="flex items-center justify-between bg-white px-4 py-2 text-xs text-gray-500">
            <span>Circle size = Asian dining demand &middot; Opacity = rent level</span>
            <span>Click + scroll to zoom</span>
          </div>
        </div>

        {/* Score Panel */}
        {selectedData && (
          <Card className="flex flex-col justify-between lg:col-span-1">
            <div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <p className="font-display text-lg font-semibold">Location Report</p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-snug">
                    {searchResult?.displayName.split(",").slice(0, 3).join(",")}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <ScoreBar label="Foot Traffic" value={selectedData.foot_traffic_score} />
                <ScoreBar label="Asian Dining Demand" value={selectedData.asian_dining_score} />
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Est. Rent</span>
                    <span className="text-gray-500">${selectedData.avg_rent_sqft}/sqft/yr</span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-sand-200">
                    <div
                      className="h-2.5 rounded-full bg-terracotta"
                      style={{ width: `${Math.min((selectedData.avg_rent_sqft / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Nearby Competitors</span>
                    <span className="text-gray-500">~{selectedData.competitor_count}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-sand-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Nearest Neighborhoods
              </p>
              <div className="mt-2 space-y-2">
                {nearbyList.map((n) => (
                  <div key={n.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{n.name}</span>
                    <span className="text-xs text-gray-400">{n.distance.toFixed(1)} mi</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-gray-400">
                Scores interpolated from 3 nearest tracked neighborhoods.
                Data: MTA ridership, DOHMH, REBNY.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
