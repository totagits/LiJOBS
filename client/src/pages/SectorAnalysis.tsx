import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  Building2, 
  Briefcase, 
  Users,
  Clock,
  Database,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const SECTOR_CONFIG: Record<string, { color: string; icon: typeof Building2; description: string }> = {
  private: { color: "#3b82f6", icon: Building2, description: "Businesses, enterprises, and commercial organizations" },
  public: { color: "#22c55e", icon: Building2, description: "Government ministries, agencies, and public institutions" },
  ngo: { color: "#f59e0b", icon: Users, description: "Non-governmental organizations and development projects" },
  informal: { color: "#8b5cf6", icon: Briefcase, description: "Unregistered businesses, self-employment, and casual work" },
  seasonal: { color: "#ef4444", icon: Clock, description: "Agricultural, fishing, and time-bound employment" },
};

const SECTOR_LABELS: Record<string, string> = {
  private: "Private",
  public: "Public",
  ngo: "NGO/Projects",
  informal: "Informal",
  seasonal: "Seasonal",
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Database className="w-16 h-16 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No data yet</h3>
      <p className="text-muted-foreground max-w-md">
        Sector analysis will appear here once employment spells are recorded in the system. 
        All statistics are calculated from real records entered into the platform.
      </p>
    </div>
  );
}

export default function SectorAnalysis() {
  const [selectedSector, setSelectedSector] = useState("private");

  const { data, isLoading, refetch, isFetching } = useQuery<{
    sectorBreakdown: { sector: string; count: number; color: string }[];
    contractTypes: { type: string; count: number }[];
    countyBreakdown: { county: string; count: number }[];
    verificationBreakdown: { status: string; count: number }[];
    formalityBreakdown: { formality: string; count: number }[];
  }>({
    queryKey: ["/api/national-statistics"],
  });

  const sectorData = data?.sectorBreakdown || [];
  const contractData = data?.contractTypes || [];
  const totalJobs = sectorData.reduce((sum, s) => sum + s.count, 0);
  const hasData = totalJobs > 0;

  const sectorCards = Object.entries(SECTOR_CONFIG).map(([key, config]) => {
    const found = sectorData.find(s => s.sector === key);
    return {
      key,
      label: SECTOR_LABELS[key] || key,
      count: found?.count || 0,
      color: config.color,
      icon: config.icon,
      description: config.description,
    };
  });

  const selectedConfig = SECTOR_CONFIG[selectedSector];
  const selectedCard = sectorCards.find(s => s.key === selectedSector);

  const pieData = sectorCards.filter(s => s.count > 0).map(s => ({
    name: s.label,
    value: s.count,
    color: s.color,
  }));

  const contractPieData = contractData.filter(c => c.count > 0).map((c, i) => ({
    name: c.type || "Unknown",
    value: c.count,
    color: ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"][i % 6],
  }));

  const formalCount = (sectorData.find(s => s.sector === "private")?.count || 0) + 
                      (sectorData.find(s => s.sector === "public")?.count || 0);
  const informalCount = sectorData.find(s => s.sector === "informal")?.count || 0;
  const projectCount = (sectorData.find(s => s.sector === "ngo")?.count || 0) + 
                       (sectorData.find(s => s.sector === "seasonal")?.count || 0);

  return (
    <div className="min-h-screen" data-testid="sector-analysis-page">
      <Header />
      <main className="pt-24">
        <section className="relative py-16 bg-primary text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <BackButton />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4">Data Portal</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-sector-analysis-title">
                Sector Analysis
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                In-depth analysis of Liberia's 5 employment sectors: Private, Public, NGO/Projects, 
                Informal, and Seasonal. All data is calculated from real records in the system.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Sector Overview</h2>
                <p className="text-muted-foreground">
                  {hasData 
                    ? `${totalJobs.toLocaleString()} total employment spells across all sectors`
                    : "Based on real employment records entered into the system"
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                disabled={isFetching}
                data-testid="button-refresh-sectors"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <SectionLoadingSpinner />
            ) : !hasData ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
                  {sectorCards.map((sector, index) => (
                    <motion.div
                      key={sector.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover-elevate ${
                          selectedSector === sector.key ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedSector(sector.key)}
                        data-testid={`card-sector-${sector.key}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: sector.color + "20" }}
                            >
                              <sector.icon className="w-5 h-5" style={{ color: sector.color }} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {totalJobs > 0 ? `${((sector.count / totalJobs) * 100).toFixed(1)}%` : "—"}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{sector.label}</h3>
                          <p className="text-2xl font-bold mb-1" data-testid={`text-sector-count-${sector.key}`}>
                            {sector.count.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">employment spells</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-12">
                  <div className="lg:col-span-2">
                    <Card className="p-6" data-testid="chart-sector-bar">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle>Employment by Sector</CardTitle>
                        <CardDescription>Number of employment spells per sector from system records</CardDescription>
                      </CardHeader>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sectorCards.map(s => ({ name: s.label, count: s.count, fill: s.color }))}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => [value.toLocaleString(), "Spells"]}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {sectorCards.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <Card className="p-6 h-full" data-testid="chart-sector-distribution">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle>Sector Distribution</CardTitle>
                        <CardDescription>Share of total employment</CardDescription>
                      </CardHeader>
                      {pieData.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), "Spells"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          No sector data available
                        </div>
                      )}
                    </Card>
                  </div>
                </div>

                <motion.div
                  key={selectedSector}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 mb-8" style={{ borderColor: selectedConfig?.color + "40" }}>
                    <CardHeader className="p-0 mb-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: selectedConfig?.color + "20" }}
                        >
                          {selectedConfig && <selectedConfig.icon className="w-6 h-6" style={{ color: selectedConfig.color }} />}
                        </div>
                        <div>
                          <CardTitle>{selectedCard?.label} Sector</CardTitle>
                          <CardDescription>{selectedConfig?.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <Tabs defaultValue="stats" className="space-y-4">
                      <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0" data-testid="sector-detail-tabs">
                        <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-sector-stats">
                          Key Statistics
                        </TabsTrigger>
                        {contractPieData.length > 0 && (
                          <TabsTrigger value="contracts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-sector-contracts">
                            Contract Types
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="stats">
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-2xl font-bold">{selectedCard?.count.toLocaleString() || "0"}</p>
                            <p className="text-sm text-muted-foreground">Employment Spells</p>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <Building2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-2xl font-bold">
                              {totalJobs > 0 ? `${((selectedCard?.count || 0) / totalJobs * 100).toFixed(1)}%` : "—"}
                            </p>
                            <p className="text-sm text-muted-foreground">Share of Total</p>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <Briefcase className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-2xl font-bold">{totalJobs.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total Across All Sectors</p>
                          </div>
                        </div>
                      </TabsContent>

                      {contractPieData.length > 0 && (
                        <TabsContent value="contracts">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={contractPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, value }) => `${name}: ${value}`}
                                  >
                                    {contractPieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [value.toLocaleString(), "Spells"]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                              {contractPieData.map((contract, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: contract.color }} />
                                    <span className="font-medium">{contract.name}</span>
                                  </div>
                                  <span className="font-bold">{contract.value.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </Card>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Formal Employment</h3>
                        <p className="text-sm text-muted-foreground">Private + Public</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-2" data-testid="text-formal-count">
                      {formalCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalJobs > 0 
                        ? `${((formalCount / totalJobs) * 100).toFixed(1)}% of total employment is in the formal sector.`
                        : "Formal sector employment spells."}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Informal Economy</h3>
                        <p className="text-sm text-muted-foreground">Informal sector</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-2" data-testid="text-informal-count">
                      {informalCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalJobs > 0 
                        ? `${((informalCount / totalJobs) * 100).toFixed(1)}% of employment is in the informal sector.`
                        : "Informal sector employment spells."}
                    </p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Project-Based</h3>
                        <p className="text-sm text-muted-foreground">NGO + Seasonal</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-2" data-testid="text-project-count">
                      {projectCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalJobs > 0 
                        ? `${((projectCount / totalJobs) * 100).toFixed(1)}% of employment is time-bound or project-based.`
                        : "Time-bound and project-based employment spells."}
                    </p>
                  </Card>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}