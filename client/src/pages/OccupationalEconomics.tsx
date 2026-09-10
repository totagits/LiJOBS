import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell,
  PieChart, Pie, AreaChart, Area, ComposedChart, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, DollarSign, Users,
  AlertTriangle, GraduationCap, ShieldAlert, Target,
  ArrowUpRight, ArrowDownRight, BarChart3,
  MapPin, Skull, Flame, Download, BookOpen, Info,
  Calendar, Database, ArrowLeftRight, Activity, Briefcase,
  ChevronRight, GitCompare,
} from "lucide-react";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";

const COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const COLORS = [
  "#003893", "#CE1126", "#1B5E20", "#FF6F00", "#0277BD",
  "#6A1B9A", "#C62828", "#00695C", "#EF6C00", "#283593",
  "#2E7D32", "#AD1457", "#4527A0", "#00838F", "#D84315",
  "#37474F", "#880E4F", "#1A237E", "#004D40", "#BF360C"
];

function formatLRD(value: number) {
  if (value >= 1000000) return `L$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `L$${(value / 1000).toFixed(1)}K`;
  return `L$${value.toLocaleString()}`;
}

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface WageOccupation {
  iscoCode: string;
  title: string;
  avgSalary: number;
  medianSalary: number;
  p25Salary: number;
  p75Salary: number;
  minSalary: number;
  maxSalary: number;
  workers: number;
  byCounty: { county: string; avgSalary: number; medianSalary: number; workers: number }[];
}

interface WageData {
  occupations: WageOccupation[];
  totalWorkers: number;
  nationalAvg: number;
  nationalMedian: number;
  wageDistribution: { range: string; count: number }[];
  compareData: { county: string; occupations: WageOccupation[]; totalWorkers: number } | null;
  lastUpdated: string;
  dataSource: string;
  sampleNote: string;
}

interface DemandTrend {
  iscoCode: string;
  title: string;
  yearData: { year: number; count: number }[];
  totalSpells: number;
  growthRate: number;
  trend: string;
  countyBreakdown: { county: string; count: number }[];
}

interface DemandData {
  trends: DemandTrend[];
  years: number[];
  sectorTrends: { sector: string; yearData: { year: number; count: number }[]; total: number }[];
  summary: { totalOccupations: number; growing: number; stable: number; declining: number; totalSpells: number };
  lastUpdated: string;
}

interface SkillGap {
  skillId: number;
  skillName: string;
  category: string;
  supply: number;
  demand: number;
  gap: number;
  gapType: string;
  trainingOpportunity: boolean;
}

interface Projection {
  iscoCode?: string;
  sector?: string;
  title?: string;
  historical: { year: number; count: number }[];
  projected: { year: number; count: number };
  trend: string;
  confidence?: string;
}

interface InjuryRisk {
  sector: string;
  incidents: number;
  fatalities: number;
  injuries: number;
  workers: number;
  incidentRate: number;
  severityBreakdown: Record<string, number>;
  incidentTypes: { type: string; count: number }[];
}

function MetadataBanner({ lastUpdated, dataSource, sampleNote }: { lastUpdated?: string; dataSource?: string; sampleNote?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2 px-1" data-testid="metadata-banner">
      {lastUpdated && (
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last updated: {lastUpdated}
        </span>
      )}
      {dataSource && (
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          Source: {dataSource}
        </span>
      )}
      {sampleNote && (
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          {sampleNote}
        </span>
      )}
    </div>
  );
}

function WageTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3 max-w-xs">
      <p className="font-semibold text-sm mb-2">{d?.fullTitle || label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Average:</span>
        <span className="font-medium">{formatLRD(d?.avgSalary || 0)}</span>
        <span className="text-muted-foreground">Median:</span>
        <span className="font-medium">{formatLRD(d?.medianSalary || 0)}</span>
        <span className="text-muted-foreground">25th-75th:</span>
        <span className="font-medium">{formatLRD(d?.p25Salary || 0)} – {formatLRD(d?.p75Salary || 0)}</span>
        <span className="text-muted-foreground">Range:</span>
        <span className="font-medium">{formatLRD(d?.minSalary || 0)} – {formatLRD(d?.maxSalary || 0)}</span>
        <span className="text-muted-foreground">Workers (n):</span>
        <span className="font-medium">{d?.workers?.toLocaleString()}</span>
      </div>
      {d?.workers < 30 && (
        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Small sample — interpret with caution
        </p>
      )}
    </div>
  );
}

function MethodologyDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" data-testid="btn-methodology">
          <BookOpen className="w-4 h-4" /> Definitions & Methodology
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Definitions & Methodology
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm">
          <div>
            <h3 className="font-semibold text-base mb-2">Key Definitions</h3>
            <dl className="space-y-3">
              <div><dt className="font-medium text-primary">Worker / Employment Spell</dt>
              <dd className="text-muted-foreground mt-0.5">A time-bound record of employment with explicit start and end dates, linked to a verified employer. One person may have multiple spells.</dd></div>
              <div><dt className="font-medium text-primary">Average Salary</dt>
              <dd className="text-muted-foreground mt-0.5">Arithmetic mean of reported monthly salaries for active and completed employment spells within the selected filters.</dd></div>
              <div><dt className="font-medium text-primary">Median Salary</dt>
              <dd className="text-muted-foreground mt-0.5">The 50th percentile — half of workers earn above this, half below. More robust to outliers than the average.</dd></div>
              <div><dt className="font-medium text-primary">ISCO-08 Occupation Code</dt>
              <dd className="text-muted-foreground mt-0.5">International Standard Classification of Occupations, 2008 revision. Used to categorize jobs at a 1-digit major group level.</dd></div>
              <div><dt className="font-medium text-primary">Growth Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage change in employment spell creation between the first and last complete calendar year of data.</dd></div>
              <div><dt className="font-medium text-primary">Skills Gap</dt>
              <dd className="text-muted-foreground mt-0.5">Difference between employer demand (from vacancy postings) and worker supply (from job seeker profiles) for a given skill.</dd></div>
              <div><dt className="font-medium text-primary">Incident Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Number of workplace incidents per 100 workers in a given sector, calculated from reported incidents divided by total employment spells.</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Data Sources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Employment Spells:</strong> Verified records from the LiJOBS observatory — includes salary, occupation, sector, county, and contract type.</span></li>
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Vacancies:</strong> Employer-posted job openings with required skills and qualifications.</span></li>
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Workplace Incidents:</strong> Reported safety events with severity, type, and geographic data.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Methodology Notes</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Wage percentiles use linear interpolation between sorted salary observations.</li>
              <li>Employment projections use simple linear trend extrapolation from available years. Confidence levels: "moderate" (3+ years of data), "low" (fewer).</li>
              <li>Small sample warnings appear when n &lt; 30 observations.</li>
              <li>Informal sector coverage may be incomplete. Self-employment is not fully captured.</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== "object");
  const csv = [keys.join(","), ...data.map(row => keys.map(k => {
    const v = row[k];
    return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function OccupationalEconomics() {
  const [selectedTab, setSelectedTab] = useState("wages");
  const [wageCounty, setWageCounty] = useState("all");
  const [compareCounty, setCompareCounty] = useState("none");
  const [expandedOcc, setExpandedOcc] = useState<string | null>(null);
  const [wageSortBy, setWageSortBy] = useState<"avgSalary" | "medianSalary" | "workers">("avgSalary");
  const [demandView, setDemandView] = useState<"occupations" | "sectors">("occupations");

  const { data: wageData, isLoading: wageLoading } = useQuery<WageData>({
    queryKey: ["/api/occupational-economics/wage-by-occupation", wageCounty, compareCounty],
    queryFn: async () => {
      const params = new URLSearchParams({ county: wageCounty });
      if (compareCounty !== "none") params.set("compare", compareCounty);
      const res = await fetch(`/api/occupational-economics/wage-by-occupation?${params}`);
      return res.json();
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery<DemandData>({
    queryKey: ["/api/occupational-economics/demand-trends"],
  });

  const { data: skillsData, isLoading: skillsLoading } = useQuery<{ skills: SkillGap[]; summary: any }>({
    queryKey: ["/api/occupational-economics/skills-gap"],
  });

  const { data: projData, isLoading: projLoading } = useQuery<{ projectionYear: number; dataYears: number[]; sectorProjections: Projection[]; occupationProjections: Projection[]; disclaimer: string }>({
    queryKey: ["/api/occupational-economics/projections"],
  });

  const { data: injuryData, isLoading: injuryLoading } = useQuery<{ summary: { totalIncidents: number; totalFatalities: number; totalInjuries: number }; bySector: InjuryRisk[]; byCounty: { county: string; incidents: number; fatalities: number; injuries: number }[] }>({
    queryKey: ["/api/occupational-economics/injury-risk"],
  });

  const sortedWageOccupations = useMemo(() => {
    if (!wageData?.occupations) return [];
    return [...wageData.occupations].sort((a, b) => {
      if (wageSortBy === "workers") return b.workers - a.workers;
      return b[wageSortBy] - a[wageSortBy];
    });
  }, [wageData?.occupations, wageSortBy]);

  const severityPieData = useMemo(() => {
    if (!injuryData?.bySector) return [];
    const totals: Record<string, number> = {};
    injuryData.bySector.forEach(s => {
      Object.entries(s.severityBreakdown).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [injuryData]);

  const skillCategoryData = useMemo(() => {
    if (!skillsData?.skills) return [];
    const cats: Record<string, { shortage: number; surplus: number; balanced: number }> = {};
    skillsData.skills.forEach(s => {
      if (!cats[s.category]) cats[s.category] = { shortage: 0, surplus: 0, balanced: 0 };
      if (s.gapType === "shortage") cats[s.category].shortage++;
      else if (s.gapType === "surplus") cats[s.category].surplus++;
      else cats[s.category].balanced++;
    });
    return Object.entries(cats).map(([category, data]) => ({ category, ...data }));
  }, [skillsData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                    Occupational Economics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    National Labour Market Intelligence Portal — Republic of Liberia
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MethodologyDrawer />
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="btn-download"
                onClick={() => {
                  if (selectedTab === "wages" && wageData) downloadCSV(wageData.occupations.map(o => ({ occupation: o.title, iscoCode: o.iscoCode, avgSalary: o.avgSalary, medianSalary: o.medianSalary, minSalary: o.minSalary, maxSalary: o.maxSalary, workers: o.workers })), "wage_by_occupation.csv");
                  else if (selectedTab === "demand" && trendData) downloadCSV(trendData.trends.map(t => ({ occupation: t.title, iscoCode: t.iscoCode, totalSpells: t.totalSpells, growthRate: t.growthRate, trend: t.trend })), "demand_trends.csv");
                  else if (selectedTab === "skills" && skillsData) downloadCSV(skillsData.skills.map(s => ({ skill: s.skillName, category: s.category, supply: s.supply, demand: s.demand, gap: s.gap, type: s.gapType })), "skills_gap.csv");
                }}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Deep analytics on wages, demand, skills gaps, projections, and workplace safety across Liberia's occupations
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 h-12" data-testid="tabs-occupational">
            <TabsTrigger value="wages" data-testid="tab-wages" className="text-xs sm:text-sm gap-1.5">
              <DollarSign className="w-4 h-4 hidden sm:inline" /> Wages
            </TabsTrigger>
            <TabsTrigger value="demand" data-testid="tab-demand" className="text-xs sm:text-sm gap-1.5">
              <TrendingUp className="w-4 h-4 hidden sm:inline" /> Demand
            </TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills" className="text-xs sm:text-sm gap-1.5">
              <GraduationCap className="w-4 h-4 hidden sm:inline" /> Skills Gap
            </TabsTrigger>
            <TabsTrigger value="projections" data-testid="tab-projections" className="text-xs sm:text-sm gap-1.5">
              <Target className="w-4 h-4 hidden sm:inline" /> Projections
            </TabsTrigger>
            <TabsTrigger value="safety" data-testid="tab-safety" className="text-xs sm:text-sm gap-1.5">
              <ShieldAlert className="w-4 h-4 hidden sm:inline" /> Safety
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: WAGES ==================== */}
          <TabsContent value="wages">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Wage by Occupation
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={wageCounty} onValueChange={setWageCounty}>
                  <SelectTrigger className="w-[180px]" data-testid="select-wage-county">
                    <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={compareCounty} onValueChange={setCompareCounty}>
                  <SelectTrigger className="w-[180px]" data-testid="select-compare-county">
                    <GitCompare className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Compare with..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    {COUNTIES.filter(c => c !== wageCounty).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={wageSortBy} onValueChange={(v: any) => setWageSortBy(v)}>
                  <SelectTrigger className="w-[140px]" data-testid="select-wage-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avgSalary">Sort: Average</SelectItem>
                    <SelectItem value="medianSalary">Sort: Median</SelectItem>
                    <SelectItem value="workers">Sort: Workers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {wageLoading ? (
              <SectionLoadingSpinner />
            ) : wageData ? (
              <>
                <MetadataBanner lastUpdated={wageData.lastUpdated} dataSource={wageData.dataSource} sampleNote={wageData.sampleNote} />

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">National Average</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-national-avg">{formatLRD(wageData.nationalAvg)}</p>
                      <p className="text-[10px] text-muted-foreground">monthly salary</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">National Median</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-national-median">{formatLRD(wageData.nationalMedian)}</p>
                      <p className="text-[10px] text-muted-foreground">50th percentile</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">Total Workers</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400" data-testid="text-total-workers">{formatNumber(wageData.totalWorkers)}</p>
                      <p className="text-[10px] text-muted-foreground">{wageData.occupations.length} occupations tracked</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">Wage Spread</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{formatLRD(wageData.occupations[0]?.avgSalary || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">highest occupation avg</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Main Ranked Bar Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {wageSortBy === "avgSalary" ? "Average" : wageSortBy === "medianSalary" ? "Median" : "Worker Count"} by Occupation
                      </CardTitle>
                      <CardDescription>
                        {wageCounty === "all" ? "National" : wageCounty} — Click bars to drill into county breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(350, sortedWageOccupations.length * 28)}>
                        <ReBarChart
                          data={sortedWageOccupations.map(o => ({
                            name: o.title.length > 22 ? o.title.substring(0, 22) + "…" : o.title,
                            fullTitle: o.title,
                            avgSalary: o.avgSalary,
                            medianSalary: o.medianSalary,
                            p25Salary: o.p25Salary,
                            p75Salary: o.p75Salary,
                            minSalary: o.minSalary,
                            maxSalary: o.maxSalary,
                            workers: o.workers,
                            code: o.iscoCode,
                          }))}
                          layout="vertical"
                          margin={{ left: 170, right: 20, top: 5, bottom: 5 }}
                          onClick={(e: any) => {
                            if (e?.activePayload?.[0]?.payload?.code) {
                              setExpandedOcc(prev => prev === e.activePayload[0].payload.code ? null : e.activePayload[0].payload.code);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" tickFormatter={v => wageSortBy === "workers" ? formatNumber(v) : formatLRD(v)} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={165} tick={{ fontSize: 11 }} />
                          <Tooltip content={<WageTooltip />} />
                          <Bar dataKey={wageSortBy} radius={[0, 4, 4, 0]} cursor="pointer">
                            {sortedWageOccupations.map((o, i) => (
                              <Cell key={o.iscoCode} fill={expandedOcc === o.iscoCode ? "#f59e0b" : COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                          {wageData.compareData && (
                            <Bar dataKey={wageSortBy} data={wageData.compareData.occupations.map(o => ({
                              name: o.title.length > 22 ? o.title.substring(0, 22) + "…" : o.title,
                              [wageSortBy]: o[wageSortBy],
                            }))} fill="#f59e0b" fillOpacity={0.5} radius={[0, 4, 4, 0]} />
                          )}
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Wage Distribution Histogram */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Wage Distribution</CardTitle>
                      <CardDescription>Worker count by salary range</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <ReBarChart data={wageData.wageDistribution} margin={{ left: 0, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => [v.toLocaleString(), "Workers"]} />
                          <Bar dataKey="count" fill="#003893" radius={[4, 4, 0, 0]}>
                            {wageData.wageDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                      <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                        <p className="flex items-center gap-1"><Info className="w-3 h-3" /> Distribution of {wageData.totalWorkers.toLocaleString()} workers across salary bands. Median ({formatLRD(wageData.nationalMedian)}) is more robust than average for skewed distributions.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Compare Mode Panel */}
                {wageData.compareData && (
                  <Card className="mb-6 border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                        Comparing: {wageCounty === "all" ? "National" : wageCounty} vs {wageData.compareData.county}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="table-comparison">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Occupation</th>
                              <th className="text-right py-2 px-3 font-medium text-blue-600">{wageCounty === "all" ? "National" : wageCounty}</th>
                              <th className="text-right py-2 px-3 font-medium text-amber-600">{wageData.compareData.county}</th>
                              <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wageData.occupations.slice(0, 10).map(occ => {
                              const compOcc = wageData.compareData?.occupations.find(o => o.iscoCode === occ.iscoCode);
                              const diff = compOcc ? occ.avgSalary - compOcc.avgSalary : 0;
                              return (
                                <tr key={occ.iscoCode} className="border-b border-muted/30">
                                  <td className="py-2 pr-4 font-medium">{occ.title}</td>
                                  <td className="text-right py-2 px-3">{formatLRD(occ.avgSalary)}</td>
                                  <td className="text-right py-2 px-3">{compOcc ? formatLRD(compOcc.avgSalary) : "—"}</td>
                                  <td className={`text-right py-2 pl-3 font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                                    {compOcc ? `${diff > 0 ? "+" : ""}${formatLRD(diff)}` : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* County Drill-down */}
                {expandedOcc && (
                  <Card className="mb-6 border-primary/30 shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          County Breakdown: {wageData.occupations.find(o => o.iscoCode === expandedOcc)?.title}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setExpandedOcc(null)} data-testid="btn-close-drilldown">Close</Button>
                      </div>
                      <CardDescription>
                        n = {wageData.occupations.find(o => o.iscoCode === expandedOcc)?.workers} workers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart
                          data={wageData.occupations.find(o => o.iscoCode === expandedOcc)?.byCounty || []}
                          layout="vertical"
                          margin={{ left: 120, right: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" tickFormatter={v => formatLRD(v)} />
                          <YAxis type="category" dataKey="county" width={110} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number, name: string) => [formatLRD(v), name === "avgSalary" ? "Average" : "Median"]} />
                          <Legend />
                          <Bar dataKey="avgSalary" fill="#003893" name="Average" radius={[0, 4, 4, 0]} barSize={14}>
                            {(wageData.occupations.find(o => o.iscoCode === expandedOcc)?.byCounty || []).map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                          <Bar dataKey="medianSalary" fill="#1B5E20" name="Median" radius={[0, 4, 4, 0]} barSize={14} fillOpacity={0.6} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Occupation Cards */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Occupations ({sortedWageOccupations.length})</h3>
                  {sortedWageOccupations.map((occ, i) => (
                    <Card key={occ.iscoCode} className={`cursor-pointer hover:shadow-md transition-all ${expandedOcc === occ.iscoCode ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setExpandedOcc(prev => prev === occ.iscoCode ? null : occ.iscoCode)}
                      data-testid={`card-occupation-${occ.iscoCode}`}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                              {occ.iscoCode}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{occ.title}</p>
                              <p className="text-xs text-muted-foreground">{occ.workers.toLocaleString()} workers • {occ.byCounty.length} counties</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">{formatLRD(occ.avgSalary)}<span className="text-xs font-normal text-muted-foreground">/mo avg</span></p>
                              <p className="text-xs text-muted-foreground">{formatLRD(occ.medianSalary)} median</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] text-muted-foreground">25th–75th</p>
                              <p className="text-xs font-medium">{formatLRD(occ.p25Salary)} – {formatLRD(occ.p75Salary)}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedOcc === occ.iscoCode ? "rotate-90" : ""}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* ==================== TAB 2: DEMAND TRENDS ==================== */}
          <TabsContent value="demand">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Occupation Demand Trends
              </h2>
              <div className="flex items-center gap-2">
                <Button variant={demandView === "occupations" ? "default" : "outline"} size="sm"
                  onClick={() => setDemandView("occupations")} data-testid="btn-demand-occ">Occupations</Button>
                <Button variant={demandView === "sectors" ? "default" : "outline"} size="sm"
                  onClick={() => setDemandView("sectors")} data-testid="btn-demand-sectors">Sectors</Button>
              </div>
            </div>

            {trendLoading ? (
              <SectionLoadingSpinner />
            ) : trendData ? (
              <>
                <MetadataBanner lastUpdated={trendData.lastUpdated} dataSource="employment_spells" sampleNote={`${trendData.summary.totalSpells.toLocaleString()} employment spells analyzed`} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-muted-foreground">Growing</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700" data-testid="text-growing-count">{trendData.summary.growing}</p>
                      <p className="text-[10px] text-muted-foreground">occupations expanding</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-muted-foreground">Stable</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700">{trendData.summary.stable}</p>
                      <p className="text-[10px] text-muted-foreground">steady employment</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-muted-foreground">Declining</p>
                      </div>
                      <p className="text-2xl font-bold text-red-700" data-testid="text-declining-count">{trendData.summary.declining}</p>
                      <p className="text-[10px] text-muted-foreground">contracting fields</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground">Total Spells</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{formatNumber(trendData.summary.totalSpells)}</p>
                      <p className="text-[10px] text-muted-foreground">across all occupations</p>
                    </CardContent>
                  </Card>
                </div>

                {demandView === "occupations" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top 8 Occupations — Year-over-Year Trend</CardTitle>
                        <CardDescription>Employment spell creation rates by year</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false}
                              ticks={trendData.years} />
                            <YAxis />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            {trendData.trends.slice(0, 8).map((t, i) => (
                              <Line key={t.iscoCode} type="monotone"
                                data={t.yearData}
                                dataKey="count" name={t.title.length > 20 ? t.title.substring(0, 20) + "…" : t.title}
                                stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Growth Rate Ranking</CardTitle>
                        <CardDescription>Percentage change from first to last year of data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <ReBarChart data={trendData.trends.slice(0, 12).map(t => ({
                            name: t.title.length > 18 ? t.title.substring(0, 18) + "…" : t.title,
                            growthRate: t.growthRate,
                            trend: t.trend,
                          }))} layout="vertical" margin={{ left: 150, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" tickFormatter={v => `${v}%`} />
                            <YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`${v}%`, "Growth"]} />
                            <ReferenceLine x={0} stroke="#666" />
                            <Bar dataKey="growthRate" radius={[0, 4, 4, 0]}>
                              {trendData.trends.slice(0, 12).map((t, i) => (
                                <Cell key={i} fill={t.trend === "growing" ? "#16a34a" : t.trend === "declining" ? "#dc2626" : "#f59e0b"} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Sector Employment Trends</CardTitle>
                      <CardDescription>Employment spell creation by sector over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false} ticks={trendData.years} />
                          <YAxis />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {trendData.sectorTrends.slice(0, 6).map((s, i) => (
                            <Area key={s.sector} type="monotone"
                              data={s.yearData}
                              dataKey="count" name={s.sector}
                              stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15}
                              strokeWidth={2} dot={{ r: 3 }} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Occupation Trends ({trendData.trends.length})</h3>
                  {trendData.trends.map((trend, i) => (
                    <Card key={trend.iscoCode} data-testid={`card-trend-${trend.iscoCode}`}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                              {trend.iscoCode}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{trend.title}</p>
                              <p className="text-xs text-muted-foreground">{trend.totalSpells.toLocaleString()} spells • {trend.countyBreakdown.length} counties</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:flex gap-1.5">
                              {trend.yearData.map(yd => (
                                <div key={yd.year} className="text-center w-10">
                                  <p className="text-[9px] text-muted-foreground">{yd.year}</p>
                                  <div className="bg-muted rounded-sm h-5 flex items-end overflow-hidden">
                                    <div className="w-full rounded-sm transition-all" style={{
                                      backgroundColor: COLORS[i % COLORS.length],
                                      height: `${Math.max(15, (yd.count / Math.max(...trend.yearData.map(y => y.count))) * 100)}%`
                                    }} />
                                  </div>
                                  <p className="text-[9px] font-medium">{yd.count}</p>
                                </div>
                              ))}
                            </div>
                            <Badge variant={trend.trend === "growing" ? "default" : trend.trend === "declining" ? "destructive" : "secondary"}
                              className="flex items-center gap-1 text-xs">
                              {trend.trend === "growing" ? <ArrowUpRight className="w-3 h-3" /> :
                                trend.trend === "declining" ? <ArrowDownRight className="w-3 h-3" /> :
                                  <Minus className="w-3 h-3" />}
                              {trend.growthRate > 0 ? "+" : ""}{trend.growthRate}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* ==================== TAB 3: SKILLS GAP ==================== */}
          <TabsContent value="skills">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Skills Gap Analysis
            </h2>

            {skillsLoading ? (
              <SectionLoadingSpinner />
            ) : skillsData ? (
              <>
                <MetadataBanner dataSource="vacancies + person_skills" sampleNote={`${skillsData.summary.totalSeekers} seekers, ${skillsData.summary.totalVacancies} vacancies analyzed`} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-muted-foreground">Shortages</p>
                      </div>
                      <p className="text-2xl font-bold text-red-700" data-testid="text-shortages">{skillsData.summary.shortages}</p>
                      <p className="text-[10px] text-muted-foreground">training opportunities</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-muted-foreground">Surpluses</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700" data-testid="text-surpluses">{skillsData.summary.surpluses}</p>
                      <p className="text-[10px] text-muted-foreground">well-supplied</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground">Job Seekers</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{formatNumber(skillsData.summary.totalSeekers)}</p>
                      <p className="text-[10px] text-muted-foreground">registered profiles</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-muted-foreground">Vacancies</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">{formatNumber(skillsData.summary.totalVacancies)}</p>
                      <p className="text-[10px] text-muted-foreground">active postings</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Supply vs Demand by Skill</CardTitle>
                      <CardDescription>Job seeker skills (green) vs employer requirements (red). Wider gaps = bigger training opportunities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={450}>
                        <ReBarChart
                          data={skillsData.skills.filter(s => s.supply > 0 || s.demand > 0).slice(0, 15).map(s => ({
                            name: s.skillName.length > 16 ? s.skillName.substring(0, 16) + "…" : s.skillName,
                            fullName: s.skillName,
                            supply: s.supply,
                            demand: s.demand,
                            gap: s.gap,
                            type: s.gapType,
                          }))}
                          layout="vertical"
                          margin={{ left: 140, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={135} tick={{ fontSize: 11 }} />
                          <Tooltip content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            return (
                              <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                <p className="font-semibold text-sm mb-1">{d.fullName}</p>
                                <p className="text-xs"><span className="text-green-600">Supply: {d.supply} seekers</span></p>
                                <p className="text-xs"><span className="text-red-600">Demand: {d.demand} openings</span></p>
                                <p className="text-xs font-medium mt-1">Gap: {d.gap > 0 ? `+${d.gap} shortage` : d.gap < 0 ? `${d.gap} surplus` : "balanced"}</p>
                              </div>
                            );
                          }} />
                          <Legend />
                          <Bar dataKey="supply" fill="#16a34a" name="Seekers (Supply)" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="demand" fill="#dc2626" name="Employer Demand" radius={[0, 4, 4, 0]} />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">By Category</CardTitle>
                        <CardDescription>Skill gap distribution across categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <ReBarChart data={skillCategoryData} margin={{ left: 0, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="shortage" fill="#dc2626" stackId="a" name="Shortage" />
                            <Bar dataKey="balanced" fill="#f59e0b" stackId="a" name="Balanced" />
                            <Bar dataKey="surplus" fill="#16a34a" stackId="a" name="Surplus" />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Priority Training Needs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {skillsData.skills.filter(s => s.gapType === "shortage").slice(0, 5).map(skill => (
                            <div key={skill.skillId} className="flex items-center justify-between text-sm">
                              <span className="truncate mr-2">{skill.skillName}</span>
                              <Badge variant="destructive" className="text-[10px] shrink-0">Gap: +{skill.gap}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-red-200/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Top Skill Shortages
                      </CardTitle>
                      <CardDescription>Prime training opportunities — employers need but workers lack</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {skillsData.skills.filter(s => s.gapType === "shortage").slice(0, 8).map(skill => (
                          <div key={skill.skillId} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{skill.skillName}</p>
                              <p className="text-xs text-muted-foreground">{skill.category}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs"><span className="text-green-600">{skill.supply}</span> / <span className="text-red-600">{skill.demand}</span></span>
                              <Badge variant="destructive" className="text-[10px]">Gap: +{skill.gap}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-green-700 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" /> Top Skill Surpluses
                      </CardTitle>
                      <CardDescription>Well-supplied — competitive market areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {skillsData.skills.filter(s => s.gapType === "surplus").slice(0, 8).map(skill => (
                          <div key={skill.skillId} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{skill.skillName}</p>
                              <p className="text-xs text-muted-foreground">{skill.category}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs"><span className="text-green-600">{skill.supply}</span> / <span className="text-red-600">{skill.demand}</span></span>
                              <Badge className="bg-green-100 text-green-800 text-[10px]">Surplus: {Math.abs(skill.gap)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* ==================== TAB 4: PROJECTIONS ==================== */}
          <TabsContent value="projections">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Employment Projections
            </h2>

            {projLoading ? (
              <SectionLoadingSpinner />
            ) : projData ? (
              <>
                <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-blue-800 dark:text-blue-300">Projection Methodology</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{projData.disclaimer}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          Data spans: {projData.dataYears.join(", ")} | Projecting for: {projData.projectionYear}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sector Employment — Historical vs Projected {projData.projectionYear}</CardTitle>
                    <CardDescription>Solid bars = actual data, dashed = projected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={projData.sectorProjections.map(s => {
                        const item: any = { sector: s.sector };
                        s.historical.forEach(h => { item[`${h.year}`] = h.count; });
                        item[`${projData.projectionYear}*`] = s.projected.count;
                        item.trend = s.trend;
                        item.confidence = s.confidence;
                        return item;
                      })}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip content={({ active, payload, label }: any) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                              <p className="font-semibold text-sm mb-1">{label}</p>
                              {payload.map((p: any) => (
                                <p key={p.name} className="text-xs" style={{ color: p.color }}>
                                  {p.name}: {p.value?.toLocaleString()}
                                </p>
                              ))}
                              {d?.confidence && <p className="text-[10px] text-muted-foreground mt-1">Confidence: {d.confidence}</p>}
                            </div>
                          );
                        }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {projData.dataYears.map((y, i) => (
                          <Bar key={y} dataKey={`${y}`} fill={COLORS[i]} name={`${y}`} />
                        ))}
                        <Bar dataKey={`${projData.projectionYear}*`} fill="#f59e0b" name={`${projData.projectionYear} (projected)`} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Occupation Projections for {projData.projectionYear}</CardTitle>
                    <CardDescription>Historical trends and projected employment counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projData.occupationProjections.slice(0, 12).map((occ, i) => {
                        const allCounts = [...occ.historical.map(h => h.count), occ.projected.count];
                        const maxVal = Math.max(...allCounts);
                        return (
                          <div key={occ.iscoCode || occ.sector} data-testid={`projection-${occ.iscoCode || occ.sector}`} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-sm font-medium">{occ.title || occ.sector}</span>
                                <Badge variant={occ.trend === "growing" ? "default" : "destructive"} className="text-[10px]">
                                  {occ.trend === "growing" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                  {occ.trend}
                                </Badge>
                                {occ.confidence && <span className="text-[10px] text-muted-foreground">({occ.confidence} confidence)</span>}
                              </div>
                              <span className="text-sm font-bold text-amber-600">{occ.projected.count} projected</span>
                            </div>
                            <div className="flex gap-1 items-end">
                              {occ.historical.map(h => (
                                <div key={h.year} className="flex-1">
                                  <div className="bg-muted rounded-sm overflow-hidden h-7">
                                    <div className="h-full rounded-sm transition-all" style={{
                                      backgroundColor: COLORS[i % COLORS.length],
                                      height: `${(h.count / maxVal) * 100}%`,
                                      marginTop: `${100 - (h.count / maxVal) * 100}%`,
                                    }} />
                                  </div>
                                  <p className="text-[9px] text-center text-muted-foreground mt-0.5">{h.year}</p>
                                </div>
                              ))}
                              <div className="flex-1">
                                <div className="bg-amber-100 rounded-sm overflow-hidden h-7 border border-dashed border-amber-400">
                                  <div className="bg-amber-400 h-full rounded-sm" style={{
                                    height: `${(occ.projected.count / maxVal) * 100}%`,
                                    marginTop: `${100 - (occ.projected.count / maxVal) * 100}%`,
                                  }} />
                                </div>
                                <p className="text-[9px] text-center text-amber-600 font-bold mt-0.5">{projData.projectionYear}*</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* ==================== TAB 5: SAFETY ==================== */}
          <TabsContent value="safety">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" /> Injury & Risk by Occupation
            </h2>

            {injuryLoading ? (
              <SectionLoadingSpinner />
            ) : injuryData ? (
              <>
                <MetadataBanner dataSource="workplace_incidents" sampleNote={`${injuryData.summary.totalIncidents} reported incidents analyzed`} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-muted-foreground">Total Incidents</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-700" data-testid="text-total-incidents">{injuryData.summary.totalIncidents}</p>
                      <p className="text-[10px] text-muted-foreground">all reported events</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Skull className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-muted-foreground">Fatalities</p>
                      </div>
                      <p className="text-2xl font-bold text-red-700" data-testid="text-fatalities">{injuryData.summary.totalFatalities}</p>
                      <p className="text-[10px] text-muted-foreground">work-related deaths</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-amber-600" />
                        <p className="text-xs text-muted-foreground">Injuries</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-700" data-testid="text-total-injuries">{injuryData.summary.totalInjuries}</p>
                      <p className="text-[10px] text-muted-foreground">workers injured</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground">Highest Rate</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{injuryData.bySector[0]?.incidentRate}%</p>
                      <p className="text-[10px] text-muted-foreground truncate">{injuryData.bySector[0]?.sector}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Incident Rate by Sector</CardTitle>
                      <CardDescription>Incidents per 100 workers — higher rates indicate riskier sectors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={injuryData.bySector} margin={{ left: 0, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            return (
                              <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                <p className="font-semibold text-sm mb-1">{label}</p>
                                <p className="text-xs">Incidents: {d.incidents} • Rate: {d.incidentRate}%</p>
                                <p className="text-xs">Fatalities: {d.fatalities} • Injuries: {d.injuries}</p>
                                <p className="text-xs">Workers in sector: {d.workers.toLocaleString()}</p>
                              </div>
                            );
                          }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar yAxisId="left" dataKey="incidents" fill="#CE1126" name="Incidents" radius={[4, 4, 0, 0]}>
                            {injuryData.bySector.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                          <Line yAxisId="right" type="monotone" dataKey="incidentRate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Rate (%)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Severity Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={severityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              outerRadius={75} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}>
                              {severityPieData.map((_, i) => (
                                <Cell key={i} fill={["#dc2626", "#f59e0b", "#16a34a", "#6366f1", "#8b5cf6"][i % 5]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top Counties</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {injuryData.byCounty.slice(0, 6).map((c, i) => (
                            <div key={c.county} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="truncate">{c.county}</span>
                              </div>
                              <span className="font-medium">{c.incidents} incidents</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Detailed Sector Safety Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-testid="table-safety-detail">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="py-2 pr-4 font-medium text-muted-foreground">Sector</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Incidents</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Fatalities</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Injuries</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Workers</th>
                            <th className="py-2 px-3 text-right font-medium text-muted-foreground">Rate (%)</th>
                            <th className="py-2 pl-3 font-medium text-muted-foreground">Top Incident Types</th>
                          </tr>
                        </thead>
                        <tbody>
                          {injuryData.bySector.map((sector, i) => (
                            <tr key={sector.sector} className="border-b border-muted/30 hover:bg-muted/20">
                              <td className="py-2 pr-4 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                {sector.sector}
                              </td>
                              <td className="py-2 px-3 text-right">{sector.incidents}</td>
                              <td className="py-2 px-3 text-right text-red-600 font-medium">{sector.fatalities}</td>
                              <td className="py-2 px-3 text-right text-amber-600">{sector.injuries}</td>
                              <td className="py-2 px-3 text-right">{sector.workers.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right">
                                <Badge variant={sector.incidentRate > 5 ? "destructive" : sector.incidentRate > 2 ? "secondary" : "default"} className="text-[10px]">
                                  {sector.incidentRate}%
                                </Badge>
                              </td>
                              <td className="py-2 pl-3 text-xs text-muted-foreground">
                                {sector.incidentTypes.slice(0, 2).map(t => t.type).join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
