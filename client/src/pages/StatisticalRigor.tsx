import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Target,
  BarChart3,
  CalendarRange,
  Activity,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileText,
  Info,
  ChevronRight,
} from "lucide-react";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";

const COLORS = [
  "#003893", "#CE1126", "#1B5E20", "#FF6F00", "#0277BD",
  "#6A1B9A", "#C62828", "#00695C", "#EF6C00", "#283593",
  "#2E7D32", "#AD1457", "#4527A0", "#00838F", "#D84315"
];

const severityColors: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-400 text-white",
};

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: Info,
  low: CheckCircle,
};

function QualityChecksTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/quality-checks"] });

  if (isLoading) return <SectionLoadingSpinner />;
  if (!data) return null;

  const { summary, issues } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-total-records">{summary.totalRecords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold" data-testid="text-quality-score" style={{ color: summary.dataQualityScore >= 90 ? '#16a34a' : summary.dataQualityScore >= 70 ? '#d97706' : '#dc2626' }}>
              {summary.dataQualityScore}%
            </div>
            <div className="text-xs text-muted-foreground">Quality Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600" data-testid="text-duplicates">{summary.duplicates}</div>
            <div className="text-xs text-muted-foreground">Duplicates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600" data-testid="text-impossible-dates">{summary.impossibleDates}</div>
            <div className="text-xs text-muted-foreground">Date Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-wage-outliers">{summary.wageOutliers}</div>
            <div className="text-xs text-muted-foreground">Wage Outliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600" data-testid="text-unusual-employers">{summary.unusualEmployers}</div>
            <div className="text-xs text-muted-foreground">Unusual Employers</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Data Quality Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={summary.dataQualityScore} className="h-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{summary.totalIssues} issues found in {summary.totalRecords.toLocaleString()} records</span>
              <span>{summary.dataQualityScore}% clean</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={[
                { type: "Duplicates", count: summary.duplicates, fill: "#f97316" },
                { type: "Date Issues", count: summary.impossibleDates, fill: "#dc2626" },
                { type: "Wage Outliers", count: summary.wageOutliers, fill: "#eab308" },
                { type: "Employer Issues", count: summary.unusualEmployers, fill: "#3b82f6" },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Issues">
                  {[0, 1, 2, 3].map((_, idx) => (
                    <Cell key={idx} fill={["#f97316", "#dc2626", "#eab308", "#3b82f6"][idx]} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flagged Records</CardTitle>
            <CardDescription>Showing up to 50 most recent issues requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {issues.map((issue: any, idx: number) => {
                const Icon = severityIcons[issue.severity] || Info;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors" data-testid={`issue-row-${idx}`}>
                    <Badge className={severityColors[issue.severity] || "bg-gray-400"}>
                      <Icon className="h-3 w-3 mr-1" />
                      {issue.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{issue.description}</div>
                      {issue.value && <div className="text-xs text-muted-foreground mt-1">{issue.value}</div>}
                    </div>
                    <Badge variant="outline" className="shrink-0">{issue.type.replace('_', ' ')}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SamplingTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/sampling-frameworks"] });

  if (isLoading) return <SectionLoadingSpinner />;
  if (!data) return null;

  const { parameters, byCounty, bySector } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sampling Parameters
          </CardTitle>
          <CardDescription>Configuration used for sample size calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-lg font-bold text-primary">{parameters.confidenceLevel}</div>
              <div className="text-xs text-muted-foreground">Confidence Level</div>
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-lg font-bold text-primary">{parameters.marginOfError}</div>
              <div className="text-xs text-muted-foreground">Margin of Error</div>
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-lg font-bold text-primary">{parameters.totalPopulation.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Population</div>
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-lg font-bold text-primary" data-testid="text-cochran-sample">{parameters.cochranSampleSize}</div>
              <div className="text-xs text-muted-foreground">Cochran Sample Size</div>
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-lg font-bold text-primary">{parameters.totalEmployers}</div>
              <div className="text-xs text-muted-foreground">Total Employers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            County Sample Allocation
          </CardTitle>
          <CardDescription>Recommended sample sizes by county using proportional allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={byCounty.slice(0, 15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="county" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="population" name="Total Population" fill="#003893" />
                <Bar dataKey="recommendedSample" name="Recommended Sample" fill="#CE1126" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {byCounty.map((county: any) => (
          <Card key={county.county} className="hover:shadow-md transition-shadow" data-testid={`card-county-sample-${county.county}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{county.county}</h4>
                <Badge variant={county.priority === "high" ? "destructive" : county.priority === "medium" ? "default" : "secondary"}>
                  {county.priority} priority
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Population:</span> {county.population.toLocaleString()}</div>
                <div><span className="text-muted-foreground">Share:</span> {county.proportion}%</div>
                <div><span className="text-muted-foreground">Sample:</span> <span className="font-semibold text-primary">{county.recommendedSample}</span></div>
                <div><span className="text-muted-foreground">Coverage:</span> {county.coveragePercent}%</div>
                <div><span className="text-muted-foreground">Employers:</span> {county.employers}</div>
                <div><span className="text-muted-foreground">Sectors:</span> {county.sectors}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sector Sample Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bySector.map((sector: any) => (
              <div key={sector.sector} className="flex items-center gap-4 p-3 rounded-lg border" data-testid={`row-sector-sample-${sector.sector}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{sector.sector}</span>
                    <Badge variant={sector.priority === "high" ? "destructive" : sector.priority === "medium" ? "default" : "secondary"}>
                      {sector.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Population: {sector.population.toLocaleString()} | {sector.proportion}% of total | {sector.counties} counties
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{sector.recommendedSample}</div>
                  <div className="text-xs text-muted-foreground">sample needed</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SeasonalTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/seasonal-adjustment"] });
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  if (isLoading) return <SectionLoadingSpinner />;
  if (!data) return null;

  const { timeSeries, sectorSummary } = data;

  const chartData = timeSeries.map((t: any) => ({
    month: t.month,
    raw: t.totalRaw,
    adjusted: t.totalAdjusted,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sectorSummary.slice(0, 3).map((sector: any) => (
          <Card key={sector.sector} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSector(sector.sector === selectedSector ? null : sector.sector)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold capitalize">{sector.sector}</h4>
                <Badge variant={sector.seasonalityStrength === "strong" ? "destructive" : sector.seasonalityStrength === "moderate" ? "default" : "secondary"}>
                  {sector.seasonalityStrength}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
                  Peak: <span className="font-medium">{sector.peakMonth}</span>
                </div>
                <div>
                  <TrendingDown className="h-3 w-3 inline mr-1 text-red-600" />
                  Trough: <span className="font-medium">{sector.troughMonth}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Seasonality index: {sector.seasonalityIndex}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Raw vs Seasonally Adjusted Employment
          </CardTitle>
          <CardDescription>Last 24 months — seasonal patterns removed to show true trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="raw" name="Raw Employment" stroke="#003893" fill="#003893" fillOpacity={0.1} />
                <Area type="monotone" dataKey="adjusted" name="Seasonally Adjusted" stroke="#CE1126" fill="#CE1126" fillOpacity={0.1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {selectedSector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg capitalize">
              {selectedSector} — Seasonal Indices by Month
            </CardTitle>
            <CardDescription>Index &gt; 1.0 = above average; &lt; 1.0 = below average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={
                  Object.entries(sectorSummary.find((s: any) => s.sector === selectedSector)?.indices || {}).map(([month, value]) => ({
                    month,
                    index: value as number,
                    fill: (value as number) >= 1 ? "#16a34a" : "#dc2626",
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.5, 1.5]} />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Bar dataKey="index" name="Seasonal Index">
                    {Object.values(sectorSummary.find((s: any) => s.sector === selectedSector)?.indices || {}).map((_: any, idx: number) => (
                      <Cell key={idx} fill={(_ as number) >= 1 ? "#16a34a" : "#dc2626"} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Sector Seasonal Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sectorSummary.map((sector: any) => (
              <div key={sector.sector} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                   onClick={() => setSelectedSector(sector.sector === selectedSector ? null : sector.sector)}
                   data-testid={`row-seasonal-${sector.sector}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{sector.sector}</span>
                    <Badge variant={sector.seasonalityStrength === "strong" ? "destructive" : sector.seasonalityStrength === "moderate" ? "default" : "secondary"}>
                      {sector.seasonalityStrength}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">Peak: {sector.peakMonth} ({sector.peakIndex.toFixed(2)})</span>
                    <span className="text-red-600">Trough: {sector.troughMonth} ({sector.troughIndex.toFixed(2)})</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>Methodology:</strong> {data.methodology}. Industries like agriculture and mining show distinct seasonal patterns.
            Seasonally adjusted figures remove these predictable fluctuations so policy-makers can see the true underlying employment trend.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfidenceTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/confidence-intervals"] });

  if (isLoading) return <SectionLoadingSpinner />;
  if (!data) return null;

  const { overall, byCounty, bySector } = data;

  const reliabilityColor = (r: string) => r === "high" ? "text-green-600" : r === "moderate" ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-overall-records">{overall.totalRecords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-active-employment">{overall.activeEmployment.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Active Employment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-avg-wage">L${overall.averageWage.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Average Wage</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-primary" data-testid="text-wage-margin">{overall.wageCI95.margin}</div>
            <div className="text-xs text-muted-foreground">95% Margin of Error</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employment Count Confidence Intervals by County
          </CardTitle>
          <CardDescription>95% confidence intervals for active employment estimates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={byCounty} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="county" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="ci95Lower" name="Lower Bound" fill="#93c5fd" stackId="ci" />
                <Bar dataKey="estimate" name="Estimate" fill="#003893" />
                <Bar dataKey="ci95Upper" name="Upper Bound" fill="#93c5fd" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Employment by County</h3>
        {byCounty.map((county: any) => (
          <Card key={county.county} data-testid={`card-ci-county-${county.county}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{county.county}</h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    Estimate: <span className="font-medium text-foreground">{county.estimate.toLocaleString()}</span> ({county.marginOfError})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">95% CI: [{county.ci95Lower.toLocaleString()} — {county.ci95Upper.toLocaleString()}]</div>
                  <Badge className={`mt-1 ${county.reliability === 'high' ? 'bg-green-600' : county.reliability === 'moderate' ? 'bg-yellow-600' : 'bg-red-600'} text-white`}>
                    {county.reliability} reliability
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Wage Confidence Intervals by Sector
          </CardTitle>
          <CardDescription>95% and 90% confidence intervals for mean wages with coefficient of variation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bySector.map((sector: any) => (
              <div key={sector.sector} className="p-4 rounded-lg border" data-testid={`card-ci-sector-${sector.sector}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold capitalize">{sector.sector}</span>
                    <span className="text-sm text-muted-foreground ml-2">(n={sector.sampleSize})</span>
                  </div>
                  <Badge className={`${sector.reliability === 'high' ? 'bg-green-600' : sector.reliability === 'moderate' ? 'bg-yellow-600' : 'bg-red-600'} text-white`}>
                    {sector.reliability} reliability
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mean Wage:</span>
                    <span className="font-medium ml-1">L${sector.meanWage.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">95% CI:</span>
                    <span className="font-medium ml-1">{sector.ci95.margin}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Std Dev:</span>
                    <span className="font-medium ml-1">L${sector.standardDeviation.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CV:</span>
                    <span className={`font-medium ml-1 ${reliabilityColor(sector.reliability)}`}>{sector.coefficientOfVariation}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>How to read:</strong> A 95% confidence interval means that if the survey were repeated 100 times, the true value would fall within this range in about 95 of those surveys.
            <strong className="ml-1">Reliability ratings:</strong> High (CV &lt; 5%), Moderate (CV 5-15%), Low (CV &gt; 15%).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MethodologyTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/methodology"] });

  if (isLoading) return <SectionLoadingSpinner />;
  if (!data) return null;

  const { methodologies } = data;
  const categories = [...new Set(methodologies.map((m: any) => m.category))] as string[];

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            Every statistic published through LiJOBS includes documentation on how it was calculated, making the data transparent and reproducible.
            This section provides complete methodology notes for all statistical outputs.
          </div>
        </CardContent>
      </Card>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
          {methodologies.filter((m: any) => m.category === category).map((method: any) => (
            <Card key={method.id} data-testid={`card-methodology-${method.id}`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {method.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h5 className="text-sm font-semibold text-muted-foreground mb-1">Description</h5>
                  <p className="text-sm">{method.description}</p>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-muted-foreground mb-1">Formula / Calculation</h5>
                  <div className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">{method.formula}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Data Source</h5>
                    <p className="text-sm">{method.dataSource}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Limitations</h5>
                    <p className="text-sm text-orange-700 dark:text-orange-400">{method.limitations}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Last updated: {method.lastUpdated}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function StatisticalRigor() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-24">
          <SectionLoadingSpinner />
        </div>
      </div>
    );
  }

  const allowedRoles = ["admin", "ministry", "director"];
  const isAuthorized = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      setLocation("/login");
    }
  }, [authLoading, isAuthorized, setLocation]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Statistical Rigor
          </h1>
          <p className="text-muted-foreground mt-2">
            Automated quality assurance, sampling guidance, seasonal adjustment, confidence intervals, and methodology documentation for trustworthy official statistics.
          </p>
        </div>

        <Tabs defaultValue="quality" className="space-y-6" data-testid="tabs-statistical-rigor">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="quality" className="text-xs sm:text-sm" data-testid="tab-quality">
              <ShieldCheck className="h-4 w-4 mr-1 hidden sm:inline" />
              Quality Checks
            </TabsTrigger>
            <TabsTrigger value="sampling" className="text-xs sm:text-sm" data-testid="tab-sampling">
              <Target className="h-4 w-4 mr-1 hidden sm:inline" />
              Sampling
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="text-xs sm:text-sm" data-testid="tab-seasonal">
              <CalendarRange className="h-4 w-4 mr-1 hidden sm:inline" />
              Seasonal
            </TabsTrigger>
            <TabsTrigger value="confidence" className="text-xs sm:text-sm" data-testid="tab-confidence">
              <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
              Confidence
            </TabsTrigger>
            <TabsTrigger value="methodology" className="text-xs sm:text-sm" data-testid="tab-methodology">
              <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
              Methodology
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quality"><QualityChecksTab /></TabsContent>
          <TabsContent value="sampling"><SamplingTab /></TabsContent>
          <TabsContent value="seasonal"><SeasonalTab /></TabsContent>
          <TabsContent value="confidence"><ConfidenceTab /></TabsContent>
          <TabsContent value="methodology"><MethodologyTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}