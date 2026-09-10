import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell,
  PieChart, Pie, ComposedChart, ReferenceLine, Brush,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3,
  MapPin, Scale, Wallet, AlertTriangle, CheckCircle, PlusCircle,
  Download, BookOpen, Info, Calendar, Database,
  ArrowLeftRight, Lightbulb, ChevronRight, GitCompare, Activity,
  X,
} from "lucide-react";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/Header";

const COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const COLORS = [
  "#003893", "#CE1126", "#1B5E20", "#FF6F00", "#0277BD",
  "#6A1B9A", "#C62828", "#00695C", "#EF6C00", "#283593",
  "#2E7D32", "#AD1457", "#4527A0", "#00838F", "#D84315"
];

function formatLRD(value: number) {
  if (value >= 1000000) return `L$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `L$${(value / 1000).toFixed(1)}K`;
  return `L$${value.toLocaleString()}`;
}

interface CountyDetail {
  county: string;
  cpi: number;
  cpiItems: number;
  basketCost: number;
  categories: Record<string, number>;
  avgWage: number;
  medianWage: number;
  wageCount: number;
  minWage: number;
  maxWage: number;
  ratio: number;
  surplus: number;
  monthlyBasket: { month: string; cost: number; monthNum: number }[];
  monthlyCPI: { month: string; cpi: number; monthNum: number }[];
  topDrivers: { category: string; cost: number; share: number }[];
}

interface EconomicData {
  targetYear: number;
  baseYear: number;
  nationalCPI: number;
  nationalAvgWage: number;
  nationalMedianWage: number;
  avgBasketCost: number;
  nationalRatio: number;
  cpiByCounty: Record<string, { current: number; base: number; cpi: number; items: number }>;
  costOfLivingByCounty: Record<string, { totalBasket: number; categories: Record<string, number> }>;
  wagesByCounty: Record<string, { avgWage: number; medianWage: number; count: number; minWage: number; maxWage: number }>;
  wageVsCost: Record<string, { avgWage: number; basketCost: number; affordabilityRatio: number; surplus: number }>;
  priceTrends: Record<string, { month: string; avgPrice: number; monthNum: number; year: number }[]>;
  totalPriceEntries: number;
  countiesWithData: number;
  rankings: CountyDetail[];
  scatterData: { county: string; basketCost: number; avgWage: number; ratio: number; surplus: number; workers: number }[];
  insights: string[];
  selectedCountyDetail: CountyDetail | null;
  compareCountyDetail: CountyDetail | null;
  lastUpdated: string;
}

function MetadataBanner({ lastUpdated, dataSource, note }: { lastUpdated?: string; dataSource?: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2 px-1" data-testid="metadata-banner">
      {lastUpdated && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Updated: {lastUpdated}</span>}
      {dataSource && <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Source: {dataSource}</span>}
      {note && <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {note}</span>}
    </div>
  );
}

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
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm">
          <div>
            <h3 className="font-semibold text-base mb-2">Key Definitions</h3>
            <dl className="space-y-3">
              <div><dt className="font-medium text-primary">Consumer Price Index (CPI)</dt>
              <dd className="text-muted-foreground mt-0.5">Ratio of current-year average prices to base-year average prices × 100. Values above 100 indicate price inflation. Computed per county from the basket of goods collected monthly.</dd></div>
              <div><dt className="font-medium text-primary">Basket Cost</dt>
              <dd className="text-muted-foreground mt-0.5">Total cost of the standard basket of 20 goods (staples, proteins, oils, energy, etc.) for the latest available month in the selected year, per county.</dd></div>
              <div><dt className="font-medium text-primary">Affordability Ratio</dt>
              <dd className="text-muted-foreground mt-0.5">Average monthly wage divided by monthly basket cost. A ratio below 1.0 means workers cannot afford the basic basket (deficit); above 1.0 means surplus.</dd></div>
              <div><dt className="font-medium text-primary">Price Trends</dt>
              <dd className="text-muted-foreground mt-0.5">Monthly average prices per category across all counties. Shows how different goods categories (staples, oils, proteins) move over time.</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Data Sources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Price Entries:</strong> Monthly basket prices collected by Ministry staff and enumerators across all 15 counties.</span></li>
              <li className="flex items-start gap-2"><Database className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> <span><strong>Wages:</strong> Salary data from verified employment spells in the LiJOBS observatory.</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">Methodology Notes</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>CPI uses simple arithmetic mean of item prices (Laspeyres-type index without expenditure weights).</li>
              <li>Basket cost reflects the latest month with data in the selected year.</li>
              <li>Wage data comes from all employment spells with salary records — may not include informal or self-employment.</li>
              <li>Affordability analysis requires both wage and price data for the same county; counties missing either are excluded.</li>
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

function CountyDetailSheet({ detail, onClose }: { detail: CountyDetail; onClose: () => void }) {
  const pieData = Object.entries(detail.categories).map(([name, value]) => ({ name, value: Math.round(value) }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> {detail.county}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">CPI</p>
            <p className="text-xl font-bold text-blue-700">{detail.cpi}</p>
            <p className="text-[10px] text-muted-foreground">{detail.cpiItems} price entries</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Basket Cost</p>
            <p className="text-xl font-bold text-purple-700">{formatLRD(detail.basketCost)}</p>
            <p className="text-[10px] text-muted-foreground">monthly</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Avg Wage</p>
            <p className="text-xl font-bold text-green-700">{formatLRD(detail.avgWage)}</p>
            <p className="text-[10px] text-muted-foreground">{detail.wageCount} workers</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${detail.ratio >= 1 ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground">Affordability</p>
            <p className={`text-xl font-bold ${detail.ratio >= 1 ? "text-green-700" : "text-red-700"}`}>{detail.ratio}x</p>
            <p className="text-[10px] text-muted-foreground">{detail.surplus >= 0 ? "surplus" : "deficit"}: {formatLRD(Math.abs(detail.surplus))}</p>
          </CardContent>
        </Card>
      </div>

      {detail.monthlyBasket.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm">Basket Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={detail.monthlyBasket}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatLRD(v)} />
                <Tooltip formatter={(v: number) => [formatLRD(v), "Cost"]} />
                <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {detail.monthlyCPI.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm">CPI Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={detail.monthlyCPI}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[90, "auto"]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [v.toFixed(1), "CPI"]} />
                <ReferenceLine y={100} stroke="#999" strokeDasharray="3 3" label={{ value: "Baseline", fontSize: 10 }} />
                <Line type="monotone" dataKey="cpi" stroke="#003893" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {detail.topDrivers.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm">Cost Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detail.topDrivers.map((d, i) => (
                <div key={d.category} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1 truncate">{d.category}</span>
                  <span className="text-sm font-medium">{formatLRD(d.cost)}</span>
                  <span className="text-xs text-muted-foreground">{d.share}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={75} innerRadius={35}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatLRD(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EconomicIndicators() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState((currentYear - 1).toString());
  const [selectedTab, setSelectedTab] = useState("cpi");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [compareCounty, setCompareCounty] = useState("none");
  const [detailCounty, setDetailCounty] = useState<string | null>(null);
  const [isolatedCategory, setIsolatedCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery<EconomicData>({
    queryKey: ["/api/economic-indicators", selectedYear, selectedCounty, compareCounty],
    queryFn: async () => {
      const params = new URLSearchParams({ year: selectedYear });
      if (selectedCounty !== "all") params.set("county", selectedCounty);
      if (compareCounty !== "none") params.set("compare", compareCounty);
      const res = await fetch(`/api/economic-indicators?${params}`);
      return res.json();
    },
  });

  const canEnterPrices = user && ["admin", "ministry", "enumerator", "director"].includes(user.role);

  const cpiChartData = useMemo(() => {
    if (!data?.cpiByCounty) return [];
    return Object.entries(data.cpiByCounty)
      .map(([county, d]) => ({
        county: county.length > 12 ? county.substring(0, 12) + "…" : county,
        fullCounty: county, cpi: d.cpi, items: d.items,
      }))
      .sort((a, b) => b.cpi - a.cpi);
  }, [data?.cpiByCounty]);

  const costChartData = useMemo(() => {
    if (!data?.costOfLivingByCounty) return [];
    return Object.entries(data.costOfLivingByCounty)
      .map(([county, d]) => ({
        county: county.length > 12 ? county.substring(0, 12) + "…" : county,
        fullCounty: county, cost: d.totalBasket,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [data?.costOfLivingByCounty]);

  const wageChartData = useMemo(() => {
    if (!data?.wagesByCounty) return [];
    return Object.entries(data.wagesByCounty)
      .map(([county, d]) => ({
        county: county.length > 12 ? county.substring(0, 12) + "…" : county,
        fullCounty: county, avg: d.avgWage, median: d.medianWage,
        min: d.minWage, max: d.maxWage, workers: d.count,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [data?.wagesByCounty]);

  const wageVsCostData = useMemo(() => {
    if (!data?.wageVsCost) return [];
    return Object.entries(data.wageVsCost)
      .map(([county, d]) => ({
        county: county.length > 12 ? county.substring(0, 12) + "…" : county,
        fullCounty: county, avgWage: d.avgWage, basketCost: d.basketCost,
        surplus: d.surplus, ratio: d.affordabilityRatio,
      }))
      .sort((a, b) => a.ratio - b.ratio);
  }, [data?.wageVsCost]);

  const detailData = useMemo(() => {
    if (!detailCounty || !data?.rankings) return null;
    return data.rankings.find(r => r.county === detailCounty) || null;
  }, [detailCounty, data?.rankings]);

  const visibleCategories = useMemo(() => {
    if (!data?.priceTrends) return [];
    return Object.keys(data.priceTrends);
  }, [data?.priceTrends]);

  function handleCountyClick(county: string) {
    setDetailCounty(prev => prev === county ? null : county);
  }

  function handleExport() {
    if (!data) return;
    if (selectedTab === "cpi") downloadCSV(cpiChartData.map(d => ({ county: d.fullCounty, cpi: d.cpi, items: d.items })), "cpi_by_county.csv");
    else if (selectedTab === "cost") downloadCSV(costChartData.map(d => ({ county: d.fullCounty, basketCost: d.cost })), "basket_cost.csv");
    else if (selectedTab === "wages") downloadCSV(wageChartData.map(d => ({ county: d.fullCounty, avgWage: d.avg, medianWage: d.median, min: d.min, max: d.max, workers: d.workers })), "wages_by_county.csv");
    else if (selectedTab === "analysis") downloadCSV(wageVsCostData.map(d => ({ county: d.fullCounty, avgWage: d.avgWage, basketCost: d.basketCost, ratio: d.ratio, surplus: d.surplus })), "affordability.csv");
  }

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
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-economic-title">
                    Economic Indicators
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    National Consumer Price & Wage Intelligence — Republic of Liberia
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MethodologyDrawer />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} data-testid="btn-download">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              {canEnterPrices && (
                <Link href="/price-entry">
                  <Button size="sm" data-testid="button-enter-prices">
                    <PlusCircle className="w-4 h-4 mr-1" /> Enter Prices
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-20 z-30 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[110px]" data-testid="select-year">
                <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCounty} onValueChange={(v) => { setSelectedCounty(v); if (v !== "all") setDetailCounty(v); else setDetailCounty(null); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-county">
                <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={compareCounty} onValueChange={setCompareCounty}>
              <SelectTrigger className="w-[180px]" data-testid="select-compare">
                <GitCompare className="w-3 h-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Compare with..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No comparison</SelectItem>
                {COUNTIES.filter(c => c !== selectedCounty).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {detailCounty && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setDetailCounty(null)}>
                {detailCounty} <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <SectionLoadingSpinner />
        ) : !data || data.totalPriceEntries === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-semibold mb-2">No Price Data Yet</h2>
              <p className="text-muted-foreground mb-6">
                Price data needs to be collected to generate economic indicators.
              </p>
              {canEnterPrices && (
                <Link href="/price-entry"><Button><PlusCircle className="w-4 h-4 mr-2" /> Start Collecting Prices</Button></Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid ${detailData ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1"} gap-4`}>
            <div className="space-y-4">
              {/* Insight Chips */}
              {data.insights.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="insight-chips">
                  {data.insights.map((insight, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full text-xs text-amber-800 dark:text-amber-300">
                      <Lightbulb className="w-3 h-3 shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              )}

              <MetadataBanner lastUpdated={data.lastUpdated} dataSource="price_entries + employment_spells" note={`${data.totalPriceEntries.toLocaleString()} price entries • ${data.countiesWithData} counties`} />

              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">National CPI</p>
                    <p className="text-xl font-bold text-blue-700" data-testid="text-national-cpi">{data.nationalCPI}</p>
                    <p className="text-[10px] text-muted-foreground">base {data.baseYear} = 100</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Avg Wage</p>
                    <p className="text-xl font-bold text-green-700" data-testid="text-avg-wage">{formatLRD(data.nationalAvgWage)}</p>
                    <p className="text-[10px] text-muted-foreground">national average</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Basket Cost</p>
                    <p className="text-xl font-bold text-purple-700" data-testid="text-basket-cost">{formatLRD(data.avgBasketCost)}</p>
                    <p className="text-[10px] text-muted-foreground">national average</p>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${data.nationalRatio >= 1 ? "border-l-green-500" : "border-l-red-500"}`}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Affordability</p>
                    <p className={`text-xl font-bold ${data.nationalRatio >= 1 ? "text-green-700" : "text-red-700"}`} data-testid="text-ratio">{data.nationalRatio}x</p>
                    <p className="text-[10px] text-muted-foreground">{data.nationalRatio >= 1 ? "surplus" : "deficit"}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Price Points</p>
                    <p className="text-xl font-bold text-amber-700">{data.totalPriceEntries.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{data.countiesWithData} counties</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4 h-12" data-testid="tabs-economic">
                  <TabsTrigger value="cpi" data-testid="tab-cpi" className="text-xs sm:text-sm gap-1">
                    <TrendingUp className="w-4 h-4 hidden sm:inline" /> CPI
                  </TabsTrigger>
                  <TabsTrigger value="cost" data-testid="tab-cost-of-living" className="text-xs sm:text-sm gap-1">
                    <ShoppingCart className="w-4 h-4 hidden sm:inline" /> Basket Cost
                  </TabsTrigger>
                  <TabsTrigger value="wages" data-testid="tab-wages" className="text-xs sm:text-sm gap-1">
                    <Wallet className="w-4 h-4 hidden sm:inline" /> Wages
                  </TabsTrigger>
                  <TabsTrigger value="analysis" data-testid="tab-wage-vs-cost" className="text-xs sm:text-sm gap-1">
                    <Scale className="w-4 h-4 hidden sm:inline" /> Affordability
                  </TabsTrigger>
                </TabsList>

                {/* ==================== TAB: CPI ==================== */}
                <TabsContent value="cpi" className="space-y-4">
                  <div className="grid lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Consumer Price Index by County ({selectedYear})</CardTitle>
                        <CardDescription>CPI relative to base year {data.baseYear} (100 = no change). Click bars to drill down.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {cpiChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <ReBarChart data={cpiChartData} onClick={(d: any) => {
                              if (d?.activePayload?.[0]?.payload?.fullCounty) handleCountyClick(d.activePayload[0].payload.fullCounty);
                            }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="county" angle={-45} textAnchor="end" height={80} fontSize={11} />
                              <YAxis domain={[80, "auto"]} />
                              <Tooltip content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]?.payload;
                                return (
                                  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                    <p className="font-semibold text-sm">{d.fullCounty}</p>
                                    <p className="text-xs mt-1">CPI: <span className="font-bold">{d.cpi}</span></p>
                                    <p className="text-xs">Change: <span className={d.cpi > 100 ? "text-red-600" : "text-green-600"}>
                                      {d.cpi > 100 ? "+" : ""}{(d.cpi - 100).toFixed(1)}%
                                    </span></p>
                                    <p className="text-xs text-muted-foreground">{d.items} price entries</p>
                                  </div>
                                );
                              }} />
                              <ReferenceLine y={100} stroke="#666" strokeDasharray="3 3" label={{ value: "Baseline", fontSize: 10 }} />
                              <Bar dataKey="cpi" name="CPI" radius={[4, 4, 0, 0]} cursor="pointer">
                                {cpiChartData.map((entry, i) => (
                                  <Cell key={i} fill={
                                    detailCounty === entry.fullCounty ? "#f59e0b" :
                                    entry.cpi > 110 ? "#ef4444" : entry.cpi > 105 ? "#f97316" : "#22c55e"
                                  } />
                                ))}
                              </Bar>
                            </ReBarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center py-12 text-muted-foreground">No CPI data for {selectedYear}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">County Rankings</CardTitle>
                        <CardDescription>Click to open county detail panel</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                          {cpiChartData.map((item, idx) => (
                            <div key={item.fullCounty}
                              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all hover:shadow-sm ${
                                detailCounty === item.fullCounty ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"
                              }`}
                              onClick={() => handleCountyClick(item.fullCounty)}
                              data-testid={`row-cpi-${item.fullCounty.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                                <span className="text-sm font-medium">{item.fullCounty}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={item.cpi > 110 ? "destructive" : item.cpi > 105 ? "secondary" : "default"}>
                                  {item.cpi.toFixed(1)}
                                </Badge>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Price Trends with Brush */}
                  {data.priceTrends && Object.keys(data.priceTrends).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Price Trends by Category</CardTitle>
                            <CardDescription>Monthly average prices — click legend to isolate categories, use brush to zoom</CardDescription>
                          </div>
                          {isolatedCategory && (
                            <Button variant="ghost" size="sm" onClick={() => setIsolatedCategory(null)} className="text-xs">
                              Show All
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={380}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="month" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={v => formatLRD(v)} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: number) => formatLRD(v)} />
                            <Legend onClick={(e: any) => setIsolatedCategory(prev => prev === e.value ? null : e.value)}
                              wrapperStyle={{ fontSize: 11, cursor: "pointer" }} />
                            <Brush dataKey="month" height={25} stroke="#003893" />
                            {visibleCategories.map((cat, idx) => (
                              <Line key={cat}
                                data={data.priceTrends[cat]}
                                dataKey="avgPrice" name={cat}
                                stroke={COLORS[idx % COLORS.length]} strokeWidth={2}
                                dot={{ r: 2 }}
                                hide={isolatedCategory !== null && isolatedCategory !== cat}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Compare Panel */}
                  {data.compareCountyDetail && data.selectedCountyDetail && (
                    <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                          {data.selectedCountyDetail.county} vs {data.compareCountyDetail.county}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">CPI</p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{data.selectedCountyDetail.cpi}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-bold text-amber-600">{data.compareCountyDetail.cpi}</span>
                            </div>
                            <p className={`text-xs font-medium ${data.selectedCountyDetail.cpi > data.compareCountyDetail.cpi ? "text-red-600" : "text-green-600"}`}>
                              Δ {(data.selectedCountyDetail.cpi - data.compareCountyDetail.cpi).toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Basket Cost</p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{formatLRD(data.selectedCountyDetail.basketCost)}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-bold text-amber-600">{formatLRD(data.compareCountyDetail.basketCost)}</span>
                            </div>
                            <p className={`text-xs font-medium ${data.selectedCountyDetail.basketCost > data.compareCountyDetail.basketCost ? "text-red-600" : "text-green-600"}`}>
                              Δ {formatLRD(data.selectedCountyDetail.basketCost - data.compareCountyDetail.basketCost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg Wage</p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{formatLRD(data.selectedCountyDetail.avgWage)}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-bold text-amber-600">{formatLRD(data.compareCountyDetail.avgWage)}</span>
                            </div>
                            <p className={`text-xs font-medium ${data.selectedCountyDetail.avgWage > data.compareCountyDetail.avgWage ? "text-green-600" : "text-red-600"}`}>
                              Δ {formatLRD(data.selectedCountyDetail.avgWage - data.compareCountyDetail.avgWage)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Affordability</p>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{data.selectedCountyDetail.ratio}x</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-bold text-amber-600">{data.compareCountyDetail.ratio}x</span>
                            </div>
                            <p className={`text-xs font-medium ${data.selectedCountyDetail.ratio > data.compareCountyDetail.ratio ? "text-green-600" : "text-red-600"}`}>
                              Δ {(data.selectedCountyDetail.ratio - data.compareCountyDetail.ratio).toFixed(2)}x
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ==================== TAB: BASKET COST ==================== */}
                <TabsContent value="cost" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Monthly Basket Cost by County ({selectedYear})</CardTitle>
                      <CardDescription>Total cost of the standard basket of goods in LRD. Click bars to drill down.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {costChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <ReBarChart data={costChartData} onClick={(d: any) => {
                            if (d?.activePayload?.[0]?.payload?.fullCounty) handleCountyClick(d.activePayload[0].payload.fullCounty);
                          }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="county" angle={-45} textAnchor="end" height={80} fontSize={11} />
                            <YAxis tickFormatter={v => formatLRD(v)} />
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                  <p className="font-semibold text-sm">{d.fullCounty}</p>
                                  <p className="text-xs mt-1">Basket: <span className="font-bold">{formatLRD(d.cost)}</span></p>
                                  <p className="text-[10px] text-muted-foreground mt-1">Click for category breakdown</p>
                                </div>
                              );
                            }} />
                            <Bar dataKey="cost" name="Basket Cost" radius={[4, 4, 0, 0]} cursor="pointer">
                              {costChartData.map((entry, i) => (
                                <Cell key={i} fill={detailCounty === entry.fullCounty ? "#f59e0b" : COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-12 text-muted-foreground">No basket data for {selectedYear}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* County Ranking Cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {costChartData.slice(0, 6).map((item, i) => (
                      <Card key={item.fullCounty}
                        className={`cursor-pointer transition-all hover:shadow-md ${detailCounty === item.fullCounty ? "ring-2 ring-primary" : ""}`}
                        onClick={() => handleCountyClick(item.fullCounty)}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS[i] }}>
                                #{i + 1}
                              </div>
                              <span className="font-medium text-sm">{item.fullCounty}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{formatLRD(item.cost)}</p>
                              <p className="text-[10px] text-muted-foreground">monthly</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* ==================== TAB: WAGES ==================== */}
                <TabsContent value="wages" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Wage Distribution by County ({selectedYear})</CardTitle>
                      <CardDescription>Average and median monthly wages from employment spells. Click bars to drill down.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {wageChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <ReBarChart data={wageChartData} onClick={(d: any) => {
                            if (d?.activePayload?.[0]?.payload?.fullCounty) handleCountyClick(d.activePayload[0].payload.fullCounty);
                          }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="county" angle={-45} textAnchor="end" height={80} fontSize={11} />
                            <YAxis tickFormatter={v => formatLRD(v)} />
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                  <p className="font-semibold text-sm">{d.fullCounty}</p>
                                  <p className="text-xs mt-1">Average: <span className="font-bold text-blue-600">{formatLRD(d.avg)}</span></p>
                                  <p className="text-xs">Median: <span className="font-bold text-green-600">{formatLRD(d.median)}</span></p>
                                  <p className="text-xs">Range: {formatLRD(d.min)} – {formatLRD(d.max)}</p>
                                  <p className="text-xs text-muted-foreground">{d.workers} workers</p>
                                  {d.workers < 30 && <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Small sample</p>}
                                </div>
                              );
                            }} />
                            <Legend />
                            <Bar dataKey="avg" name="Average Wage" fill="#003893" radius={[4, 4, 0, 0]} cursor="pointer" />
                            <Bar dataKey="median" name="Median Wage" fill="#1B5E20" radius={[4, 4, 0, 0]} />
                          </ReBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-12 text-muted-foreground">No wage data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {wageChartData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Detailed Wage Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm" data-testid="table-wages">
                            <thead>
                              <tr className="border-b text-left">
                                <th className="py-2 pr-4 font-medium text-muted-foreground">County</th>
                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Workers</th>
                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Avg Wage</th>
                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Median</th>
                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Min</th>
                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wageChartData.map(item => (
                                <tr key={item.fullCounty} className={`border-b border-muted/30 cursor-pointer hover:bg-muted/20 ${detailCounty === item.fullCounty ? "bg-primary/5" : ""}`}
                                  onClick={() => handleCountyClick(item.fullCounty)}>
                                  <td className="py-2 pr-4 font-medium">{item.fullCounty}</td>
                                  <td className="py-2 px-3 text-right">{item.workers}</td>
                                  <td className="py-2 px-3 text-right text-blue-600 font-semibold">{formatLRD(item.avg)}</td>
                                  <td className="py-2 px-3 text-right text-green-600">{formatLRD(item.median)}</td>
                                  <td className="py-2 px-3 text-right text-muted-foreground">{formatLRD(item.min)}</td>
                                  <td className="py-2 px-3 text-right text-muted-foreground">{formatLRD(item.max)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ==================== TAB: AFFORDABILITY ==================== */}
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Scatter Plot */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-5 h-5" /> Affordability Scatter
                        </CardTitle>
                        <CardDescription>Basket cost (x) vs wage (y). Above the line = surplus. Click dots to drill down.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {data.scatterData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart margin={{ left: 10, right: 20, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis type="number" dataKey="basketCost" name="Basket Cost" tickFormatter={v => formatLRD(v)} tick={{ fontSize: 10 }} />
                              <YAxis type="number" dataKey="avgWage" name="Avg Wage" tickFormatter={v => formatLRD(v)} tick={{ fontSize: 10 }} />
                              <ZAxis type="number" dataKey="workers" name="Workers" range={[60, 400]} />
                              <Tooltip content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]?.payload;
                                return (
                                  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                    <p className="font-semibold text-sm">{d.county}</p>
                                    <p className="text-xs">Basket: {formatLRD(d.basketCost)}</p>
                                    <p className="text-xs">Wage: {formatLRD(d.avgWage)}</p>
                                    <p className={`text-xs font-medium ${d.surplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      {d.surplus >= 0 ? "Surplus" : "Deficit"}: {formatLRD(Math.abs(d.surplus))} ({d.ratio}x)
                                    </p>
                                    <p className="text-xs text-muted-foreground">{d.workers} workers</p>
                                  </div>
                                );
                              }} />
                              <ReferenceLine stroke="#999" strokeDasharray="3 3"
                                segment={[{ x: 0, y: 0 }, { x: Math.max(...data.scatterData.map(d => d.basketCost)), y: Math.max(...data.scatterData.map(d => d.basketCost)) }]}
                                label={{ value: "Break-even", fontSize: 10, fill: "#999" }} />
                              <Scatter data={data.scatterData} cursor="pointer"
                                onClick={(d: any) => { if (d?.county) handleCountyClick(d.county); }}>
                                {data.scatterData.map((d, i) => (
                                  <Cell key={i} fill={
                                    detailCounty === d.county ? "#f59e0b" :
                                    d.surplus >= 0 ? "#16a34a" : "#dc2626"
                                  } />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-12">
                            <Scale className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">Need both wage and price data</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sorted Surplus/Deficit Bars */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Surplus / Deficit by County</CardTitle>
                        <CardDescription>Green = wage covers basket. Red = deficit. Sorted worst to best.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {wageVsCostData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <ReBarChart data={wageVsCostData} layout="vertical" margin={{ left: 120, right: 30 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis type="number" tickFormatter={v => formatLRD(v)} />
                              <YAxis type="category" dataKey="county" width={115} tick={{ fontSize: 11 }} />
                              <Tooltip content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]?.payload;
                                return (
                                  <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-xl p-3">
                                    <p className="font-semibold text-sm">{d.fullCounty}</p>
                                    <p className="text-xs">Wage: {formatLRD(d.avgWage)} • Basket: {formatLRD(d.basketCost)}</p>
                                    <p className={`text-xs font-bold ${d.surplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      {d.surplus >= 0 ? "Surplus" : "Deficit"}: {formatLRD(Math.abs(d.surplus))} ({d.ratio}x)
                                    </p>
                                  </div>
                                );
                              }} />
                              <ReferenceLine x={0} stroke="#666" />
                              <Bar dataKey="surplus" name="Surplus/Deficit" radius={[0, 4, 4, 0]} cursor="pointer"
                                onClick={(d: any) => { if (d?.fullCounty) handleCountyClick(d.fullCounty); }}>
                                {wageVsCostData.map((d, i) => (
                                  <Cell key={i} fill={
                                    detailCounty === d.fullCounty ? "#f59e0b" :
                                    d.surplus >= 0 ? "#16a34a" : "#dc2626"
                                  } />
                                ))}
                              </Bar>
                            </ReBarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center py-12 text-muted-foreground">No affordability data</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Affordability Cards */}
                  {wageVsCostData.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {wageVsCostData.map((item, i) => (
                        <Card key={item.fullCounty}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            detailCounty === item.fullCounty ? "ring-2 ring-primary" :
                            item.surplus >= 0 ? "border-green-200" : "border-red-200"
                          }`}
                          onClick={() => handleCountyClick(item.fullCounty)}
                          data-testid={`card-affordability-${item.fullCounty.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">{item.fullCounty}</h4>
                              {item.surplus >= 0 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Wage:</span>
                                <span className="font-medium">{formatLRD(item.avgWage)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Basket:</span>
                                <span className="font-medium">{formatLRD(item.basketCost)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-1 mt-1">
                                <span className="font-medium">{item.surplus >= 0 ? "Surplus:" : "Deficit:"}</span>
                                <span className={`font-bold ${item.surplus >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {item.surplus >= 0 ? "+" : ""}{formatLRD(item.surplus)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ratio:</span>
                                <Badge variant={item.ratio >= 1 ? "default" : "destructive"}>{item.ratio}x</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Detail Panel */}
            {detailData && (
              <div className="hidden lg:block">
                <div className="sticky top-36">
                  <Card className="border-primary/30 shadow-lg max-h-[calc(100vh-160px)] overflow-y-auto">
                    <CardContent className="pt-4">
                      <CountyDetailSheet detail={detailData} onClose={() => setDetailCounty(null)} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Mobile Detail Sheet */}
            {detailData && (
              <div className="lg:hidden">
                <Sheet open={!!detailData} onOpenChange={(open) => { if (!open) setDetailCounty(null); }}>
                  <SheetContent className="overflow-y-auto w-[360px]">
                    <SheetHeader>
                      <SheetTitle>County Detail</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <CountyDetailSheet detail={detailData} onClose={() => setDetailCounty(null)} />
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
