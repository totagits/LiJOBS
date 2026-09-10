import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Users, Briefcase, TrendingUp, Search, Map, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { CountyData } from "@shared/schema";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type County = CountyData;

const countyCoordinates: Record<string, [number, number]> = {
  "montserrado": [6.45, -10.65],
  "nimba": [7.15, -8.55],
  "bong": [7.0, -9.45],
  "lofa": [8.0, -9.9],
  "grand-bassa": [6.1, -9.8],
  "margibi": [6.35, -10.25],
  "grand-cape-mount": [7.1, -11.1],
  "bomi": [6.65, -10.75],
  "grand-gedeh": [6.3, -8.2],
  "sinoe": [5.4, -8.8],
  "river-cess": [5.7, -9.3],
  "gbarpolu": [7.4, -10.4],
  "maryland": [4.7, -7.7],
  "grand-kru": [4.9, -8.3],
  "river-gee": [5.5, -7.9],
};

function getColorByJobs(jobs: number, maxJobs: number): string {
  if (maxJobs === 0) return "#94a3b8";
  const ratio = jobs / maxJobs;
  if (ratio > 0.6) return "#003366";
  if (ratio > 0.4) return "#1a5490";
  if (ratio > 0.2) return "#3b82f6";
  if (ratio > 0.1) return "#60a5fa";
  if (ratio > 0) return "#93c5fd";
  return "#cbd5e1";
}

function getRadiusByJobs(jobs: number, maxJobs: number): number {
  if (maxJobs === 0) return 12;
  const ratio = jobs / maxJobs;
  return Math.max(10, Math.min(25, 10 + ratio * 15));
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function CountyMap() {
  const { data: counties, isLoading } = useQuery<County[]>({
    queryKey: ["/api/counties"],
  });

  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showChoropleth, setShowChoropleth] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.5, -9.5]);
  const [mapZoom, setMapZoom] = useState(7);

  const totalJobs = counties?.reduce((sum, c) => sum + c.jobs, 0) || 0;
  const totalEmployers = counties?.reduce((sum, c) => sum + c.employers, 0) || 0;
  const maxJobs = counties?.reduce((max, c) => Math.max(max, c.jobs), 0) || 0;

  const rankedCounties = useMemo(() => {
    if (!counties) return [];
    return [...counties]
      .sort((a, b) => b.jobs - a.jobs)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [counties]);

  const highestJobsCounty = rankedCounties[0];
  const lowestJobsCounty = rankedCounties[rankedCounties.length - 1];

  const filteredCounties = useMemo(() => {
    if (!searchTerm) return rankedCounties;
    return rankedCounties.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rankedCounties, searchTerm]);

  const getCountyRank = (countyId: string) => {
    const county = rankedCounties.find(c => c.id === countyId);
    return county ? county.rank : 0;
  };

  useEffect(() => {
    if (!selectedCounty && counties && counties.length > 0) {
      setSelectedCounty(counties[0]);
    }
  }, [counties, selectedCounty]);

  const handleCountyClick = (county: County) => {
    setSelectedCounty(county);
    const coords = countyCoordinates[county.id];
    if (coords) {
      setMapCenter(coords);
      setMapZoom(9);
    }
  };

  const handleMarkerClick = (county: County) => {
    setSelectedCounty(county);
  };

  const legendItems = [
    { color: "#003366", label: "> 60%" },
    { color: "#1a5490", label: "40-60%" },
    { color: "#3b82f6", label: "20-40%" },
    { color: "#60a5fa", label: "10-20%" },
    { color: "#93c5fd", label: "1-10%" },
    { color: "#cbd5e1", label: "0%" },
  ];

  return (
    <section
      id="counties"
      className="py-20"
      data-testid="county-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Geographic Coverage
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-county-title">
            Employment Across All Counties
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Complete coverage of Liberia's 15 counties with detailed district-level employment data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{totalJobs.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Jobs</p>
                <p className="text-lg font-bold">
                  {totalJobs > 0 && highestJobsCounty ? highestJobsCounty.name : "No data yet"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lowest Jobs</p>
                <p className="text-lg font-bold">
                  {totalJobs > 0 && lowestJobsCounty ? lowestJobsCounty.name : "No data yet"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-4"
          >
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search county..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                      data-testid="input-county-search"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-choropleth"
                      checked={showChoropleth}
                      onCheckedChange={setShowChoropleth}
                    />
                    <Label htmlFor="show-choropleth" className="text-sm flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Heat Map
                    </Label>
                  </div>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border" style={{ height: "400px" }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {counties?.map((county) => {
                    const coords = countyCoordinates[county.id];
                    if (!coords) return null;
                    const isSelected = selectedCounty?.id === county.id;
                    const percent = totalJobs > 0 ? ((county.jobs / totalJobs) * 100).toFixed(1) : "0.0";
                    
                    return (
                      <CircleMarker
                        key={county.id}
                        center={coords}
                        radius={showChoropleth ? getRadiusByJobs(county.jobs, maxJobs) : 12}
                        pathOptions={{
                          fillColor: showChoropleth ? getColorByJobs(county.jobs, maxJobs) : "#3b82f6",
                          fillOpacity: 0.85,
                          color: isSelected ? "#003366" : "#ffffff",
                          weight: isSelected ? 3 : 2,
                        }}
                        eventHandlers={{
                          click: () => handleMarkerClick(county),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                          <div className="text-center">
                            <strong>{county.name}</strong><br/>
                            {county.jobs > 0 ? (
                              <>
                                <span>Jobs: {county.jobs.toLocaleString()}</span><br/>
                                <span>Share: {percent}%</span>
                              </>
                            ) : (
                              <span className="text-gray-500">No job data yet</span>
                            )}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {showChoropleth && (
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg z-[1000]">
                    <p className="text-xs font-semibold mb-2">Jobs Distribution</p>
                    <div className="space-y-1">
                      {legendItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-4 right-4 z-[1000]"
                  onClick={() => {
                    setMapCenter([6.5, -9.5]);
                    setMapZoom(7);
                  }}
                  data-testid="button-reset-map"
                >
                  <Map className="w-4 h-4 mr-1" /> Reset View
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Counties Overview
                </h3>
                <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{totalJobs.toLocaleString()} total jobs</span>
                  <span>{totalEmployers.toLocaleString()} employers</span>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <div key={index} className="p-3 rounded-lg border animate-pulse">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <div className="w-20 h-4 rounded bg-muted" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-3 rounded bg-muted" />
                        <div className="w-10 h-3 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredCounties.map((county) => (
                    <button
                      key={county.id}
                      onClick={() => handleCountyClick(county)}
                      className={`p-3 rounded-lg border text-left transition-all duration-200 hover-elevate ${
                        selectedCounty?.id === county.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      data-testid={`county-button-${county.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${county.color}`} />
                          <span className="font-medium text-sm">{county.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">#{county.rank}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{county.jobs.toLocaleString()} jobs</span>
                        <span>
                          {totalJobs > 0 ? ((county.jobs / totalJobs) * 100).toFixed(1) : "0.0"}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {selectedCounty && (
              <Card className="p-6 sticky top-24" data-testid="county-details">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-lg ${selectedCounty.color} flex items-center justify-center`}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCounty.name}</h3>
                    <p className="text-sm text-muted-foreground">County Profile</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm">Total Jobs</span>
                      </div>
                      <Badge variant="secondary">Rank #{getCountyRank(selectedCounty.id)}</Badge>
                    </div>
                    <p className="text-2xl font-bold" data-testid="county-jobs">
                      {selectedCounty.jobs.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Registered Employers</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="county-employers">
                      {selectedCounty.employers.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Growth Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600" data-testid="county-growth">
                      +{selectedCounty.growth}%
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Share of National Jobs</span>
                      <Badge variant="secondary">
                        {totalJobs > 0 ? ((selectedCounty.jobs / totalJobs) * 100).toFixed(1) : "0.0"}%
                      </Badge>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${selectedCounty.color} transition-all duration-500`}
                        style={{ width: `${totalJobs > 0 ? (selectedCounty.jobs / totalJobs) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                      Population: {selectedCounty.population?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-tooltip {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 8px 12px;
        }
      `}</style>
    </section>
  );
}
