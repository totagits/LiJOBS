import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, AlertTriangle, HardHat, Activity, Flame, Zap, Users, FileText } from "lucide-react";
import type { WorkplaceIncident } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const SECTORS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "ngo", label: "NGO" },
  { value: "informal", label: "Informal" },
  { value: "seasonal", label: "Seasonal" },
];

const INCIDENT_TYPES = [
  { value: "fall", label: "Fall" },
  { value: "machinery_accident", label: "Machinery Accident" },
  { value: "chemical_exposure", label: "Chemical Exposure" },
  { value: "fire", label: "Fire" },
  { value: "electrical", label: "Electrical" },
  { value: "structural_collapse", label: "Structural Collapse" },
  { value: "vehicle_accident", label: "Vehicle Accident" },
  { value: "violence", label: "Violence" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "serious", label: "Serious" },
  { value: "critical", label: "Critical" },
  { value: "fatal", label: "Fatal" },
];

const STATUS_OPTIONS = [
  { value: "reported", label: "Reported" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-green-500/15 text-green-700 dark:text-green-400",
  moderate: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  serious: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
  fatal: "bg-destructive/15 text-destructive",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  investigating: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  resolved: "bg-green-500/15 text-green-700 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

function formatIncidentType(type: string) {
  return INCIDENT_TYPES.find(t => t.value === type)?.label || type;
}

function formatSeverity(severity: string) {
  return SEVERITY_OPTIONS.find(s => s.value === severity)?.label || severity;
}

function formatStatus(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
}

interface StatsData {
  totalIncidents: number;
  totalFatalities: number;
  totalInjuries: number;
  bySeverity: { severity: string; count: number }[];
  byCounty: { county: string; count: number }[];
  byType: { type: string; count: number }[];
}

export default function WorkplaceSafety() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("report");
  const [selectedIncident, setSelectedIncident] = useState<WorkplaceIncident | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState("");

  const [formData, setFormData] = useState({
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    employerName: "",
    sector: "",
    county: "",
    location: "",
    incidentType: "",
    severity: "",
    incidentDate: "",
    description: "",
    fatalities: 0,
    injuries: 0,
  });

  const canManage = user?.role === "admin" || user?.role === "ministry";

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/workplace-incidents/stats/summary"],
  });

  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<WorkplaceIncident[]>({
    queryKey: ["/api/workplace-incidents"],
    enabled: canManage,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/workplace-incidents", data);
    },
    onSuccess: () => {
      toast({ title: "Incident reported successfully. Authorities will review your report." });
      setFormData({
        reporterName: "",
        reporterEmail: "",
        reporterPhone: "",
        employerName: "",
        sector: "",
        county: "",
        location: "",
        incidentType: "",
        severity: "",
        incidentDate: "",
        description: "",
        fatalities: 0,
        injuries: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workplace-incidents/stats/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workplace-incidents"] });
    },
    onError: () => {
      toast({ title: "Failed to submit incident report", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status?: string; investigationNotes?: string } }) => {
      return apiRequest("PATCH", `/api/workplace-incidents/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Incident updated successfully" });
      setSelectedIncident(null);
      setUpdateStatus("");
      setInvestigationNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/workplace-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workplace-incidents/stats/summary"] });
    },
    onError: () => {
      toast({ title: "Failed to update incident", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.reporterName.trim()) {
      toast({ title: "Reporter name is required", variant: "destructive" });
      return;
    }
    if (!formData.sector) {
      toast({ title: "Sector is required", variant: "destructive" });
      return;
    }
    if (!formData.county) {
      toast({ title: "County is required", variant: "destructive" });
      return;
    }
    if (!formData.incidentType) {
      toast({ title: "Incident type is required", variant: "destructive" });
      return;
    }
    if (!formData.severity) {
      toast({ title: "Severity is required", variant: "destructive" });
      return;
    }
    if (!formData.incidentDate) {
      toast({ title: "Incident date is required", variant: "destructive" });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleUpdateIncident = () => {
    if (!selectedIncident) return;
    const data: { status?: string; investigationNotes?: string } = {};
    if (updateStatus) data.status = updateStatus;
    if (investigationNotes.trim()) data.investigationNotes = investigationNotes;
    if (!data.status && !data.investigationNotes) {
      toast({ title: "Please update status or add notes", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: selectedIncident.id, data });
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus && filterStatus !== "all" && inc.status !== filterStatus) return false;
    if (filterSeverity && filterSeverity !== "all" && inc.severity !== filterSeverity) return false;
    if (filterCounty && filterCounty !== "all" && inc.county !== filterCounty) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />

          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Shield className="w-8 h-8 text-primary" />
              Workplace Safety & Incident Reporting
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
              Report workplace accidents and monitor safety across Liberia
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="report" data-testid="tab-report">
                <FileText className="w-4 h-4 mr-2" />
                Report Incident
              </TabsTrigger>
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                <Activity className="w-4 h-4 mr-2" />
                Safety Dashboard
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="manage" data-testid="tab-manage">
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Reports
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="report" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Report a Workplace Incident
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reporterName">Reporter Name *</Label>
                        <Input
                          id="reporterName"
                          data-testid="input-reporter-name"
                          value={formData.reporterName}
                          onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reporterEmail">Reporter Email</Label>
                        <Input
                          id="reporterEmail"
                          data-testid="input-reporter-email"
                          type="email"
                          value={formData.reporterEmail}
                          onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reporterPhone">Reporter Phone</Label>
                        <Input
                          id="reporterPhone"
                          data-testid="input-reporter-phone"
                          value={formData.reporterPhone}
                          onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                          placeholder="+231 xxx xxx xxxx"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employerName">Employer Name</Label>
                        <Input
                          id="employerName"
                          data-testid="input-employer-name"
                          value={formData.employerName}
                          onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                          placeholder="Company or organization"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Sector *</Label>
                        <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
                          <SelectTrigger data-testid="select-sector">
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTORS.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>County *</Label>
                        <Select value={formData.county} onValueChange={(v) => setFormData({ ...formData, county: v })}>
                          <SelectTrigger data-testid="select-county">
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIBERIA_COUNTIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        data-testid="input-location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Specific location or address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Incident Type *</Label>
                        <Select value={formData.incidentType} onValueChange={(v) => setFormData({ ...formData, incidentType: v })}>
                          <SelectTrigger data-testid="select-incident-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {INCIDENT_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Severity *</Label>
                        <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                          <SelectTrigger data-testid="select-severity">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITY_OPTIONS.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="incidentDate">Incident Date *</Label>
                        <Input
                          id="incidentDate"
                          data-testid="input-incident-date"
                          type="date"
                          value={formData.incidentDate}
                          onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        data-testid="input-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what happened in detail..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fatalities">Fatalities</Label>
                        <Input
                          id="fatalities"
                          data-testid="input-fatalities"
                          type="number"
                          min={0}
                          value={formData.fatalities}
                          onChange={(e) => setFormData({ ...formData, fatalities: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="injuries">Injuries</Label>
                        <Input
                          id="injuries"
                          data-testid="input-injuries"
                          type="number"
                          min={0}
                          value={formData.injuries}
                          onChange={(e) => setFormData({ ...formData, injuries: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <Button
                      data-testid="button-submit-incident"
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending}
                      className="w-full"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Incident Report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              {statsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
                  </div>
                  <div className="h-64 bg-muted rounded" />
                </div>
              ) : !stats || stats.totalIncidents === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium" data-testid="text-no-data">No incidents reported yet</h3>
                    <p className="text-muted-foreground mt-1">
                      When incidents are reported, safety statistics will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-8 h-8 text-orange-600" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="stat-total-incidents">{stats.totalIncidents}</p>
                            <p className="text-sm text-muted-foreground">Total Incidents</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Users className="w-8 h-8 text-red-600" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="stat-total-fatalities">{stats.totalFatalities}</p>
                            <p className="text-sm text-muted-foreground">Total Fatalities</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <HardHat className="w-8 h-8 text-yellow-600" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="stat-total-injuries">{stats.totalInjuries}</p>
                            <p className="text-sm text-muted-foreground">Total Injuries</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Incidents by Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.bySeverity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="severity" tickFormatter={(v) => formatSeverity(v)} />
                          <YAxis allowDecimals={false} />
                          <Tooltip labelFormatter={(v) => formatSeverity(v as string)} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Incidents by County</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.byCounty}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="county" angle={-45} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Incidents by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.byType}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" tickFormatter={(v) => formatIncidentType(v)} angle={-45} textAnchor="end" height={80} />
                          <YAxis allowDecimals={false} />
                          <Tooltip labelFormatter={(v) => formatIncidentType(v as string)} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {canManage && (
              <TabsContent value="manage" className="mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]" data-testid="filter-status">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-[180px]" data-testid="filter-severity">
                        <SelectValue placeholder="Filter by severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        {SEVERITY_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterCounty} onValueChange={setFilterCounty}>
                      <SelectTrigger className="w-[180px]" data-testid="filter-county">
                        <SelectValue placeholder="Filter by county" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Counties</SelectItem>
                        {LIBERIA_COUNTIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {incidentsLoading ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
                    </div>
                  ) : filteredIncidents.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No incidents found</h3>
                        <p className="text-muted-foreground mt-1">
                          No incidents match the current filters.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-3 font-medium">ID</th>
                                <th className="text-left p-3 font-medium">Incident Type</th>
                                <th className="text-left p-3 font-medium">Severity</th>
                                <th className="text-left p-3 font-medium">County</th>
                                <th className="text-left p-3 font-medium">Date</th>
                                <th className="text-left p-3 font-medium">Fatalities</th>
                                <th className="text-left p-3 font-medium">Injuries</th>
                                <th className="text-left p-3 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredIncidents.map((inc) => (
                                <tr
                                  key={inc.id}
                                  className="border-b hover-elevate cursor-pointer"
                                  onClick={() => {
                                    setSelectedIncident(inc);
                                    setUpdateStatus(inc.status);
                                    setInvestigationNotes(inc.investigationNotes || "");
                                  }}
                                  data-testid={`row-incident-${inc.id}`}
                                >
                                  <td className="p-3">{inc.id}</td>
                                  <td className="p-3">{formatIncidentType(inc.incidentType)}</td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className={SEVERITY_COLORS[inc.severity] || ""}>
                                      {formatSeverity(inc.severity)}
                                    </Badge>
                                  </td>
                                  <td className="p-3">{inc.county}</td>
                                  <td className="p-3">{inc.incidentDate}</td>
                                  <td className="p-3">{inc.fatalities}</td>
                                  <td className="p-3">{inc.injuries}</td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className={STATUS_COLORS[inc.status] || ""}>
                                      {formatStatus(inc.status)}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Dialog open={!!selectedIncident} onOpenChange={(open) => {
                  if (!open) {
                    setSelectedIncident(null);
                    setUpdateStatus("");
                    setInvestigationNotes("");
                  }
                }}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Incident #{selectedIncident?.id} Details
                      </DialogTitle>
                    </DialogHeader>
                    {selectedIncident && (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Reporter</p>
                            <p className="font-medium" data-testid="detail-reporter">{selectedIncident.reporterName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Employer</p>
                            <p className="font-medium" data-testid="detail-employer">{selectedIncident.employerName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedIncident.reporterEmail || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium">{selectedIncident.reporterPhone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sector</p>
                            <p className="font-medium">{selectedIncident.sector}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">County</p>
                            <p className="font-medium">{selectedIncident.county}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Incident Type</p>
                            <p className="font-medium">{formatIncidentType(selectedIncident.incidentType)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Severity</p>
                            <Badge variant="secondary" className={SEVERITY_COLORS[selectedIncident.severity] || ""}>
                              {formatSeverity(selectedIncident.severity)}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Incident Date</p>
                            <p className="font-medium">{selectedIncident.incidentDate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium">{selectedIncident.location || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fatalities</p>
                            <p className="font-medium">{selectedIncident.fatalities}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Injuries</p>
                            <p className="font-medium">{selectedIncident.injuries}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-sm">Description</p>
                          <p className="text-sm mt-1" data-testid="detail-description">{selectedIncident.description}</p>
                        </div>

                        <div className="border-t pt-4 grid gap-4">
                          <div className="grid gap-2">
                            <Label>Update Status</Label>
                            <Select value={updateStatus} onValueChange={setUpdateStatus}>
                              <SelectTrigger data-testid="select-update-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="investigationNotes">Investigation Notes</Label>
                            <Textarea
                              id="investigationNotes"
                              data-testid="input-investigation-notes"
                              value={investigationNotes}
                              onChange={(e) => setInvestigationNotes(e.target.value)}
                              placeholder="Add investigation notes..."
                              rows={3}
                            />
                          </div>
                          <Button
                            data-testid="button-update-incident"
                            onClick={handleUpdateIncident}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? "Updating..." : "Update Incident"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
