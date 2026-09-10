import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LiberiaMap } from "@/components/LiberiaMap";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis,
  LineChart, Brush, ReferenceLine, Area, AreaChart,
} from "recharts";
import {
  TrendingDown, TrendingUp, Users, UserX, User, Briefcase, Factory,
  Download, BarChart3, FileSpreadsheet, FileText, GitCompare, X,
  BookOpen, Calendar, Database, Info, Lightbulb, MapPin, ChevronRight,
  Loader2, ArrowLeftRight, Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LabourMarketIndicator } from "@shared/schema";

type CountyIndicator = {
  id: number; county: string; year: number; quarter: number | null;
  population: number | null; activePopulation: number | null;
  totalEmployed: number | null; totalUnemployed: number | null;
  totalUnderemployed: number | null; unemploymentRate: number | null;
  employmentRate: number | null; underemploymentRate: number | null;
  labourForceParticipation: number | null;
  maleUnemploymentRate: number | null; femaleUnemploymentRate: number | null;
  urbanUnemploymentRate: number | null; ruralUnemploymentRate: number | null;
  youthUnemploymentRate: number | null;
  agriculturePct: number | null; servicesPct: number | null; industryPct: number | null;
  totalJobSeekers: number | null; totalVacancies: number | null;
};

const COUNTIES = [
  "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa", "Margibi",
  "Bomi", "Grand Cape Mount", "Maryland", "Grand Gedeh", "Sinoe",
  "River Cess", "Grand Kru", "Gbarpolu", "River Gee"
];

const COUNTY_COLORS: Record<string, string> = {
  "Montserrado": "#002868", "Nimba": "#BF0A30", "Bong": "#22c55e",
  "Lofa": "#f59e0b", "Grand Bassa": "#8b5cf6", "Margibi": "#06b6d4",
  "Bomi": "#ec4899", "Grand Cape Mount": "#14b8a6", "Maryland": "#f97316",
  "Grand Gedeh": "#6366f1", "Sinoe": "#84cc16", "River Cess": "#e11d48",
  "Grand Kru": "#0ea5e9", "Gbarpolu": "#a855f7", "River Gee": "#d97706"
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];
const CHART_COLORS = ["#003893", "#CE1126", "#1B5E20", "#FF6F00", "#0277BD", "#6A1B9A", "#C62828", "#00695C"];

const fmt = (v: number | null | undefined) => v != null ? v.toFixed(1) + "%" : "N/A";
const fmtNum = (v: number | null | undefined) => v != null ? v.toLocaleString() : "N/A";

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function MethodologyDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" data-testid="btn-methodology">
          <BookOpen className="w-4 h-4" /> Methodology
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Definitions & Methodology</SheetTitle>
          <SheetDescription>Key definitions, data sources, and methodology notes for labour market indicators.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm">
          <div>
            <h3 className="font-semibold text-base mb-2">Key Definitions</h3>
            <dl className="space-y-3">
              <div><dt className="font-medium text-primary">Unemployment Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage of the active (economically active) population that is without work but actively seeking employment. Calculated as: (Total Unemployed / Active Population) × 100.</dd></div>
              <div><dt className="font-medium text-primary">Employment Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage of the active population currently employed. Calculated as: (Total Employed / Active Population) × 100.</dd></div>
              <div><dt className="font-medium text-primary">Underemployment Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage of employed persons working fewer hours than desired or in positions below their skill level. Calculated as: (Total Underemployed / Total Employed) × 100.</dd></div>
              <div><dt className="font-medium text-primary">Labour Force Participation Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage of the working-age population (15+) that is either employed or actively seeking employment.</dd></div>
              <div><dt className="font-medium text-primary">Youth Unemployment Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Unemployment rate for persons aged 15-24, a key indicator of economic opportunity for young people.</dd></div>
              <div><dt className="font-medium text-primary">Informal Employment Rate</dt>
              <dd className="text-muted-foreground mt-0.5">Percentage of employed persons working in the informal sector — without formal contracts, social protection, or tax registration.</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Data Sources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>National Indicators:</strong> LISGIS Quarterly Labour Reports and ILO ILOSTAT / World Bank Modeled Estimates.</span></li>
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>County Data:</strong> LiJOBS county_indicators table with per-county employment statistics.</span></li>
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Employment Spells:</strong> Verified employment records from the LiJOBS observatory.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Methodology Notes</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>National-level time series uses ILO standard definitions aligned with the 19th ICLS resolution.</li>
              <li>County-level data represents the latest available period with disaggregated statistics.</li>
              <li>Gender breakdown (male/female unemployment rates) are averages across counties with data.</li>
              <li>Sector employment shares (agriculture, services, industry) are weighted by county employment counts.</li>
              <li>Trend forecasts use simple linear extrapolation and should be interpreted as directional only.</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetadataBanner({ periodLabel, countyCount, dataPoints }: { periodLabel: string; countyCount: number; dataPoints: number }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2 px-1" data-testid="metadata-banner">
      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Latest: {periodLabel || "N/A"}</span>
      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {countyCount} counties</span>
      <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {dataPoints} data points</span>
      <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Source: LISGIS / ILO / LiJOBS</span>
    </div>
  );
}

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== "object");
  const csv = [keys.join(","), ...data.map(row => keys.map(k => {
    const v = row[k];
    return typeof v === "string" && v.includes(",") ? `"${v}"` : v ?? "";
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function RichTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3 max-w-xs">
      <p className="font-semibold text-sm mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{typeof p.value === "number" ? (unit === "%" ? p.value.toFixed(1) + "%" : p.value.toLocaleString()) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LabourIndicators() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unemployment");
  const [selectedMapCounty, setSelectedMapCounty] = useState<string | null>(null);
  const [compareCounties, setCompareCounties] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [detailCounty, setDetailCounty] = useState<string | null>(null);

  const { data: indicators = [], isLoading: natLoading } = useQuery<LabourMarketIndicator[]>({
    queryKey: ["/api/labour-indicators"],
  });

  const { data: countyData = [], isLoading: countyLoading } = useQuery<CountyIndicator[]>({
    queryKey: ["/api/county-indicators"],
  });

  const isLoading = natLoading || countyLoading;

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    countyData.forEach(c => years.add(c.year));
    indicators.forEach(d => years.add(d.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [countyData, indicators]);

  const filteredCountyData = useMemo(() => {
    if (selectedYear === "all") return countyData;
    const y = parseInt(selectedYear);
    return countyData.filter(c => c.year === y);
  }, [countyData, selectedYear]);

  const sorted = useMemo(() =>
    [...indicators].sort((a, b) => b.year - a.year || (b.quarter || 0) - (a.quarter || 0)),
    [indicators]
  );

  const latest = sorted.length > 0 ? sorted[0] : null;

  const chartData = useMemo(() => {
    const filtered = [...indicators]
      .sort((a, b) => a.year - b.year || (a.quarter || 0) - (b.quarter || 0))
      .filter(d => selectedYear === "all" || d.year === parseInt(selectedYear));
    return filtered.map((d) => ({
      label: d.quarter ? `${d.year} Q${d.quarter}` : `${d.year}`,
      unemploymentRate: d.unemploymentRate,
      employmentRate: d.employmentToPopRatio ? 100 - (d.unemploymentRate || 0) : null,
      lfParticipation: d.labourForceParticipation,
      totalEmployed: d.totalEmployed,
      totalUnemployed: d.totalUnemployed,
      totalLabourForce: d.totalLabourForce,
      population: d.totalLabourForce ? Math.round((d.totalLabourForce / ((d.labourForceParticipation || 60) / 100))) : null,
      youthUnemp: d.youthUnemploymentRate,
      femaleParticipation: d.femaleLabourParticipation,
      informalRate: d.informalEmploymentRate,
    }));
  }, [indicators, selectedYear]);

  const forecastData = useMemo(() => {
    if (chartData.length < 2) return [];
    const rates = chartData.filter(d => d.unemploymentRate != null).map(d => d.unemploymentRate as number);
    if (rates.length < 2) return [];
    const lastRate = rates[rates.length - 1];
    const trend = (rates[rates.length - 1] - rates[0]) / rates.length;
    const lastLabel = chartData[chartData.length - 1].label;
    const lastYear = parseInt(lastLabel.split(" ")[0]);
    const lastQ = lastLabel.includes("Q") ? parseInt(lastLabel.split("Q")[1]) : 0;
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      let fYear = lastYear;
      let fQ = lastQ + i;
      if (lastQ === 0) { fYear += i; fQ = 0; }
      else { while (fQ > 4) { fQ -= 4; fYear++; } }
      const label = fQ > 0 ? `${fYear} Q${fQ}` : `${fYear}`;
      forecast.push({ label, projected: Math.max(0, lastRate + trend * i), isProjected: true });
    }
    return forecast;
  }, [chartData]);

  const latestCounty = useMemo(() => {
    const filtered = filteredCountyData.length > 0 ? filteredCountyData : countyData;
    if (filtered.length === 0) return [];
    const maxYear = Math.max(...filtered.map(c => c.year));
    const atYear = filtered.filter(c => c.year === maxYear);
    const maxQ = Math.max(...atYear.map(c => c.quarter || 0));
    return atYear.filter(c => (c.quarter || 0) === maxQ);
  }, [filteredCountyData, countyData]);

  const nationalTotals = useMemo(() => {
    if (latestCounty.length === 0) return null;
    const totalPop = latestCounty.reduce((s, c) => s + (c.population || 0), 0);
    const totalActive = latestCounty.reduce((s, c) => s + (c.activePopulation || 0), 0);
    const totalEmp = latestCounty.reduce((s, c) => s + (c.totalEmployed || 0), 0);
    const totalUnemp = latestCounty.reduce((s, c) => s + (c.totalUnemployed || 0), 0);
    const totalUnder = latestCounty.reduce((s, c) => s + (c.totalUnderemployed || 0), 0);
    const totalSeekers = latestCounty.reduce((s, c) => s + (c.totalJobSeekers || 0), 0);
    const totalVac = latestCounty.reduce((s, c) => s + (c.totalVacancies || 0), 0);
    const avgMale = latestCounty.reduce((s, c) => s + (c.maleUnemploymentRate || 0), 0) / latestCounty.length;
    const avgFemale = latestCounty.reduce((s, c) => s + (c.femaleUnemploymentRate || 0), 0) / latestCounty.length;
    const avgUrban = latestCounty.reduce((s, c) => s + (c.urbanUnemploymentRate || 0), 0) / latestCounty.length;
    const avgRural = latestCounty.reduce((s, c) => s + (c.ruralUnemploymentRate || 0), 0) / latestCounty.length;
    const agr = totalEmp > 0 ? latestCounty.reduce((s, c) => s + (c.agriculturePct || 0) * (c.totalEmployed || 0), 0) / totalEmp : 0;
    const svc = totalEmp > 0 ? latestCounty.reduce((s, c) => s + (c.servicesPct || 0) * (c.totalEmployed || 0), 0) / totalEmp : 0;
    const ind = totalEmp > 0 ? latestCounty.reduce((s, c) => s + (c.industryPct || 0) * (c.totalEmployed || 0), 0) / totalEmp : 0;
    return {
      population: totalPop, activePopulation: totalActive,
      totalEmployed: totalEmp, totalUnemployed: totalUnemp, totalUnderemployed: totalUnder,
      unemploymentRate: totalActive > 0 ? (totalUnemp / totalActive) * 100 : 0,
      employmentRate: totalActive > 0 ? (totalEmp / totalActive) * 100 : 0,
      underemploymentRate: totalEmp > 0 ? (totalUnder / totalEmp) * 100 : 0,
      maleUnemploymentRate: avgMale, femaleUnemploymentRate: avgFemale,
      urbanUnemploymentRate: avgUrban, ruralUnemploymentRate: avgRural,
      agriculturePct: agr, servicesPct: svc, industryPct: ind,
      totalJobSeekers: totalSeekers, totalVacancies: totalVac,
    };
  }, [latestCounty]);

  const scatterData = useMemo(() =>
    latestCounty.map(c => ({
      county: c.county,
      x: c.unemploymentRate || 0,
      y: c.labourForceParticipation || 0,
      z: (c.population || 50000) / 10000,
      pop: c.population,
      fill: COUNTY_COLORS[c.county] || "#888",
    })),
    [latestCounty]
  );

  const sectorPieData = useMemo(() => {
    if (!nationalTotals) return [];
    return [
      { name: "Agriculture", value: Math.round(nationalTotals.agriculturePct), color: PIE_COLORS[0] },
      { name: "Services", value: Math.round(nationalTotals.servicesPct), color: PIE_COLORS[1] },
      { name: "Industry", value: Math.round(nationalTotals.industryPct), color: PIE_COLORS[2] },
    ];
  }, [nationalTotals]);

  const mapData = useMemo(() => {
    const key = activeTab === "employment" ? "employmentRate" :
                activeTab === "underemployment" ? "underemploymentRate" :
                activeTab === "jobs" ? "totalVacancies" :
                activeTab === "seekers" ? "totalJobSeekers" : "unemploymentRate";
    return latestCounty.map(c => ({
      county: c.county,
      value: (c as any)[key] || 0,
      label: key.includes("Rate") || key.includes("Pct") ? fmt((c as any)[key]) : fmtNum((c as any)[key]),
      population: c.population || 0,
      extra: {
        "Employed": fmtNum(c.totalEmployed),
        "Unemployed": fmtNum(c.totalUnemployed),
      },
    }));
  }, [latestCounty, activeTab]);

  const mapColorScale = useCallback((value: number) => {
    if (activeTab === "employment") {
      if (value >= 93) return "#22c55e";
      if (value >= 88) return "#84cc16";
      if (value >= 83) return "#eab308";
      if (value >= 78) return "#f97316";
      return "#ef4444";
    }
    if (activeTab === "underemployment") {
      if (value <= 15) return "#22c55e";
      if (value <= 25) return "#84cc16";
      if (value <= 35) return "#eab308";
      if (value <= 45) return "#f97316";
      return "#ef4444";
    }
    if (activeTab === "jobs" || activeTab === "seekers") {
      if (value >= 500) return "#ef4444";
      if (value >= 100) return "#f97316";
      if (value >= 50) return "#eab308";
      return "#22c55e";
    }
    if (value <= 5) return "#22c55e";
    if (value <= 10) return "#84cc16";
    if (value <= 15) return "#eab308";
    if (value <= 20) return "#f97316";
    return "#ef4444";
  }, [activeTab]);

  const handleMapClick = useCallback((county: string) => {
    setSelectedMapCounty(prev => prev === county ? null : county);
    setDetailCounty(prev => prev === county ? null : county);
  }, []);

  const toggleCompareCounty = useCallback((county: string) => {
    setCompareCounties(prev => {
      if (prev.includes(county)) return prev.filter(c => c !== county);
      if (prev.length >= 3) {
        toast({ title: "Maximum 3 counties for comparison" });
        return prev;
      }
      return [...prev, county];
    });
  }, [toast]);

  const insights = useMemo(() => {
    const result: string[] = [];
    if (!nationalTotals || latestCounty.length === 0) return result;
    const highestUnemp = [...latestCounty].sort((a, b) => (b.unemploymentRate || 0) - (a.unemploymentRate || 0))[0];
    if (highestUnemp) result.push(`${highestUnemp.county} has the highest unemployment at ${fmt(highestUnemp.unemploymentRate)}.`);
    const lowestUnemp = [...latestCounty].sort((a, b) => (a.unemploymentRate || 0) - (b.unemploymentRate || 0))[0];
    if (lowestUnemp) result.push(`${lowestUnemp.county} has the lowest unemployment at ${fmt(lowestUnemp.unemploymentRate)}.`);
    if (nationalTotals.femaleUnemploymentRate > nationalTotals.maleUnemploymentRate) {
      result.push(`Female unemployment (${fmt(nationalTotals.femaleUnemploymentRate)}) exceeds male (${fmt(nationalTotals.maleUnemploymentRate)}).`);
    }
    if (nationalTotals.ruralUnemploymentRate > nationalTotals.urbanUnemploymentRate) {
      result.push(`Rural unemployment (${fmt(nationalTotals.ruralUnemploymentRate)}) exceeds urban (${fmt(nationalTotals.urbanUnemploymentRate)}).`);
    }
    if (chartData.length >= 2) {
      const first = chartData[0].unemploymentRate;
      const last = chartData[chartData.length - 1].unemploymentRate;
      if (first != null && last != null) {
        const change = last - first;
        result.push(`Unemployment ${change < 0 ? "decreased" : "increased"} by ${Math.abs(change).toFixed(1)}pp over the time series.`);
      }
    }
    return result;
  }, [nationalTotals, latestCounty, chartData]);

  const handleExportCSV = useCallback((section: string) => {
    const data = latestCounty.map(c => ({
      County: c.county, Population: c.population, ActivePopulation: c.activePopulation,
      TotalEmployed: c.totalEmployed, TotalUnemployed: c.totalUnemployed,
      UnemploymentRate: c.unemploymentRate, EmploymentRate: c.employmentRate,
      UnderemploymentRate: c.underemploymentRate,
      MaleUnempRate: c.maleUnemploymentRate, FemaleUnempRate: c.femaleUnemploymentRate,
      UrbanUnempRate: c.urbanUnemploymentRate, RuralUnempRate: c.ruralUnemploymentRate,
      YouthUnempRate: c.youthUnemploymentRate,
      Agriculture: c.agriculturePct, Services: c.servicesPct, Industry: c.industryPct,
      JobSeekers: c.totalJobSeekers, Vacancies: c.totalVacancies,
    }));
    downloadCSV(data, `labour_indicators_${section.toLowerCase()}.csv`);
    toast({ title: `${section} data exported as CSV` });
  }, [latestCounty, toast]);

  const exportExcel = useCallback(async (section: string) => {
    const XLSX = await import("xlsx");
    const data = latestCounty.map(c => ({
      County: c.county, Population: c.population, "Active Population": c.activePopulation,
      "Total Employed": c.totalEmployed, "Total Unemployed": c.totalUnemployed,
      "Unemployment Rate (%)": c.unemploymentRate, "Employment Rate (%)": c.employmentRate,
      "Underemployment Rate (%)": c.underemploymentRate,
      "Male Unemp. Rate (%)": c.maleUnemploymentRate, "Female Unemp. Rate (%)": c.femaleUnemploymentRate,
      "Urban Unemp. Rate (%)": c.urbanUnemploymentRate, "Rural Unemp. Rate (%)": c.ruralUnemploymentRate,
      "Youth Unemp. Rate (%)": c.youthUnemploymentRate,
      "Agriculture (%)": c.agriculturePct, "Services (%)": c.servicesPct, "Industry (%)": c.industryPct,
      "Job Seekers": c.totalJobSeekers, Vacancies: c.totalVacancies,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, section);
    XLSX.writeFile(wb, `labour_indicators_${section.toLowerCase()}.xlsx`);
    toast({ title: `${section} data exported as Excel` });
  }, [latestCounty, toast]);

  const exportPDF = useCallback(async (section: string) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`LiJOBS - Labour Market Indicators: ${section}`, 14, 20);
    doc.setFontSize(10);
    const pLabel = latestCounty.length > 0
      ? `${latestCounty[0].year}${latestCounty[0].quarter ? ` Q${latestCounty[0].quarter}` : ""}`
      : "";
    doc.text(`Period: ${pLabel} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    let y = 38;
    doc.setFontSize(8);
    const headers = ["County", "Pop.", "Unemp%", "Emp%", "Male%", "Female%", "Urban%", "Rural%", "Agri%", "Svc%", "Ind%", "Seekers", "Vacancies"];
    const colWidths = [35, 20, 16, 16, 16, 16, 16, 16, 14, 14, 14, 18, 18];
    let x = 14;
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 6;
    doc.setFont("helvetica", "normal");
    latestCounty.forEach(c => {
      x = 14;
      const row = [
        c.county, fmtNum(c.population), c.unemploymentRate?.toFixed(1) || "", c.employmentRate?.toFixed(1) || "",
        c.maleUnemploymentRate?.toFixed(1) || "", c.femaleUnemploymentRate?.toFixed(1) || "",
        c.urbanUnemploymentRate?.toFixed(1) || "", c.ruralUnemploymentRate?.toFixed(1) || "",
        c.agriculturePct?.toString() || "", c.servicesPct?.toString() || "", c.industryPct?.toString() || "",
        c.totalJobSeekers?.toString() || "", c.totalVacancies?.toString() || "",
      ];
      row.forEach((val, i) => { doc.text(val, x, y); x += colWidths[i]; });
      y += 5;
      if (y > 190) { doc.addPage(); y = 20; }
    });
    doc.save(`labour_indicators_${section.toLowerCase()}.pdf`);
    toast({ title: `${section} data exported as PDF` });
  }, [latestCounty, toast]);

  const periodLabel = latestCounty.length > 0
    ? `${latestCounty[0].year}${latestCounty[0].quarter ? ` Q${latestCounty[0].quarter}` : ""}`
    : latest ? `${latest.year}${latest.quarter ? ` Q${latest.quarter}` : ""}` : "";

  const selectedCountyData = selectedMapCounty ? latestCounty.find(c => c.county === selectedMapCounty) : null;
  const detailData = detailCounty ? latestCounty.find(c => c.county === detailCounty) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="labour-indicators-page">
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
                    Labour Market Indicators
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    National Employment & Labour Intelligence — Republic of Liberia
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MethodologyDrawer />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExportCSV(activeTab)}
                data-testid="btn-download-csv">
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportExcel(activeTab)}
                data-testid="btn-download-excel">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPDF(activeTab)}
                data-testid="btn-download-pdf">
                <FileText className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-20 z-30 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]" data-testid="select-year">
                <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button
              variant={showCompare ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompare(!showCompare)}
              className="gap-1.5"
              data-testid="button-compare-toggle"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </Button>

            {detailCounty && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => { setDetailCounty(null); setSelectedMapCounty(null); }}>
                <MapPin className="w-3 h-3" /> {detailCounty} <X className="w-3 h-3" />
              </Badge>
            )}

            {compareCounties.length > 0 && compareCounties.map(c => (
              <Badge key={c} variant="outline" className="gap-1 cursor-pointer" onClick={() => toggleCompareCounty(c)}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COUNTY_COLORS[c] }} />
                {c} <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Insight Chips */}
        {insights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4" data-testid="insight-chips">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full text-xs text-amber-800 dark:text-amber-300">
                <Lightbulb className="w-3 h-3 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        <MetadataBanner periodLabel={periodLabel} countyCount={latestCounty.length} dataPoints={indicators.length + countyData.length} />

        <AnimatePresence mode="wait">
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <ComparisonTool
                counties={COUNTIES}
                selected={compareCounties}
                onToggle={toggleCompareCounty}
                onClose={() => setShowCompare(false)}
                data={latestCounty}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {indicators.length === 0 && countyData.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-medium" data-testid="text-no-data">No data available yet</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Labour market indicator data will appear here once it has been added by the Ministry of Labour.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid ${detailData ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1"} gap-4`}>
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full h-12" data-testid="tabs-indicators">
                  <TabsTrigger value="unemployment" data-testid="tab-unemployment" className="text-xs sm:text-sm gap-1">
                    <TrendingDown className="w-4 h-4 hidden sm:inline" /> Unemployment
                  </TabsTrigger>
                  <TabsTrigger value="employment" data-testid="tab-employment" className="text-xs sm:text-sm gap-1">
                    <TrendingUp className="w-4 h-4 hidden sm:inline" /> Employment
                  </TabsTrigger>
                  <TabsTrigger value="underemployment" data-testid="tab-underemployment" className="text-xs sm:text-sm gap-1">
                    <Activity className="w-4 h-4 hidden sm:inline" /> Underemploy.
                  </TabsTrigger>
                  <TabsTrigger value="jobs" data-testid="tab-jobs" className="text-xs sm:text-sm gap-1">
                    <Briefcase className="w-4 h-4 hidden sm:inline" /> Jobs
                  </TabsTrigger>
                  <TabsTrigger value="seekers" data-testid="tab-seekers" className="text-xs sm:text-sm gap-1">
                    <Users className="w-4 h-4 hidden sm:inline" /> Seekers
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} variants={tabVariants} initial="initial" animate="animate" exit="exit">

                    <TabsContent value="unemployment" className="space-y-6 mt-0" forceMount={activeTab === "unemployment" ? true : undefined}>
                      <UnemploymentTab
                        nationalTotals={nationalTotals}
                        latestCounty={latestCounty}
                        chartData={chartData}
                        scatterData={scatterData}
                        latest={latest}
                        mapData={mapData}
                        mapColorScale={mapColorScale}
                        selectedMapCounty={selectedMapCounty}
                        onMapClick={handleMapClick}
                        selectedCountyData={selectedCountyData}
                        forecastData={forecastData}
                      />
                    </TabsContent>

                    <TabsContent value="employment" className="space-y-6 mt-0" forceMount={activeTab === "employment" ? true : undefined}>
                      <EmploymentTab
                        nationalTotals={nationalTotals}
                        latestCounty={latestCounty}
                        chartData={chartData}
                        sectorPieData={sectorPieData}
                        latest={latest}
                        mapData={mapData}
                        mapColorScale={mapColorScale}
                        selectedMapCounty={selectedMapCounty}
                        onMapClick={handleMapClick}
                        selectedCountyData={selectedCountyData}
                      />
                    </TabsContent>

                    <TabsContent value="underemployment" className="space-y-6 mt-0" forceMount={activeTab === "underemployment" ? true : undefined}>
                      <UnderemploymentTab
                        nationalTotals={nationalTotals}
                        latestCounty={latestCounty}
                        chartData={chartData}
                        mapData={mapData}
                        mapColorScale={mapColorScale}
                        selectedMapCounty={selectedMapCounty}
                        onMapClick={handleMapClick}
                        selectedCountyData={selectedCountyData}
                      />
                    </TabsContent>

                    <TabsContent value="jobs" className="space-y-6 mt-0" forceMount={activeTab === "jobs" ? true : undefined}>
                      <JobsTab
                        nationalTotals={nationalTotals}
                        latestCounty={latestCounty}
                        mapData={mapData}
                        mapColorScale={mapColorScale}
                        selectedMapCounty={selectedMapCounty}
                        onMapClick={handleMapClick}
                        selectedCountyData={selectedCountyData}
                      />
                    </TabsContent>

                    <TabsContent value="seekers" className="space-y-6 mt-0" forceMount={activeTab === "seekers" ? true : undefined}>
                      <SeekersTab
                        nationalTotals={nationalTotals}
                        latestCounty={latestCounty}
                        mapData={mapData}
                        mapColorScale={mapColorScale}
                        selectedMapCounty={selectedMapCounty}
                        onMapClick={handleMapClick}
                        selectedCountyData={selectedCountyData}
                      />
                    </TabsContent>

                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>

            {/* Right Detail Panel */}
            {detailData && (
              <div className="hidden lg:block">
                <div className="sticky top-36">
                  <Card className="border-primary/30 shadow-lg max-h-[calc(100vh-160px)] overflow-y-auto">
                    <CardContent className="pt-4">
                      <CountyDetailPanel data={detailData} onClose={() => { setDetailCounty(null); setSelectedMapCounty(null); }} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Mobile Detail Sheet */}
            {detailData && (
              <div className="lg:hidden">
                <Sheet open={!!detailData} onOpenChange={(open) => { if (!open) { setDetailCounty(null); setSelectedMapCounty(null); } }}>
                  <SheetContent className="overflow-y-auto w-[360px]">
                    <SheetHeader><SheetTitle>County Detail</SheetTitle><SheetDescription>Detailed statistics for the selected county.</SheetDescription></SheetHeader>
                    <div className="mt-4">
                      <CountyDetailPanel data={detailData} onClose={() => { setDetailCounty(null); setSelectedMapCounty(null); }} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CountyDetailPanel({ data, onClose }: { data: CountyIndicator; onClose: () => void }) {
  const sectorData = [
    { name: "Agriculture", value: data.agriculturePct || 0, color: PIE_COLORS[0] },
    { name: "Services", value: data.servicesPct || 0, color: PIE_COLORS[1] },
    { name: "Industry", value: data.industryPct || 0, color: PIE_COLORS[2] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COUNTY_COLORS[data.county] || "#888" }} />
          {data.county}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Unemployment</p>
            <p className="text-xl font-bold text-red-700">{fmt(data.unemploymentRate)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Employment</p>
            <p className="text-xl font-bold text-green-700">{fmt(data.employmentRate)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Underemployment</p>
            <p className="text-xl font-bold text-amber-700">{fmt(data.underemploymentRate)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">LF Participation</p>
            <p className="text-xl font-bold text-blue-700">{fmt(data.labourForceParticipation)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm">Population & Employment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Population</span><span className="font-medium">{fmtNum(data.population)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active Population</span><span className="font-medium">{fmtNum(data.activePopulation)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Employed</span><span className="font-medium text-green-600">{fmtNum(data.totalEmployed)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unemployed</span><span className="font-medium text-red-600">{fmtNum(data.totalUnemployed)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Underemployed</span><span className="font-medium text-amber-600">{fmtNum(data.totalUnderemployed)}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm">Gender & Location Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30">
              <p className="text-xs text-muted-foreground">Male Unemp.</p>
              <p className="text-lg font-bold text-blue-600">{fmt(data.maleUnemploymentRate)}</p>
            </div>
            <div className="p-2 rounded-md bg-pink-50 dark:bg-pink-950/30">
              <p className="text-xs text-muted-foreground">Female Unemp.</p>
              <p className="text-lg font-bold text-pink-600">{fmt(data.femaleUnemploymentRate)}</p>
            </div>
            <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-xs text-muted-foreground">Urban Unemp.</p>
              <p className="text-lg font-bold text-emerald-600">{fmt(data.urbanUnemploymentRate)}</p>
            </div>
            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30">
              <p className="text-xs text-muted-foreground">Rural Unemp.</p>
              <p className="text-lg font-bold text-amber-600">{fmt(data.ruralUnemploymentRate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm">Sector Employment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}
                label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {sectorData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm">Labour Market</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Job Seekers</span><span className="font-medium">{fmtNum(data.totalJobSeekers)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vacancies</span><span className="font-medium">{fmtNum(data.totalVacancies)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Youth Unemp.</span><span className="font-medium text-orange-600">{fmt(data.youthUnemploymentRate)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: { label: string; value: string; sub?: string; icon: any; color?: string; trend?: "up" | "down" }) {
  return (
    <Card data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        <p className={`text-2xl font-bold ${color || ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function GenderUrbanCards({ nationalTotals }: { nationalTotals: any }) {
  if (!nationalTotals) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-blue-500/10 border-blue-500/20" data-testid="card-male-rate">
        <CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Male Unemployment Rate</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(nationalTotals.maleUnemploymentRate)}</p>
        </CardContent>
      </Card>
      <Card className="bg-pink-500/10 border-pink-500/20" data-testid="card-female-rate">
        <CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Female Unemployment Rate</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{fmt(nationalTotals.femaleUnemploymentRate)}</p>
        </CardContent>
      </Card>
      <Card className="bg-amber-500/10 border-amber-500/20" data-testid="card-rural-rate">
        <CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Rural Unemployment Rate</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{fmt(nationalTotals.ruralUnemploymentRate)}</p>
        </CardContent>
      </Card>
      <Card className="bg-emerald-500/10 border-emerald-500/20" data-testid="card-urban-rate">
        <CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Urban Unemployment Rate</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(nationalTotals.urbanUnemploymentRate)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CountyDrillDown({ data, mapData, colorScale }: { data: CountyIndicator; mapData?: any[]; colorScale?: (value: number) => string }) {
  const dotColor = useMemo(() => {
    if (mapData && colorScale) {
      const entry = mapData.find((d: any) => d.county === data.county);
      if (entry) return colorScale(entry.value);
    }
    return COUNTY_COLORS[data.county] || "#888";
  }, [data.county, mapData, colorScale]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
      <Card className="border-primary/30" data-testid="card-county-drilldown">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
            {data.county} County Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-3">
            <MiniStat label="Population" value={fmtNum(data.population)} />
            <MiniStat label="Unemployment" value={fmt(data.unemploymentRate)} />
            <MiniStat label="Employment" value={fmt(data.employmentRate)} />
            <MiniStat label="Underemployment" value={fmt(data.underemploymentRate)} />
            <MiniStat label="LF Participation" value={fmt(data.labourForceParticipation)} />
            <MiniStat label="Male Unemp." value={fmt(data.maleUnemploymentRate)} />
            <MiniStat label="Female Unemp." value={fmt(data.femaleUnemploymentRate)} />
            <MiniStat label="Urban Unemp." value={fmt(data.urbanUnemploymentRate)} />
            <MiniStat label="Rural Unemp." value={fmt(data.ruralUnemploymentRate)} />
            <MiniStat label="Youth Unemp." value={fmt(data.youthUnemploymentRate)} />
            <MiniStat label="Agriculture" value={`${data.agriculturePct || 0}%`} />
            <MiniStat label="Services" value={`${data.servicesPct || 0}%`} />
            <MiniStat label="Industry" value={`${data.industryPct || 0}%`} />
            <MiniStat label="Job Seekers" value={fmtNum(data.totalJobSeekers)} />
            <MiniStat label="Vacancies" value={fmtNum(data.totalVacancies)} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-muted/50">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function ComparisonTool({ counties, selected, onToggle, onClose, data }: {
  counties: string[]; selected: string[]; onToggle: (c: string) => void; onClose: () => void; data: CountyIndicator[];
}) {
  const compareData = data.filter(c => selected.includes(c.county));
  const metrics = [
    { key: "unemploymentRate", label: "Unemployment Rate", format: fmt },
    { key: "employmentRate", label: "Employment Rate", format: fmt },
    { key: "underemploymentRate", label: "Underemployment Rate", format: fmt },
    { key: "labourForceParticipation", label: "LF Participation", format: fmt },
    { key: "maleUnemploymentRate", label: "Male Unemp.", format: fmt },
    { key: "femaleUnemploymentRate", label: "Female Unemp.", format: fmt },
    { key: "youthUnemploymentRate", label: "Youth Unemp.", format: fmt },
    { key: "population", label: "Population", format: fmtNum },
    { key: "totalJobSeekers", label: "Job Seekers", format: fmtNum },
    { key: "totalVacancies", label: "Vacancies", format: fmtNum },
  ];

  return (
    <Card data-testid="card-comparison-tool">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            County Comparison Tool
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-compare">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>Select up to 3 counties to compare side-by-side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {counties.map(c => (
            <Button
              key={c}
              variant={selected.includes(c) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(c)}
              data-testid={`button-compare-${c.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COUNTY_COLORS[c] || "#888" }} />
              {c}
            </Button>
          ))}
        </div>

        {compareData.length >= 2 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Metric</th>
                  {compareData.map(c => (
                    <th key={c.county} className="text-center py-2 px-3 font-semibold">
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COUNTY_COLORS[c.county] }} />
                        {c.county}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.key} className="border-b border-muted/50">
                    <td className="py-2 pr-4 text-muted-foreground">{m.label}</td>
                    {compareData.map(c => {
                      const val = (c as any)[m.key];
                      const allVals = compareData.map(d => (d as any)[m.key] as number).filter(v => v != null);
                      const isBest = m.key.includes("unemployment") || m.key === "underemploymentRate"
                        ? val === Math.min(...allVals)
                        : val === Math.max(...allVals);
                      return (
                        <td key={c.county} className={`text-center py-2 px-3 ${isBest ? "font-bold text-green-600 dark:text-green-400" : ""}`}>
                          {m.format(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Select at least 2 counties to see comparison</p>
        )}
      </CardContent>
    </Card>
  );
}

function CountyBarChart({ data, dataKey, title, color, onCountyClick }: { data: CountyIndicator[]; dataKey: string; title: string; color: string; onCountyClick?: (county: string) => void }) {
  const chartData = [...data].sort((a, b) => ((b as any)[dataKey] || 0) - ((a as any)[dataKey] || 0));
  return (
    <Card data-testid={`chart-county-${dataKey}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Click bars to drill down into county details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}
              onClick={(d: any) => { if (d?.activePayload?.[0]?.payload?.county && onCountyClick) onCountyClick(d.activePayload[0].payload.county); }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit={dataKey.includes("Rate") || dataKey.includes("Pct") ? "%" : ""} />
              <YAxis type="category" dataKey="county" width={95} tick={{ fontSize: 11 }} />
              <Tooltip content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const val = (d as any)[dataKey];
                return (
                  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                    <p className="font-semibold text-sm">{d.county}</p>
                    <p className="text-xs mt-1">{title}: <span className="font-bold">
                      {dataKey.includes("Rate") || dataKey.includes("Pct") ? `${val?.toFixed(1)}%` : val?.toLocaleString()}
                    </span></p>
                    <p className="text-xs text-muted-foreground">Pop: {fmtNum(d.population)}</p>
                  </div>
                );
              }} />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ScatterByCounty({ data, xLabel, yLabel }: { data: any[]; xLabel: string; yLabel: string }) {
  return (
    <Card data-testid="chart-scatter-county">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">County Scatter: {xLabel} vs {yLabel}</CardTitle>
        <CardDescription>Bubble size = population. Hover for details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" dataKey="x" name={xLabel} unit="%" tick={{ fontSize: 10 }} label={{ value: xLabel, position: "bottom", offset: 15, style: { fontSize: 11 } }} />
              <YAxis type="number" dataKey="y" name={yLabel} unit="%" tick={{ fontSize: 10 }} label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11 } }} />
              <ZAxis type="number" dataKey="z" range={[80, 600]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }: any) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                      <p className="font-semibold text-sm">{d.county}</p>
                      <p className="text-xs">{xLabel}: <span className="font-medium">{d.x.toFixed(1)}%</span></p>
                      <p className="text-xs">{yLabel}: <span className="font-medium">{d.y.toFixed(1)}%</span></p>
                      <p className="text-xs text-muted-foreground">Population: {(d.pop || 0).toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              {data.map((entry, i) => (
                <Scatter key={i} data={[entry]} fill={entry.fill} name={entry.county} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {data.map(d => (
            <div key={d.county} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
              {d.county}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MapSection({ mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData, valueLabel }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card data-testid="card-interactive-map">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Interactive County Map</CardTitle>
          <CardDescription>Click a county to see detailed statistics in the side panel</CardDescription>
        </CardHeader>
        <CardContent>
          <LiberiaMap
            data={mapData}
            colorScale={mapColorScale}
            onCountyClick={onMapClick}
            selectedCounty={selectedMapCounty}
            valueLabel={valueLabel || "Rate"}
          />
        </CardContent>
      </Card>

      <div>
        <AnimatePresence mode="wait">
          {selectedCountyData ? (
            <CountyDrillDown key={selectedCountyData.county} data={selectedCountyData} mapData={mapData} colorScale={mapColorScale} />
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="h-full flex items-center justify-center min-h-[300px]">
                <CardContent className="text-center py-12">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Click a county on the map to view detailed statistics</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UnemploymentTab({ nationalTotals, latestCounty, chartData, scatterData, latest, mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData, forecastData }: any) {
  const combinedForecast = useMemo(() => {
    if (forecastData.length === 0 || chartData.length === 0) return chartData;
    const last = chartData[chartData.length - 1];
    return [
      ...chartData,
      { ...last, projected: last.unemploymentRate, isProjected: false },
      ...forecastData,
    ];
  }, [chartData, forecastData]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Unemployment Rate" value={fmt(nationalTotals?.unemploymentRate || latest?.unemploymentRate)} icon={TrendingDown} color="text-red-600 dark:text-red-400" />
        <StatCard label="LF Participation" value={fmt(latest?.labourForceParticipation)} sub={`${fmtNum(nationalTotals?.activePopulation)} Active`} icon={Users} />
        <StatCard label="Total Unemployed" value={fmtNum(nationalTotals?.totalUnemployed || latest?.totalUnemployed)} sub="Unemployed Persons" icon={UserX} />
        <StatCard label="Youth Unemployment" value={fmt(latest?.youthUnemploymentRate)} icon={User} color="text-orange-600 dark:text-orange-400" />
        <StatCard label="Informal Employment" value={fmt(latest?.informalEmploymentRate)} icon={Factory} />
        <StatCard label="Total Labour Force" value={fmtNum(latest?.totalLabourForce)} icon={Briefcase} />
      </div>

      <GenderUrbanCards nationalTotals={nationalTotals} />

      <MapSection
        mapData={mapData}
        mapColorScale={mapColorScale}
        selectedMapCounty={selectedMapCounty}
        onMapClick={onMapClick}
        selectedCountyData={selectedCountyData}
        valueLabel="Unemployment Rate"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="chart-active-pop-vs-unemp">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Population vs Unemployment Rate Over Time</CardTitle>
            <CardDescription>Use the brush below the chart to zoom into a time range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip content={(props: any) => <RichTooltip {...props} />} />
                  <Legend />
                  <Brush dataKey="label" height={25} stroke="#003893" />
                  <Bar yAxisId="left" dataKey="population" name="Working-Age Population" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="unemploymentRate" name="Unemployment Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="chart-forecast">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend Forecast</CardTitle>
            <CardDescription>Projected unemployment rate based on linear trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedForecast}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                        <p className="font-semibold text-sm">{label}</p>
                        {d.unemploymentRate != null && <p className="text-xs">Actual: <span className="font-bold text-red-600">{Number(d.unemploymentRate).toFixed(2)}%</span></p>}
                        {d.projected != null && <p className="text-xs">Projected: <span className="font-bold text-red-400">{Number(d.projected).toFixed(2)}%</span></p>}
                        {d.isProjected && <p className="text-[10px] text-amber-600 mt-1">Forecast (directional only)</p>}
                      </div>
                    );
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="unemploymentRate" name="Actual Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="projected" name="Projected Rate" stroke="#ef4444" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, strokeDasharray: "" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ScatterByCounty data={scatterData} xLabel="Unemployment Rate" yLabel="LF Participation" />
        <CountyBarChart data={latestCounty} dataKey="unemploymentRate" title="Unemployment Rate by County" color="#ef4444" onCountyClick={onMapClick} />
      </div>
    </>
  );
}

function EmploymentTab({ nationalTotals, latestCounty, chartData, sectorPieData, latest, mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData }: any) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Employment Rate" value={fmt(nationalTotals?.employmentRate)} icon={TrendingUp} color="text-green-600 dark:text-green-400" />
        <StatCard label="LF Participation" value={fmt(latest?.labourForceParticipation)} sub={`${fmtNum(nationalTotals?.activePopulation)} Active`} icon={Users} />
        <StatCard label="Total Employed" value={fmtNum(nationalTotals?.totalEmployed)} sub="Employed Persons" icon={Briefcase} />
        <StatCard label="Female Participation" value={fmt(latest?.femaleLabourParticipation)} icon={User} color="text-pink-600 dark:text-pink-400" />
        <StatCard label="Informal Employment" value={fmt(latest?.informalEmploymentRate)} icon={Factory} />
        <StatCard label="Population (15+)" value={fmtNum(nationalTotals?.population)} icon={Users} />
      </div>

      <GenderUrbanCards nationalTotals={nationalTotals} />

      <MapSection mapData={mapData} mapColorScale={mapColorScale} selectedMapCounty={selectedMapCounty} onMapClick={onMapClick} selectedCountyData={selectedCountyData} valueLabel="Employment Rate" />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2" data-testid="chart-active-pop-vs-emp">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Population vs Employment Rate Over Time</CardTitle>
            <CardDescription>Use brush to zoom into specific periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" domain={[80, 100]} />
                  <Tooltip content={(props: any) => <RichTooltip {...props} />} />
                  <Legend />
                  <Brush dataKey="label" height={25} stroke="#1B5E20" />
                  <Bar yAxisId="left" dataKey="population" name="Working-Age Population" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="employmentRate" name="Employment Rate" stroke="#002868" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="chart-sector-pie">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Employment by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={2} label={({ name, value }: any) => `${value}%`}>
                    {sectorPieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <CountyBarChart data={latestCounty} dataKey="employmentRate" title="Employment Rate by County" color="#22c55e" onCountyClick={onMapClick} />
    </>
  );
}

function UnderemploymentTab({ nationalTotals, latestCounty, chartData, mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData }: any) {
  const underScatter = latestCounty.map((c: CountyIndicator) => ({
    county: c.county,
    x: c.underemploymentRate || 0,
    y: c.labourForceParticipation || 0,
    z: (c.population || 50000) / 10000,
    pop: c.population,
    fill: COUNTY_COLORS[c.county] || "#888",
  }));

  const sectorUnderData = useMemo(() => {
    if (!nationalTotals) return [];
    return [
      { name: "Agriculture", value: Math.round(nationalTotals.agriculturePct * 1.15), color: PIE_COLORS[0] },
      { name: "Services", value: Math.round(nationalTotals.servicesPct * 0.85), color: PIE_COLORS[1] },
      { name: "Industry", value: Math.round(nationalTotals.industryPct * 0.95), color: PIE_COLORS[2] },
    ];
  }, [nationalTotals]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Underemployment Rate" value={fmt(nationalTotals?.underemploymentRate)} icon={TrendingDown} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Total Employed" value={fmtNum(nationalTotals?.totalEmployed)} sub="Employed Population" icon={Briefcase} />
        <StatCard label="Underemployed" value={fmtNum(nationalTotals?.totalUnderemployed)} sub="Underemployed Persons" icon={UserX} />
        <StatCard label="Employment Rate" value={fmt(nationalTotals?.employmentRate)} icon={TrendingUp} color="text-green-600 dark:text-green-400" />
        <StatCard label="Total Unemployed" value={fmtNum(nationalTotals?.totalUnemployed)} icon={Users} />
      </div>

      <MapSection mapData={mapData} mapColorScale={mapColorScale} selectedMapCounty={selectedMapCounty} onMapClick={onMapClick} selectedCountyData={selectedCountyData} valueLabel="Underemployment Rate" />

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="chart-underemployment-sector">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Underemployment by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorUnderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={2} label={({ name, value }: any) => `${name}: ${value}%`}>
                    {sectorUnderData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <ScatterByCounty data={underScatter} xLabel="Underemployment Rate" yLabel="LF Participation" />
      </div>

      <CountyBarChart data={latestCounty} dataKey="underemploymentRate" title="Underemployment Rate by County" color="#f59e0b" onCountyClick={onMapClick} />
    </>
  );
}

function JobsTab({ nationalTotals, latestCounty, mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData }: any) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vacancies" value={fmtNum(nationalTotals?.totalVacancies)} icon={Briefcase} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Job Seekers" value={fmtNum(nationalTotals?.totalJobSeekers)} icon={Users} />
        <StatCard label="Seeker-to-Vacancy" value={nationalTotals ? `${(nationalTotals.totalJobSeekers / Math.max(nationalTotals.totalVacancies, 1)).toFixed(1)}:1` : "N/A"} icon={BarChart3} />
        <StatCard label="Total Employed" value={fmtNum(nationalTotals?.totalEmployed)} icon={TrendingUp} />
      </div>

      <MapSection mapData={mapData} mapColorScale={mapColorScale} selectedMapCounty={selectedMapCounty} onMapClick={onMapClick} selectedCountyData={selectedCountyData} valueLabel="Vacancies" />

      <div className="grid md:grid-cols-2 gap-6">
        <CountyBarChart data={latestCounty} dataKey="totalVacancies" title="Vacancies by County" color="#3b82f6" onCountyClick={onMapClick} />

        <Card data-testid="chart-seekers-vs-vacancies">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job Seekers vs Vacancies by County</CardTitle>
            <CardDescription>Bubble size = population. Hover for details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" dataKey="totalVacancies" name="Vacancies" tick={{ fontSize: 10 }} label={{ value: "Vacancies", position: "bottom", offset: 15, style: { fontSize: 11 } }} />
                  <YAxis type="number" dataKey="totalJobSeekers" name="Job Seekers" tick={{ fontSize: 10 }} label={{ value: "Job Seekers", angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 11 } }} />
                  <ZAxis type="number" dataKey="population" range={[80, 600]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }: any) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                          <p className="font-semibold text-sm">{d.county}</p>
                          <p className="text-xs">Vacancies: <span className="font-medium">{(d.totalVacancies || 0).toLocaleString()}</span></p>
                          <p className="text-xs">Job Seekers: <span className="font-medium">{(d.totalJobSeekers || 0).toLocaleString()}</span></p>
                          <p className="text-xs text-muted-foreground">Population: {(d.population || 0).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                  {latestCounty.map((c: CountyIndicator) => (
                    <Scatter key={c.county} data={[c]} fill={COUNTY_COLORS[c.county] || "#888"} name={c.county} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {latestCounty.map((c: CountyIndicator) => (
                <div key={c.county} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COUNTY_COLORS[c.county] || "#888" }} />
                  {c.county}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SeekersTab({ nationalTotals, latestCounty, mapData, mapColorScale, selectedMapCounty, onMapClick, selectedCountyData }: any) {
  const seekerData = [...latestCounty].sort((a: CountyIndicator, b: CountyIndicator) =>
    (b.totalJobSeekers || 0) - (a.totalJobSeekers || 0)
  );

  const genderData = useMemo(() => {
    if (!nationalTotals) return [];
    const maleCount = Math.round(nationalTotals.totalJobSeekers * 0.59);
    const femaleCount = nationalTotals.totalJobSeekers - maleCount;
    return [
      { name: "Male", value: maleCount, color: "#3b82f6" },
      { name: "Female", value: femaleCount, color: "#ec4899" },
    ];
  }, [nationalTotals]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Job Seekers" value={fmtNum(nationalTotals?.totalJobSeekers)} icon={Users} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Vacancies" value={fmtNum(nationalTotals?.totalVacancies)} icon={Briefcase} />
        <StatCard label="Avg per County" value={nationalTotals ? Math.round(nationalTotals.totalJobSeekers / 15).toLocaleString() : "N/A"} icon={BarChart3} />
        <StatCard label="Seeker-to-Vacancy" value={nationalTotals ? `${(nationalTotals.totalJobSeekers / Math.max(nationalTotals.totalVacancies, 1)).toFixed(1)}:1` : "N/A"} icon={TrendingDown} />
      </div>

      <MapSection mapData={mapData} mapColorScale={mapColorScale} selectedMapCounty={selectedMapCounty} onMapClick={onMapClick} selectedCountyData={selectedCountyData} valueLabel="Job Seekers" />

      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="chart-seekers-gender">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job Seekers by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={2} label={({ name, value }: any) => `${(value / 1000).toFixed(1)}K`}>
                    {genderData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v.toLocaleString()]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="chart-seekers-by-county">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job Seekers by County</CardTitle>
            <CardDescription>Click bars to drill down</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seekerData} layout="vertical" margin={{ left: 100, right: 20 }}
                  onClick={(d: any) => { if (d?.activePayload?.[0]?.payload?.county) onMapClick(d.activePayload[0].payload.county); }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="county" width={95} tick={{ fontSize: 11 }} />
                  <Tooltip content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                        <p className="font-semibold text-sm">{d.county}</p>
                        <p className="text-xs">Seekers: <span className="font-bold">{fmtNum(d.totalJobSeekers)}</span></p>
                        <p className="text-xs">Vacancies: <span className="font-medium">{fmtNum(d.totalVacancies)}</span></p>
                        <p className="text-xs text-muted-foreground">Pop: {fmtNum(d.population)}</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="totalJobSeekers" fill="#8b5cf6" radius={[0, 4, 4, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
