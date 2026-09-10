import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, TrendingUp, TrendingDown, BarChart3, ExternalLink,
  Briefcase, Users, Building2, Activity, DollarSign, FileText,
  ChevronRight, Globe, BookOpen, ArrowRight, Database, Shield, LineChart, Loader2, Calculator
} from "lucide-react";
import { LiberiaMap } from "@/components/LiberiaMap";

const LIBERIAN_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type LatestNumberItem = {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  color: string;
  href: string;
  trend?: "up" | "down" | "flat";
};

export default function DataHub() {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [calcAmount, setCalcAmount] = useState("1000");
  const [calcFromMonth, setCalcFromMonth] = useState("1");
  const [calcFromYear, setCalcFromYear] = useState("2024");
  const [calcToMonth, setCalcToMonth] = useState("1");
  const [calcToYear, setCalcToYear] = useState("2025");
  const [calcSubmittedParams, setCalcSubmittedParams] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<any[]>({ queryKey: ["/api/stats"] });
  const { data: labourData, isLoading: labourLoading } = useQuery<any[]>({ queryKey: ["/api/labour-indicators"] });
  const { data: countyData, isLoading: countyLoading } = useQuery<any[]>({ queryKey: ["/api/county-indicators"] });
  const { data: econData } = useQuery<any>({ queryKey: ["/api/economic-indicators"] });
  const { data: sectorData } = useQuery<any[]>({ queryKey: ["/api/sectors"] });

  const { data: calcData, isLoading: calcLoading } = useQuery<{ result: number }>({
    queryKey: [calcSubmittedParams],
    enabled: !!calcSubmittedParams,
  });

  const handleCalculate = () => {
    setCalcSubmittedParams(`/api/inflation-calculator?amount=${encodeURIComponent(calcAmount)}&fromMonth=${calcFromMonth}&fromYear=${calcFromYear}&toMonth=${calcToMonth}&toYear=${calcToYear}`);
  };

  const isLoading = statsLoading || labourLoading || countyLoading;

  const latest = useMemo(() => {
    if (!labourData || labourData.length === 0) return null;
    return [...labourData].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    })[0];
  }, [labourData]);

  const latestCounty = useMemo(() => {
    if (!countyData || countyData.length === 0) return [];
    const maxYear = Math.max(...countyData.map((c: any) => c.year));
    return countyData.filter((c: any) => c.year === maxYear);
  }, [countyData]);

  const selectedCountyInfo = useMemo(() => {
    if (!selectedCounty || !latestCounty.length) return null;
    return latestCounty.find((c: any) => c.county === selectedCounty);
  }, [selectedCounty, latestCounty]);

  const mapData = useMemo(() => {
    return latestCounty.map((c: any) => ({
      county: c.county,
      value: c.unemploymentRate || 0,
      label: `${(c.unemploymentRate || 0).toFixed(1)}%`,
      population: c.population || 0,
      extra: {
        "Employed": (c.totalEmployed || 0).toLocaleString(),
        "Unemployed": (c.totalUnemployed || 0).toLocaleString(),
        "Job Seekers": (c.totalJobSeekers || 0).toLocaleString(),
      },
    }));
  }, [latestCounty]);

  const mapColorScale = useCallback((value: number) => {
    if (value <= 4) return "#22c55e";
    if (value <= 6) return "#84cc16";
    if (value <= 8) return "#eab308";
    if (value <= 10) return "#f97316";
    return "#ef4444";
  }, []);

  const latestNumbers: LatestNumberItem[] = useMemo(() => {
    const items: LatestNumberItem[] = [];
    if (econData) {
      items.push({
        label: "Consumer Price Index (CPI)",
        value: econData.nationalCPI ? `${econData.nationalCPI}` : "—",
        detail: econData.availableYears?.[0] ? `in ${econData.availableYears[0]}` : "",
        icon: DollarSign, color: "text-blue-600", href: "/economic-indicators",
        trend: econData.nationalCPI > 100 ? "up" : "flat",
      });
    }
    if (latest) {
      items.push({
        label: "Unemployment Rate",
        value: `${latest.unemploymentRate}%`,
        detail: `Q${latest.quarter || ""} ${latest.year}`,
        icon: Users, color: "text-red-600", href: "/labour-indicators",
        trend: "down",
      });
      items.push({
        label: "Labour Force Participation",
        value: `${latest.labourForceParticipation}%`,
        detail: `Q${latest.quarter || ""} ${latest.year}`,
        icon: Activity, color: "text-green-600", href: "/labour-indicators",
        trend: "up",
      });
      items.push({
        label: "Youth Unemployment",
        value: `${latest.youthUnemploymentRate}%`,
        detail: `Q${latest.quarter || ""} ${latest.year}`,
        icon: Users, color: "text-amber-600", href: "/labour-indicators",
        trend: "down",
      });
      items.push({
        label: "Informal Employment Rate",
        value: `${latest.informalEmploymentRate}%`,
        detail: `Q${latest.quarter || ""} ${latest.year}`,
        icon: Building2, color: "text-purple-600", href: "/labour-indicators",
      });
    }
    if (econData) {
      items.push({
        label: "Average Monthly Wage",
        value: `L$${(econData.nationalAvgWage || 0).toLocaleString()}`,
        detail: econData.availableYears?.[0] ? `in ${econData.availableYears[0]}` : "",
        icon: DollarSign, color: "text-emerald-600", href: "/economic-indicators",
      });
      items.push({
        label: "Median Monthly Wage",
        value: `L$${(econData.nationalMedianWage || 0).toLocaleString()}`,
        detail: econData.availableYears?.[0] ? `in ${econData.availableYears[0]}` : "",
        icon: DollarSign, color: "text-teal-600", href: "/occupational-economics",
      });
    }
    const totalJobs = stats?.find((s: any) => s.id === "total-jobs");
    if (totalJobs) {
      items.push({
        label: "Total Employment Spells",
        value: totalJobs.value?.toLocaleString() || "—",
        detail: "tracked in system",
        icon: Briefcase, color: "text-indigo-600", href: "/observatory",
      });
    }
    const vacancies = stats?.find((s: any) => s.id === "vacancies");
    if (vacancies) {
      items.push({
        label: "Active Job Postings",
        value: vacancies.value?.toLocaleString() || "—",
        detail: "current vacancies",
        icon: FileText, color: "text-cyan-600", href: "/jobs",
      });
    }
    return items;
  }, [latest, econData, stats]);

  const quickLinks = [
    { label: "Labour Market Indicators", desc: "Unemployment, employment, underemployment trends", href: "/labour-indicators", icon: BarChart3, color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" },
    { label: "Economic Indicators", desc: "CPI, cost of living, wage affordability", href: "/economic-indicators", icon: DollarSign, color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
    { label: "Occupational Economics", desc: "Wages by occupation, demand trends, skills gap", href: "/occupational-economics", icon: LineChart, color: "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300" },
    { label: "Statistical Rigor", desc: "Data quality checks, sampling, methodology", href: "/statistical-rigor", icon: Shield, color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" },
    { label: "Jobs Observatory", desc: "Track employment spells and verifications", href: "/observatory", icon: Briefcase, color: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
    { label: "Knowledge Base", desc: "Policy documents, research, publications", href: "/knowledge-base", icon: BookOpen, color: "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="data-hub-page">
      <Header />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                  Economic Data Hub
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Republic of Liberia — Ministry of Labour
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
              Your central gateway to Liberia's labour market and economic statistics.
              Browse geographic data, calculate purchasing power, and access the latest indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden" data-testid="card-geographic">
                <div className="bg-gradient-to-r from-[#003893] to-[#003070] p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Globe className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Geographic Information</h2>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">
                    LiJOBS covers all 15 counties with economic data collection. Select a county to explore.
                  </p>
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5 mb-4" data-testid="county-tabs">
                    {LIBERIAN_COUNTIES.map(county => (
                      <Button
                        key={county}
                        variant={selectedCounty === county ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCounty(selectedCounty === county ? null : county)}
                        className="text-xs h-7 px-2.5"
                        data-testid={`county-tab-${county.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {county}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="aspect-square max-h-[320px]" data-testid="county-map">
                      <LiberiaMap
                        data={mapData}
                        colorScale={mapColorScale}
                        onCountyClick={(c) => setSelectedCounty(c)}
                        selectedCounty={selectedCounty}
                        valueLabel="Unemployment Rate"
                      />
                    </div>

                    <div className="space-y-3" data-testid="county-details">
                      {selectedCountyInfo ? (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h3 className="font-bold text-lg">{selectedCountyInfo.county}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Population", value: (selectedCountyInfo.population || 0).toLocaleString() },
                              { label: "Unemployment", value: `${(selectedCountyInfo.unemploymentRate || 0).toFixed(1)}%` },
                              { label: "Employment Rate", value: `${(selectedCountyInfo.employmentRate || 0).toFixed(1)}%` },
                              { label: "Total Employed", value: (selectedCountyInfo.totalEmployed || 0).toLocaleString() },
                              { label: "Total Unemployed", value: (selectedCountyInfo.totalUnemployed || 0).toLocaleString() },
                              { label: "Job Seekers", value: (selectedCountyInfo.totalJobSeekers || 0).toLocaleString() },
                              { label: "Vacancies", value: (selectedCountyInfo.totalVacancies || 0).toLocaleString() },
                              { label: "Youth Unemp.", value: `${(selectedCountyInfo.youthUnemploymentRate || 0).toFixed(1)}%` },
                            ].map(item => (
                              <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Link href="/labour-indicators">
                              <Button variant="outline" size="sm" className="text-xs gap-1" data-testid="btn-view-county-indicators">
                                View Full Indicators <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Link href="/economic-indicators">
                              <Button variant="outline" size="sm" className="text-xs gap-1" data-testid="btn-view-county-economic">
                                Economic Data <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Select a county from the tabs above or click on the map
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Browse available data for all 15 Liberian counties
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden" data-testid="card-inflation-calculator">
                  <div className="bg-gradient-to-r from-[#BF0A30] to-[#a00828] p-4">
                    <div className="flex items-center gap-2 text-white">
                      <Calculator className="w-5 h-5" />
                      <h2 className="text-lg font-bold">LRD Inflation Calculator</h2>
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">L$</span>
                      <Input
                        type="number"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        className="flex-1"
                        placeholder="Enter amount"
                        data-testid="input-calc-amount"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">in</span>
                      <Select value={calcFromMonth} onValueChange={setCalcFromMonth}>
                        <SelectTrigger className="flex-1" data-testid="select-from-month">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={calcFromYear} onValueChange={setCalcFromYear}>
                        <SelectTrigger className="w-24" data-testid="select-from-year">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025].map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      has the same buying power as
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8 flex items-center justify-center">
                        <span className="bg-[#003893] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">L$</span>
                      </span>
                      <Select value={calcToMonth} onValueChange={setCalcToMonth}>
                        <SelectTrigger className="flex-1" data-testid="select-to-month">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={calcToYear} onValueChange={setCalcToYear}>
                        <SelectTrigger className="w-24" data-testid="select-to-year">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025].map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full bg-[#003893] hover:bg-[#002c75] text-white"
                      onClick={handleCalculate}
                      disabled={calcLoading}
                      data-testid="btn-calculate"
                    >
                      {calcLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating...</> : "Calculate"}
                    </Button>
                    {calcData?.result !== undefined && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center" data-testid="calc-result">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Equivalent purchasing power:</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                          L$ {calcData.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">
                          Based on LiJOBS CPI basket data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden" data-testid="card-quick-charts">
                  <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-4">
                    <div className="flex items-center gap-2 text-white">
                      <BarChart3 className="w-5 h-5" />
                      <h2 className="text-lg font-bold">Charts & Analytics</h2>
                    </div>
                    <p className="text-gray-300 text-xs mt-1">
                      Interactive charts complement all LiJOBS data releases
                    </p>
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {quickLinks.map(link => (
                        <Link key={link.href} href={link.href}>
                          <div
                            className={`flex items-center gap-3 p-2.5 rounded-lg ${link.color} cursor-pointer hover:opacity-90 transition-opacity`}
                            data-testid={`quick-link-${link.href.replace(/\//g, "-").slice(1)}`}
                          >
                            <link.icon className="w-4 h-4 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{link.label}</p>
                              <p className="text-[10px] opacity-70 truncate">{link.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden" data-testid="card-sector-overview">
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Sector Overview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {(sectorData || []).map((s: any) => (
                      <div
                        key={s.sector}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"
                        data-testid={`sector-${s.sector.toLowerCase()}`}
                      >
                        <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.sector}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{(s.jobs || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">jobs tracked</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="overflow-hidden" data-testid="card-latest-numbers">
                <div className="bg-[#003893] p-3">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Latest Numbers
                  </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {latestNumbers.map((item, i) => (
                    <Link key={i} href={item.href}>
                      <div
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        data-testid={`latest-number-${i}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                              {item.label}:
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                              {item.trend === "down" && <TrendingDown className="w-3 h-3 text-green-500" />}
                              <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                              <span className="text-xs text-gray-400">{item.detail}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 mt-1 shrink-0">
                            <Link href={item.href}>
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors" title="Historical Data">
                                <BarChart3 className="w-3 h-3" />
                              </span>
                            </Link>
                            <Link href={item.href}>
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" title="View Details">
                                <FileText className="w-3 h-3" />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-green-600" /> Historical Data
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-600" /> View Report
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Source: LiJOBS / LISGIS {latest?.year || "2024"}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden" data-testid="card-data-tools">
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Data Tools
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Report Jobs / Employment", href: "/report-jobs", icon: Briefcase },
                      { label: "Price Data Entry", href: "/price-entry", icon: DollarSign },
                      { label: "Bulk Upload", href: "/bulk-upload", icon: Database },
                      { label: "Export Reports", href: "/reports", icon: FileText },
                      { label: "Workplace Safety", href: "/workplace-safety", icon: Shield },
                    ].map(tool => (
                      <Link key={tool.href} href={tool.href}>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" data-testid={`tool-link-${tool.href.replace(/\//g, "-").slice(1)}`}>
                          <tool.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{tool.label}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300 ml-auto" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden" data-testid="card-methodology">
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Methodology & Quality
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    LiJOBS follows ILO standards and uses transparent statistical methods for all published indicators.
                  </p>
                  <div className="space-y-2">
                    <Link href="/statistical-rigor">
                      <Badge variant="secondary" className="cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Statistical Rigor Suite <ChevronRight className="w-3 h-3 ml-1" />
                      </Badge>
                    </Link>
                    <Link href="/methodology">
                      <Badge variant="secondary" className="cursor-pointer text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Methodology Guide <ChevronRight className="w-3 h-3 ml-1" />
                      </Badge>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
