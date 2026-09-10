import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLoadingSpinner, LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Flag,
  GraduationCap,
  Hammer,
  HardHat,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  UserCheck,
  Eye,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";

interface SystemOverview {
  totalEmploymentSpells: number;
  activeSpells: number;
  totalVacancies: number;
  totalJobSeekers: number;
  totalEmployers: number;
  totalGrievances: number;
  totalIncidents: number;
  totalKnowledgeBase: number;
  totalTrainingProviders: number;
  totalCourses: number;
  totalTenders: number;
  totalUsers: number;
  avgTrustScore: number;
  formalJobs: number;
  informalJobs: number;
  youthEmployment: number;
  femaleEmployment: number;
}

interface CountyData {
  employment: number;
  vacancies: number;
  jobSeekers: number;
  grievances: number;
  incidents: number;
  employers: number;
  verified: number;
  pending: number;
  flagged: number;
  officers: { id: string; name: string; email: string; role: string }[];
}

interface DirectorOverview {
  systemOverview: SystemOverview;
  verificationPipeline: {
    pending: number;
    employerVerified: number;
    enumeratorVerified: number;
    fullyVerified: number;
    flagged: number;
    rejected: number;
  };
  countyBreakdown: Record<string, CountyData>;
}

interface OverdueAlert {
  spellId: string;
  employeeName: string;
  employerName: string;
  jobTitle: string;
  county: string;
  district: string;
  verificationStatus: string;
  createdAt: string;
  daysOverdue: number;
  responsibleOfficer: { id: string; name: string; email: string; role: string; county: string } | null;
}

interface OfficerPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  county: string;
  phone: string;
  totalRecords: number;
  verified: number;
  pending: number;
  flagged: number;
  overdue: number;
  verificationRate: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  employer_verified: "Employer Signed",
  enumerator_verified: "Field Verified",
  fully_verified: "Fully Verified",
  flagged: "Flagged",
  rejected: "Rejected",
};

const PIE_COLORS = ["#22c55e", "#8b5cf6", "#3b82f6", "#6b7280", "#f97316", "#ef4444"];

export default function DirectorDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  const { data: overview, isLoading: overviewLoading } = useQuery<DirectorOverview>({
    queryKey: ["/api/director/overview"],
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery<{ totalOverdue: number; alerts: OverdueAlert[]; countySummary: Record<string, { total: number; overdue: number }> }>({
    queryKey: ["/api/director/overdue-alerts"],
  });

  const { data: officers = [], isLoading: officersLoading } = useQuery<OfficerPerformance[]>({
    queryKey: ["/api/director/officer-performance"],
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user || (user.role !== "director" && user.role !== "admin")) {
    const isStatic = typeof window !== "undefined" && (window.location.hostname.includes("github.io") || window.location.hostname === "localhost");
    if (!isStatic) {
      setLocation("/login");
      return null;
    }
  }

  const sys = overview?.systemOverview;
  const pipeline = overview?.verificationPipeline;
  const counties = overview?.countyBreakdown || {};
  const alerts = overdueData?.alerts || [];

  const countyChartData = Object.entries(counties)
    .map(([name, data]) => ({
      name: name.length > 10 ? name.substring(0, 10) + "…" : name,
      fullName: name,
      employment: data.employment,
      vacancies: data.vacancies,
      verified: data.verified,
      pending: data.pending,
      flagged: data.flagged,
    }))
    .sort((a, b) => b.employment - a.employment);

  const pipelineData = pipeline ? [
    { name: "Fully Verified", value: pipeline.fullyVerified, color: "#22c55e" },
    { name: "Enumerator Verified", value: pipeline.enumeratorVerified, color: "#8b5cf6" },
    { name: "Employer Signed", value: pipeline.employerVerified, color: "#3b82f6" },
    { name: "Pending", value: pipeline.pending, color: "#6b7280" },
    { name: "Flagged", value: pipeline.flagged, color: "#f97316" },
    { name: "Rejected", value: pipeline.rejected, color: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  const selectedCountyData = selectedCounty ? counties[selectedCounty] : null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[hsl(355,70%,95%)] via-white to-[hsl(215,60%,95%)]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <BackButton />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-director-title">
              Director of Statistics Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete bird's-eye view of all LiJOBS system data across 15 counties
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/statistical-rigor">
              <Button variant="outline" size="sm" className="gap-2" data-testid="link-statistical-rigor">
                <ShieldCheck className="w-4 h-4" />
                Statistical Rigor
              </Button>
            </Link>
            <Link href="/occupational-economics">
              <Button variant="outline" size="sm" className="gap-2" data-testid="link-occupational-economics">
                <TrendingUp className="w-4 h-4" />
                Occupational Economics
              </Button>
            </Link>
            <Link href="/economic-indicators">
              <Button variant="outline" size="sm" className="gap-2" data-testid="link-economic-indicators">
                <Activity className="w-4 h-4" />
                Economic Indicators
              </Button>
            </Link>
            <Link href="/verification">
              <Button variant="outline" size="sm" className="gap-2" data-testid="link-verification-dashboard">
                <ShieldCheck className="w-4 h-4" />
                Verify Records
              </Button>
            </Link>
            <Link href="/observatory">
              <Button variant="outline" size="sm" className="gap-2" data-testid="link-observatory">
                <Eye className="w-4 h-4" />
                Jobs Observatory
              </Button>
            </Link>
          </div>
        </div>

        {overviewLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            {/* Overdue Alerts Banner */}
            {(overdueData?.totalOverdue || 0) > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3" data-testid="alert-overdue-banner">
                <Bell className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-semibold text-red-800">
                    {overdueData?.totalOverdue} records overdue for verification (3+ days)
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    These records need immediate attention. Contact the responsible county/district officers below.
                  </p>
                </div>
              </div>
            )}

            {/* System-Wide Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {[
                { label: "Employment Records", value: sys?.totalEmploymentSpells || 0, icon: Briefcase, color: "text-blue-600" },
                { label: "Active Jobs", value: sys?.activeSpells || 0, icon: Activity, color: "text-green-600" },
                { label: "Job Vacancies", value: sys?.totalVacancies || 0, icon: FileText, color: "text-indigo-600" },
                { label: "Job Seekers", value: sys?.totalJobSeekers || 0, icon: Users, color: "text-purple-600" },
                { label: "Employers", value: sys?.totalEmployers || 0, icon: Building2, color: "text-emerald-600" },
                { label: "Total Users", value: sys?.totalUsers || 0, icon: UserCheck, color: "text-cyan-600" },
                { label: "Grievances", value: sys?.totalGrievances || 0, icon: MessageSquare, color: "text-orange-600" },
                { label: "Safety Incidents", value: sys?.totalIncidents || 0, icon: HardHat, color: "text-red-600" },
                { label: "Training Providers", value: sys?.totalTrainingProviders || 0, icon: GraduationCap, color: "text-teal-600" },
                { label: "Courses", value: sys?.totalCourses || 0, icon: BookOpen, color: "text-violet-600" },
                { label: "Tenders", value: sys?.totalTenders || 0, icon: Hammer, color: "text-amber-600" },
                { label: "Knowledge Base", value: sys?.totalKnowledgeBase || 0, icon: FileText, color: "text-sky-600" },
              ].map((item) => (
                <Card key={item.label} className="border" data-testid={`card-stat-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardContent className="p-3 text-center">
                    <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                    <p className="text-xl font-bold">{item.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Metrics Row */}
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-700">Avg Trust Score</p>
                  <p className="text-3xl font-bold text-blue-900">{(sys?.avgTrustScore || 0).toFixed(2)}</p>
                  <Progress value={(sys?.avgTrustScore || 0) * 100} className="h-2 mt-2 [&>div]:bg-blue-500" />
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm text-green-700">Formal Employment</p>
                  <p className="text-3xl font-bold text-green-900">{sys?.formalJobs || 0}</p>
                  <p className="text-xs text-green-600">vs {sys?.informalJobs || 0} informal</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <p className="text-sm text-purple-700">Youth Employment</p>
                  <p className="text-3xl font-bold text-purple-900">{sys?.youthEmployment || 0}</p>
                  <p className="text-xs text-purple-600">
                    {(sys?.totalEmploymentSpells || 0) > 0 ? Math.round(((sys?.youthEmployment || 0) / (sys?.totalEmploymentSpells || 1)) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-rose-50 border-rose-200">
                <CardContent className="p-4">
                  <p className="text-sm text-rose-700">Female Employment</p>
                  <p className="text-3xl font-bold text-rose-900">{sys?.femaleEmployment || 0}</p>
                  <p className="text-xs text-rose-600">
                    {(sys?.totalEmploymentSpells || 0) > 0 ? Math.round(((sys?.femaleEmployment || 0) / (sys?.totalEmploymentSpells || 1)) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="counties" className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="counties" data-testid="tab-counties">
                  <MapPin className="w-4 h-4 mr-1" /> County Breakdown
                </TabsTrigger>
                <TabsTrigger value="verification" data-testid="tab-verification">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Verification Pipeline
                </TabsTrigger>
                <TabsTrigger value="alerts" data-testid="tab-alerts">
                  <Bell className="w-4 h-4 mr-1" /> Overdue Alerts
                  {(overdueData?.totalOverdue || 0) > 0 && (
                    <Badge variant="destructive" className="ml-1">{overdueData?.totalOverdue}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="officers" data-testid="tab-officers">
                  <Users className="w-4 h-4 mr-1" /> Officer Performance
                </TabsTrigger>
              </TabsList>

              {/* County Breakdown Tab */}
              <TabsContent value="counties">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Employment Records by County</CardTitle>
                      <CardDescription>Click a county to see detailed breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {countyChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <ReBarChart data={countyChartData} onClick={(data) => {
                            if (data?.activePayload?.[0]?.payload?.fullName) {
                              setSelectedCounty(data.activePayload[0].payload.fullName);
                            }
                          }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                            <YAxis />
                            <Tooltip formatter={(value: number, name: string) => [value, name === "employment" ? "Employment" : name === "verified" ? "Verified" : name === "pending" ? "Pending" : name]} />
                            <Legend />
                            <Bar dataKey="employment" fill="#3b82f6" name="Total Employment" />
                            <Bar dataKey="verified" fill="#22c55e" name="Verified" />
                            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                          </ReBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-12 text-muted-foreground">No employment data recorded yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedCounty || "Select a County"}</CardTitle>
                      <CardDescription>
                        {selectedCounty ? "Detailed statistics for this county" : "Click on a county bar or select below"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!selectedCounty ? (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {Object.entries(counties).sort((a, b) => b[1].employment - a[1].employment).map(([name, data]) => (
                            <button
                              key={name}
                              onClick={() => setSelectedCounty(name)}
                              className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                              data-testid={`button-county-${name.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{name}</span>
                                <Badge variant="outline">{data.employment} records</Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : selectedCountyData ? (
                        <div className="space-y-4">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCounty(null)} className="mb-2">
                            &larr; Back to all counties
                          </Button>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Employment", value: selectedCountyData.employment, icon: Briefcase },
                              { label: "Vacancies", value: selectedCountyData.vacancies, icon: FileText },
                              { label: "Employers", value: selectedCountyData.employers, icon: Building2 },
                              { label: "Verified", value: selectedCountyData.verified, icon: ShieldCheck },
                              { label: "Pending", value: selectedCountyData.pending, icon: Clock },
                              { label: "Flagged", value: selectedCountyData.flagged, icon: Flag },
                              { label: "Grievances", value: selectedCountyData.grievances, icon: MessageSquare },
                              { label: "Incidents", value: selectedCountyData.incidents, icon: HardHat },
                            ].map(item => (
                              <div key={item.label} className="flex items-center gap-2 p-2 rounded border">
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-lg font-bold leading-none">{item.value}</p>
                                  <p className="text-xs text-muted-foreground">{item.label}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {selectedCountyData.officers.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                <Users className="w-4 h-4" /> Assigned Officers
                              </h4>
                              <div className="space-y-2">
                                {selectedCountyData.officers.map(officer => (
                                  <div key={officer.id} className="p-2 rounded bg-muted/50 text-sm">
                                    <p className="font-medium">{officer.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> {officer.email}
                                    </p>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {officer.role === "enumerator" ? "Field Agent" : "Ministry"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {/* Full County Table */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>All 15 Counties — Complete Statistical Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>County</TableHead>
                            <TableHead className="text-right">Employment</TableHead>
                            <TableHead className="text-right">Verified</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                            <TableHead className="text-right">Flagged</TableHead>
                            <TableHead className="text-right">Vacancies</TableHead>
                            <TableHead className="text-right">Employers</TableHead>
                            <TableHead className="text-right">Grievances</TableHead>
                            <TableHead className="text-right">Incidents</TableHead>
                            <TableHead className="text-right">Officers</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(counties).sort((a, b) => b[1].employment - a[1].employment).map(([name, data]) => (
                            <TableRow
                              key={name}
                              className="cursor-pointer hover:bg-accent/50"
                              onClick={() => setSelectedCounty(name)}
                              data-testid={`row-county-${name.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <TableCell className="font-medium">{name}</TableCell>
                              <TableCell className="text-right">{data.employment}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-green-600 font-medium">{data.verified}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-yellow-600">{data.pending}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                {data.flagged > 0 ? (
                                  <Badge variant="destructive" className="text-xs">{data.flagged}</Badge>
                                ) : <span className="text-muted-foreground">0</span>}
                              </TableCell>
                              <TableCell className="text-right">{data.vacancies}</TableCell>
                              <TableCell className="text-right">{data.employers}</TableCell>
                              <TableCell className="text-right">{data.grievances}</TableCell>
                              <TableCell className="text-right">{data.incidents}</TableCell>
                              <TableCell className="text-right">{data.officers.length}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Pipeline Tab */}
              <TabsContent value="verification">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pipelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pipelineData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {pipelineData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center py-12 text-muted-foreground">No data yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Pipeline Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pipeline && [
                        { label: "Pending", count: pipeline.pending, color: "text-gray-600", barClass: "" },
                        { label: "Employer Signed", count: pipeline.employerVerified, color: "text-blue-600", barClass: "[&>div]:bg-blue-500" },
                        { label: "Field Verified", count: pipeline.enumeratorVerified, color: "text-purple-600", barClass: "[&>div]:bg-purple-500" },
                        { label: "Fully Verified", count: pipeline.fullyVerified, color: "text-green-600", barClass: "[&>div]:bg-green-500" },
                        { label: "Flagged", count: pipeline.flagged, color: "text-orange-600", barClass: "[&>div]:bg-orange-500" },
                        { label: "Rejected", count: pipeline.rejected, color: "text-red-600", barClass: "[&>div]:bg-red-500" },
                      ].map(item => {
                        const total = (sys?.totalEmploymentSpells || 1);
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className={`font-medium ${item.color}`}>{item.label}</span>
                              <span className="text-muted-foreground">{item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)</span>
                            </div>
                            <Progress value={total > 0 ? (item.count / total) * 100 : 0} className={`h-2 ${item.barClass}`} />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Overdue Alerts Tab */}
              <TabsContent value="alerts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Overdue Verification Alerts (3+ Days)
                    </CardTitle>
                    <CardDescription>
                      Records that have not been verified within 3 days of submission. Contact the responsible officer to follow up.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overdueLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">No overdue records!</p>
                        <p className="text-sm">All records are being verified on time</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Employer</TableHead>
                              <TableHead>County/District</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Days Overdue</TableHead>
                              <TableHead>Responsible Officer</TableHead>
                              <TableHead>Contact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alerts.map((alert) => (
                              <TableRow key={alert.spellId} data-testid={`row-alert-${alert.spellId}`}>
                                <TableCell>
                                  <p className="font-medium text-sm">{alert.employeeName || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{alert.jobTitle}</p>
                                </TableCell>
                                <TableCell className="text-sm">{alert.employerName}</TableCell>
                                <TableCell>
                                  <p className="text-sm">{alert.county}</p>
                                  {alert.district && <p className="text-xs text-muted-foreground">{alert.district}</p>}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={alert.verificationStatus === "flagged" ? "destructive" : "outline"}>
                                    {statusLabels[alert.verificationStatus] || alert.verificationStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-bold ${alert.daysOverdue > 7 ? "text-red-600" : "text-orange-600"}`}>
                                    {alert.daysOverdue} days
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {alert.responsibleOfficer ? (
                                    <div>
                                      <p className="text-sm font-medium">{alert.responsibleOfficer.name}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {alert.responsibleOfficer.role === "enumerator" ? "Field Agent" : "Ministry"}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-red-500 italic">No officer assigned</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {alert.responsibleOfficer ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="w-3 h-3" />
                                      {alert.responsibleOfficer.email}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Officer Performance Tab */}
              <TabsContent value="officers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      County & District Officer Performance
                    </CardTitle>
                    <CardDescription>
                      Track verification performance of field agents and ministry officers by county
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {officersLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : officers.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No officers registered yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Officer</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>County</TableHead>
                              <TableHead className="text-right">Total Records</TableHead>
                              <TableHead className="text-right">Verified</TableHead>
                              <TableHead className="text-right">Pending</TableHead>
                              <TableHead className="text-right">Overdue</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead>Contact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {officers.sort((a, b) => b.overdue - a.overdue).map((officer) => (
                              <TableRow key={officer.id} data-testid={`row-officer-${officer.id}`}>
                                <TableCell className="font-medium">{officer.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {officer.role === "enumerator" ? "Field Agent" : "Ministry"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{officer.county || "—"}</TableCell>
                                <TableCell className="text-right">{officer.totalRecords}</TableCell>
                                <TableCell className="text-right text-green-600 font-medium">{officer.verified}</TableCell>
                                <TableCell className="text-right text-yellow-600">{officer.pending}</TableCell>
                                <TableCell className="text-right">
                                  {officer.overdue > 0 ? (
                                    <Badge variant="destructive">{officer.overdue}</Badge>
                                  ) : (
                                    <span className="text-green-600">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-bold ${officer.verificationRate >= 70 ? "text-green-600" : officer.verificationRate >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                                    {officer.verificationRate}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> {officer.email}
                                    </div>
                                    {officer.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {officer.phone}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
