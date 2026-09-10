import { useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
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
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronDown, ChevronUp, X, TrendingUp, Users, Briefcase, FileText, Building2 } from "lucide-react";
import type { MonthlyData, SectorData, CountyData } from "@shared/schema";

// Demographics data placeholder - calculated from employment_spells when data available
const genderData = [
  { name: "Male", value: 0, color: "#3b82f6" },
  { name: "Female", value: 0, color: "#ec4899" },
];

// Age distribution placeholder - calculated from employment_spells when data available
const ageData = [
  { age: "15-24", male: 0, female: 0 },
  { age: "25-34", male: 0, female: 0 },
  { age: "35-44", male: 0, female: 0 },
  { age: "45-54", male: 0, female: 0 },
  { age: "55+", male: 0, female: 0 },
];

// Contract types placeholder - calculated from employment_spells when data available
const contractData = [
  { name: "Permanent", value: 0, color: "#22c55e" },
  { name: "Fixed-term", value: 0, color: "#3b82f6" },
  { name: "Seasonal", value: 0, color: "#f59e0b" },
  { name: "Casual", value: 0, color: "#8b5cf6" },
];

// Industry data placeholder - calculated from employment_spells when data available
const industryData = [
  { industry: "Agriculture & Forestry", jobs: 0, color: "#22c55e" },
  { industry: "Retail & Trade", jobs: 0, color: "#3b82f6" },
  { industry: "Construction", jobs: 0, color: "#f59e0b" },
  { industry: "Education", jobs: 0, color: "#8b5cf6" },
  { industry: "Healthcare", jobs: 0, color: "#ef4444" },
  { industry: "Transportation", jobs: 0, color: "#06b6d4" },
  { industry: "Manufacturing", jobs: 0, color: "#ec4899" },
  { industry: "Mining & Extractives", jobs: 0, color: "#84cc16" },
  { industry: "Finance & Banking", jobs: 0, color: "#14b8a6" },
  { industry: "Technology", jobs: 0, color: "#6366f1" },
];

const countyColors: Record<string, string> = {
  "Montserrado": "#3b82f6",
  "Nimba": "#22c55e",
  "Bong": "#f59e0b",
  "Grand Bassa": "#8b5cf6",
  "Margibi": "#ef4444",
  "Lofa": "#06b6d4",
  "Grand Cape Mount": "#ec4899",
  "Sinoe": "#84cc16",
  "Grand Gedeh": "#14b8a6",
  "Maryland": "#6366f1",
  "Bomi": "#a855f7",
  "River Cess": "#f97316",
  "Gbarpolu": "#0ea5e9",
  "River Gee": "#10b981",
  "Grand Kru": "#6b7280",
};

const getCountyIndustryData = (_county: string) => {
  // Industry data by county not yet collected - returning empty placeholder
  return industryData.map(ind => ({
    ...ind,
    jobs: 0,
  }));
};

const getCountyTrendsData = (_county: string) => {
  // Trends data by county not yet collected - returning empty placeholder
  return [
    { month: "Jan", formal: 0, informal: 0 },
    { month: "Feb", formal: 0, informal: 0 },
    { month: "Mar", formal: 0, informal: 0 },
    { month: "Apr", formal: 0, informal: 0 },
    { month: "May", formal: 0, informal: 0 },
    { month: "Jun", formal: 0, informal: 0 },
  ];
};

const getCountyDemographics = (_county: string) => {
  // Demographics data by county not yet collected - returning empty placeholder
  return [
    { name: "Male", value: 0, color: "#3b82f6" },
    { name: "Female", value: 0, color: "#ec4899" },
  ];
};

const getCountyContracts = (_county: string) => {
  // Contract type data by county not yet collected - returning empty placeholder
  return [
    { name: "Permanent", value: 0, color: "#22c55e" },
    { name: "Fixed-term", value: 0, color: "#3b82f6" },
    { name: "Seasonal", value: 0, color: "#f59e0b" },
    { name: "Casual", value: 0, color: "#8b5cf6" },
  ];
};

function CountyDetailView({ county, onClose }: { county: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("trends");
  
  // Fetch real county sector data from API using default fetcher
  const { data: sectorData = [], isLoading: loadingSectors, isError: sectorError } = useQuery<SectorData[]>({
    queryKey: [`/api/counties/${encodeURIComponent(county)}/sectors`],
  });
  
  const indData = getCountyIndustryData(county);
  const trendsData = getCountyTrendsData(county);
  const demographics = getCountyDemographics(county);
  const contracts = getCountyContracts(county);
  const countyColor = countyColors[county] || "#6b7280";
  const countySlug = county.toLowerCase().replace(/\s/g, '-');
  const totalCountyJobs = sectorData.reduce((sum, s) => sum + s.jobs, 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4"
      id={`county-panel-${countySlug}`}
      role="region"
      aria-label={`${county} County detailed analytics`}
    >
      <Card className="p-6 border-2 border-primary/20" data-testid={`county-detail-${countySlug}`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: countyColor + "20" }}>
              <MapPin className="w-5 h-5" style={{ color: countyColor }} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{county} County</h3>
              <p className="text-sm text-muted-foreground">{totalCountyJobs.toLocaleString()} Total Jobs</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            data-testid={`button-close-county-${countySlug}`}
            aria-label={`Close ${county} County details`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap justify-start gap-2 bg-muted/50 p-1 h-auto" data-testid={`county-tabs-${countySlug}`}>
            <TabsTrigger value="trends" className="flex items-center gap-1.5 text-xs" data-testid="county-tab-trends">
              <TrendingUp className="w-3.5 h-3.5" /> Trends
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-1.5 text-xs" data-testid="county-tab-sectors">
              <Building2 className="w-3.5 h-3.5" /> Sector
            </TabsTrigger>
            <TabsTrigger value="industries" className="flex items-center gap-1.5 text-xs" data-testid="county-tab-industries">
              <Briefcase className="w-3.5 h-3.5" /> Industry
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-1.5 text-xs" data-testid="county-tab-demographics">
              <Users className="w-3.5 h-3.5" /> Demographics
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-1.5 text-xs" data-testid="county-tab-contracts">
              <FileText className="w-3.5 h-3.5" /> Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData}>
                  <defs>
                    <linearGradient id={`gradientFormal-${county}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(215, 79%, 34%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(215, 79%, 34%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={`gradientInformal-${county}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(355, 78%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(355, 78%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), ""]}
                  />
                  <Area type="monotone" dataKey="formal" stackId="1" stroke="hsl(215, 79%, 34%)" fill={`url(#gradientFormal-${county})`} strokeWidth={2} />
                  <Area type="monotone" dataKey="informal" stackId="1" stroke="hsl(355, 78%, 45%)" fill={`url(#gradientInformal-${county})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sectors">
            <div className="h-[280px]">
              {loadingSectors ? (
                <div className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : sectorError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Briefcase className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">Unable to Load Data</p>
                  <p className="text-sm mt-1 text-center">Could not fetch sector data for {county} County.</p>
                </div>
              ) : totalCountyJobs === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Briefcase className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No Employment Data</p>
                  <p className="text-sm mt-1 text-center">No jobs reported in {county} County yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="jobs"
                      nameKey="sector"
                      label={({ sector, percent }) => `${sector}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value.toLocaleString() + " jobs", ""]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="industries">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="industry" className="text-xs" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value.toLocaleString() + " jobs", ""]}
                  />
                  <Bar dataKey="jobs" radius={[0, 4, 4, 0]}>
                    {indData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="demographics">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {demographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contracts}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {contracts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}

export function ChartsSection() {
  const [expandedCounty, setExpandedCounty] = useState<string | null>(null);

  const { data: monthlyData, isLoading: loadingMonthly } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const { data: sectorData, isLoading: loadingSectors } = useQuery<SectorData[]>({
    queryKey: ["/api/sectors"],
  });
  
  const { data: countyData = [], isLoading: loadingCounties, isError: countiesError } = useQuery<CountyData[]>({
    queryKey: ["/api/counties"],
  });

  const totalJobs = sectorData?.reduce((sum, s) => sum + s.jobs, 0) || 0;
  const totalCountyJobs = countyData.reduce((sum, c) => sum + c.jobs, 0);

  const handleCountyClick = (county: string) => {
    setExpandedCounty(expandedCounty === county ? null : county);
  };

  return (
    <section
      id="analytics"
      className="py-20"
      data-testid="charts-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Data Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-charts-title">
            Employment Insights Dashboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive visualizations of Liberia's employment landscape with real-time data updates
          </p>
        </motion.div>

        <Tabs defaultValue="trends" className="space-y-8">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-0" data-testid="chart-tabs">
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-trends"
            >
              Job Trends
            </TabsTrigger>
            <TabsTrigger
              value="counties"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-counties"
            >
              By County
            </TabsTrigger>
            <TabsTrigger
              value="sectors"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-sectors"
            >
              By Sector
            </TabsTrigger>
            <TabsTrigger
              value="industries"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-industries"
            >
              By Industry
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-demographics"
            >
              Demographics
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-contracts"
            >
              Contract Types
            </TabsTrigger>
          </TabsList>

          {/* Counties Tab */}
          <TabsContent value="counties">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6" data-testid="chart-counties">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Jobs by County</h3>
                    <p className="text-sm text-muted-foreground">Click any county to view detailed analytics</p>
                  </div>
                  <Badge variant="secondary">{totalCountyJobs.toLocaleString()} Total Jobs</Badge>
                </div>

                {loadingCounties ? (
                  <div className="flex items-center justify-center h-48">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : countiesError ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <MapPin className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-medium">Unable to Load Data</p>
                    <p className="text-sm mt-1">Could not fetch county data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {countyData.map((county) => {
                      const countySlug = county.name.toLowerCase().replace(/\s/g, '-');
                      const isExpanded = expandedCounty === county.name;
                      const displayColor = countyColors[county.name] || "#6b7280";
                      return (
                      <div key={county.id}>
                        <button
                          onClick={() => handleCountyClick(county.name)}
                          className={`w-full p-4 rounded-lg border transition-all hover-elevate text-left ${
                            isExpanded
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card"
                          }`}
                          data-testid={`button-county-${countySlug}`}
                          aria-expanded={isExpanded}
                          aria-controls={`county-panel-${countySlug}`}
                          aria-label={`${county.name} County - ${county.jobs.toLocaleString()} jobs. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: displayColor + "20" }}
                              >
                                <MapPin className="w-4 h-4" style={{ color: displayColor }} aria-hidden="true" />
                              </div>
                              <div>
                                <p className="font-medium">{county.name}</p>
                                <p className="text-sm text-muted-foreground">{county.jobs.toLocaleString()} jobs</p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-primary" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedCounty === county.name && (
                            <CountyDetailView
                              county={county.name}
                              onClose={() => setExpandedCounty(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );})}
                  </div>
                )}
              </Card>
            </motion.div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6" data-testid="chart-trends">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Monthly Job Creation</h3>
                    <p className="text-sm text-muted-foreground">Formal vs Informal employment trends</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">Formal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="text-sm text-muted-foreground">Informal</span>
                    </div>
                  </div>
                </div>
                <div className="h-[400px]">
                  {loadingMonthly ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="gradientFormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(215, 79%, 34%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(215, 79%, 34%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradientInformal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(355, 78%, 45%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(355, 78%, 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value.toLocaleString(), ""]}
                        />
                        <Area
                          type="monotone"
                          dataKey="formal"
                          stackId="1"
                          stroke="hsl(215, 79%, 34%)"
                          fill="url(#gradientFormal)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="informal"
                          stackId="1"
                          stroke="hsl(355, 78%, 45%)"
                          fill="url(#gradientInformal)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Sectors Tab - Now with Pie Chart */}
          <TabsContent value="sectors">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6" data-testid="chart-sectors">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Jobs by Employment Sector</h3>
                    <p className="text-sm text-muted-foreground">Distribution across LiJOBS 5 sectors</p>
                  </div>
                  <Badge variant="secondary">{totalJobs.toLocaleString()} Total Jobs</Badge>
                </div>
                <div className="h-[400px]">
                  {loadingSectors ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : totalJobs === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Briefcase className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No Employment Data Yet</p>
                      <p className="text-sm mt-2 text-center max-w-md">
                        Employment records will appear here once employers and enumerators begin reporting jobs to the system.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="jobs"
                          nameKey="sector"
                          label={({ sector, percent }) => `${sector}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sectorData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [value.toLocaleString() + " jobs", ""]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Industries Tab - Horizontal Bar Chart */}
          <TabsContent value="industries">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6" data-testid="chart-industries">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Jobs by Industry</h3>
                    <p className="text-sm text-muted-foreground">Distribution across economic activities</p>
                  </div>
                  <Badge variant="secondary">{industryData.reduce((sum, i) => sum + i.jobs, 0).toLocaleString()} Total Jobs</Badge>
                </div>
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="industry" className="text-xs" width={140} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value.toLocaleString() + " jobs", ""]}
                      />
                      <Bar dataKey="jobs" radius={[0, 4, 4, 0]}>
                        {industryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card className="p-6" data-testid="chart-gender">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Gender Distribution</h3>
                  <p className="text-sm text-muted-foreground">Employment by gender</p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6" data-testid="chart-age">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Age Distribution</h3>
                  <p className="text-sm text-muted-foreground">Employment by age group (%)</p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="age" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                      <Legend />
                      <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="female" name="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-6" data-testid="chart-contracts">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Contract Type Distribution</h3>
                    <p className="text-sm text-muted-foreground">Employment by contract type</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contractData}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {contractData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
