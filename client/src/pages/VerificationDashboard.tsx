import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLoadingSpinner, SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  User,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Eye,
  FileCheck,
  Flag,
  Users,
  ClipboardCheck,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import type { EmploymentSpell, AuditLog } from "@shared/schema";

const COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe",
];

const SECTORS = ["public", "private", "ngo", "informal", "seasonal"];

interface VerificationSummary {
  pending: number;
  employerVerified: number;
  enumeratorVerified: number;
  fullyVerified: number;
  flagged: number;
  rejected: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", color: "text-yellow-600", icon: Clock, badgeVariant: "outline" },
  employer_verified: { label: "Employer Signed", color: "text-blue-600", icon: Building2, badgeVariant: "secondary" },
  enumerator_verified: { label: "Field Verified", color: "text-purple-600", icon: ClipboardCheck, badgeVariant: "secondary" },
  fully_verified: { label: "Fully Verified", color: "text-green-600", icon: ShieldCheck, badgeVariant: "default" },
  flagged: { label: "Flagged", color: "text-orange-600", icon: Flag, badgeVariant: "destructive" },
  rejected: { label: "Rejected", color: "text-red-600", icon: ShieldX, badgeVariant: "destructive" },
};

export default function VerificationDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSpell, setSelectedSpell] = useState<EmploymentSpell | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [fieldVisitDate, setFieldVisitDate] = useState("");
  const [employeeConfirmed, setEmployeeConfirmed] = useState(true);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCounty, setFilterCounty] = useState<string>("");
  const [filterSector, setFilterSector] = useState<string>("");
  const [filterEmployer, setFilterEmployer] = useState<string>("");
  const [employerSearchInput, setEmployerSearchInput] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
    if (filterCounty && filterCounty !== "all") params.set("county", filterCounty);
    if (filterSector && filterSector !== "all") params.set("sector", filterSector);
    if (filterEmployer) params.set("employer", filterEmployer);
    return params.toString();
  }, [filterStatus, filterCounty, filterSector, filterEmployer]);

  const hasFilters = (filterStatus && filterStatus !== "all") || (filterCounty && filterCounty !== "all") || (filterSector && filterSector !== "all") || filterEmployer;

  const clearFilters = () => {
    setFilterStatus("");
    setFilterCounty("");
    setFilterSector("");
    setFilterEmployer("");
    setEmployerSearchInput("");
  };

  const { data: summary, isLoading: summaryLoading } = useQuery<VerificationSummary>({
    queryKey: ["/api/verification/summary"],
  });

  const { data: queue = [], isLoading: queueLoading, refetch: refetchQueue } = useQuery<EmploymentSpell[]>({
    queryKey: ["/api/verification/queue", queryParams],
    queryFn: async () => {
      const url = queryParams ? `/api/verification/queue?${queryParams}` : "/api/verification/queue";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: auditTrail = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/employment-spells", selectedSpell?.id, "audit-trail"],
    queryFn: async () => {
      const res = await fetch(`/api/employment-spells/${selectedSpell?.id}/audit-trail`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSpell,
  });

  const invalidateVerificationQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/verification/queue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/verification/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/employment-spells"] });
  };

  const employerVerifyMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/employment-spells/${id}/employer-verify`, { notes });
    },
    onSuccess: () => {
      invalidateVerificationQueries();
      toast({ title: "Record signed by employer" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    },
  });

  const enumeratorVerifyMutation = useMutation({
    mutationFn: async ({ id, employeeConfirmed, fieldVisitDate, notes }: { id: string; employeeConfirmed: boolean; fieldVisitDate: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/employment-spells/${id}/enumerator-verify`, { employeeConfirmed, fieldVisitDate, notes });
    },
    onSuccess: () => {
      invalidateVerificationQueries();
      toast({ title: "Field verification recorded" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    },
  });

  const ministryVerifyMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/employment-spells/${id}/ministry-verify`, { action, notes });
    },
    onSuccess: () => {
      invalidateVerificationQueries();
      toast({ title: "Ministry decision recorded" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDetailDialogOpen(false);
    setSelectedSpell(null);
    setVerifyNotes("");
    setFieldVisitDate("");
    setEmployeeConfirmed(true);
  };

  const openSpellDetail = (spell: EmploymentSpell) => {
    setSelectedSpell(spell);
    setDetailDialogOpen(true);
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const getTrustScoreColor = (score: string | null | undefined) => {
    const num = parseFloat(score as string) || 0;
    if (num >= 0.8) return "text-green-600";
    if (num >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrustScorePercent = (score: string | null | undefined) => {
    return Math.round((parseFloat(score as string) || 0) * 100);
  };

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isEmployer = user.role === "employer";
  const isEnumerator = user.role === "enumerator";
  const isDirector = user.role === "director";
  const isMinistry = user.role === "ministry" || user.role === "admin" || user.role === "director";

  const totalRecords = summary ? summary.pending + summary.employerVerified + summary.enumeratorVerified + summary.fullyVerified + summary.flagged + summary.rejected : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[hsl(355,70%,95%)] via-white to-[hsl(215,60%,95%)]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-verification-title">
            Employment Verification Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Three-layer verification system: Employer signs, Field Agent verifies, Ministry approves
          </p>
        </div>

        {/* Verification Pipeline Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { key: "pending", label: "Pending", count: summary?.pending || 0, icon: Clock, color: "bg-yellow-50 border-yellow-200" },
            { key: "employerVerified", label: "Employer Signed", count: summary?.employerVerified || 0, icon: Building2, color: "bg-blue-50 border-blue-200" },
            { key: "enumeratorVerified", label: "Field Verified", count: summary?.enumeratorVerified || 0, icon: ClipboardCheck, color: "bg-purple-50 border-purple-200" },
            { key: "fullyVerified", label: "Fully Verified", count: summary?.fullyVerified || 0, icon: ShieldCheck, color: "bg-green-50 border-green-200" },
            { key: "flagged", label: "Flagged", count: summary?.flagged || 0, icon: Flag, color: "bg-orange-50 border-orange-200" },
            { key: "rejected", label: "Rejected", count: summary?.rejected || 0, icon: ShieldX, color: "bg-red-50 border-red-200" },
          ].map((item) => (
            <Card key={item.key} className={`${item.color} border`} data-testid={`card-status-${item.key}`}>
              <CardContent className="p-4 text-center">
                <item.icon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Three-Signature Flow Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Three-Signature Verification Flow
            </CardTitle>
            <CardDescription>
              All three layers must sign for data to be fully verified and trusted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-[150px] text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-sm">1. Employer Signs</p>
                <p className="text-xs text-muted-foreground mt-1">Submits & confirms employment data</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{summary?.employerVerified || 0}</p>
              </div>
              <div className="text-2xl text-muted-foreground hidden sm:block">&rarr;</div>
              <div className="flex-1 min-w-[150px] text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold text-sm">2. Field Agent Verifies</p>
                <p className="text-xs text-muted-foreground mt-1">Physical workplace visit & cross-check</p>
                <p className="text-lg font-bold text-purple-600 mt-2">{summary?.enumeratorVerified || 0}</p>
              </div>
              <div className="text-2xl text-muted-foreground hidden sm:block">&rarr;</div>
              <div className="flex-1 min-w-[150px] text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold text-sm">3. Ministry Approves</p>
                <p className="text-xs text-muted-foreground mt-1">Final review & official approval</p>
                <p className="text-lg font-bold text-green-600 mt-2">{summary?.fullyVerified || 0}</p>
              </div>
            </div>
            {totalRecords > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Verification Progress</span>
                  <span>{totalRecords > 0 ? Math.round(((summary?.fullyVerified || 0) / totalRecords) * 100) : 0}% fully verified</span>
                </div>
                <Progress value={totalRecords > 0 ? ((summary?.fullyVerified || 0) / totalRecords) * 100 : 0} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Records
              </span>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="w-4 h-4 mr-1" /> Clear Filters
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => refetchQueue()} data-testid="button-refresh-queue">
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus} data-testid="select-filter-status">
                  <SelectTrigger data-testid="select-filter-status-trigger">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="employer_verified">Employer Signed</SelectItem>
                    <SelectItem value="enumerator_verified">Field Verified</SelectItem>
                    <SelectItem value="fully_verified">Fully Verified</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">County</label>
                <Select value={filterCounty} onValueChange={setFilterCounty}>
                  <SelectTrigger data-testid="select-filter-county-trigger">
                    <SelectValue placeholder="All Counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sector</label>
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger data-testid="select-filter-sector-trigger">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer</label>
                <div className="flex gap-1">
                  <Input
                    placeholder="Search employer..."
                    value={employerSearchInput}
                    onChange={(e) => setEmployerSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setFilterEmployer(employerSearchInput); }}
                    data-testid="input-filter-employer"
                  />
                  <Button size="icon" variant="outline" onClick={() => setFilterEmployer(employerSearchInput)} data-testid="button-search-employer">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground self-center">Active filters:</span>
                {filterStatus && filterStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusConfig[filterStatus]?.label || filterStatus}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterStatus("")} />
                  </Badge>
                )}
                {filterCounty && filterCounty !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    County: {filterCounty}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterCounty("")} />
                  </Badge>
                )}
                {filterSector && filterSector !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Sector: {filterSector}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterSector("")} />
                  </Badge>
                )}
                {filterEmployer && (
                  <Badge variant="secondary" className="gap-1">
                    Employer: {filterEmployer}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterEmployer(""); setEmployerSearchInput(""); }} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {hasFilters ? "Filtered Records" : (
                  isEnumerator ? "Employment Spells" :
                  isMinistry ? "Records Awaiting Final Approval" :
                  isEmployer ? "Records Awaiting Your Signature" :
                  "Verification Queue"
                )}
                {queue.length > 0 && <Badge variant="secondary" className="ml-2">{queue.length}</Badge>}
              </span>
            </CardTitle>
            <CardDescription>
              {isEnumerator && !hasFilters && "Browse all employment records — use filters above to narrow by status, county, sector, or employer"}
              {isEnumerator && hasFilters && `Showing ${queue.length} records matching your filters`}
              {isMinistry && !hasFilters && "Records that have been field-verified and need your final ministry approval"}
              {isMinistry && hasFilters && `Showing ${queue.length} records matching your filters`}
              {isEmployer && !hasFilters && "Records you have submitted that are pending your signature"}
              {isEmployer && hasFilters && `Showing ${queue.length} records matching your filters`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <SectionLoadingSpinner />
            ) : queue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {hasFilters ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No records found</p>
                    <p className="text-sm">Try adjusting your filters to see more results</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Clear Filters</Button>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No records awaiting your verification</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((spell) => (
                  <SpellCard key={spell.id} spell={spell} onView={openSpellDetail} userRole={user.role} />
                ))}
                {queue.length >= 200 && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing first 200 records — use filters to narrow your search
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail & Verification Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedSpell && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Employment Record Details
                  </DialogTitle>
                  <DialogDescription>
                    Review the record and take action
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Status & Trust Score */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const config = statusConfig[selectedSpell.verificationStatus] || statusConfig.pending;
                        const Icon = config.icon;
                        return (
                          <>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                            <Badge variant={config.badgeVariant}>{config.label}</Badge>
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Trust Score</p>
                      <p className={`text-xl font-bold ${getTrustScoreColor(selectedSpell.trustScore)}`}>
                        {getTrustScorePercent(selectedSpell.trustScore)}%
                      </p>
                    </div>
                  </div>

                  {/* Discrepancy Warning */}
                  {selectedSpell.discrepancyFlag && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-800">Discrepancy Detected</p>
                        <p className="text-sm text-orange-700">{selectedSpell.discrepancyNotes || "This record has been flagged for inconsistencies"}</p>
                      </div>
                    </div>
                  )}

                  {/* Employer Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Building2 className="w-4 h-4" /> Employer</h4>
                      <p className="text-sm">{selectedSpell.employerName}</p>
                      <p className="text-xs text-muted-foreground">{selectedSpell.employerType} &bull; {selectedSpell.sector}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Work Location</h4>
                      <p className="text-sm">{selectedSpell.county}{selectedSpell.district ? `, ${selectedSpell.district}` : ""}</p>
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><User className="w-4 h-4" /> Employee</h4>
                      <p className="text-sm font-medium">{selectedSpell.employeeName || "Not provided"}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSpell.employeeGender && `${selectedSpell.employeeGender}`}
                        {selectedSpell.employeeAge && `, Age ${selectedSpell.employeeAge}`}
                      </p>
                      {selectedSpell.employeeAddress && <p className="text-xs text-muted-foreground">{selectedSpell.employeeAddress}</p>}
                      {selectedSpell.employeeCounty && <p className="text-xs text-muted-foreground">{selectedSpell.employeeCounty}{selectedSpell.employeeDistrict ? `, ${selectedSpell.employeeDistrict}` : ""}</p>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Briefcase className="w-4 h-4" /> Job Details</h4>
                      <p className="text-sm">{selectedSpell.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{selectedSpell.contractType?.replace("_", " ")}</p>
                      {selectedSpell.monthlySalary && (
                        <p className="text-xs text-muted-foreground">
                          {selectedSpell.currency} {Number(selectedSpell.monthlySalary).toLocaleString()}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm font-medium">{formatDate(selectedSpell.startDate)}</p>
                    </div>
                    {selectedSpell.endDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="text-sm font-medium">{formatDate(selectedSpell.endDate)}</p>
                      </div>
                    )}
                  </div>

                  {/* Verification Timeline */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Verification Timeline</h4>
                    <div className="space-y-3 border-l-2 border-muted pl-4 ml-2">
                      <TimelineItem
                        label="Employer Signed"
                        date={selectedSpell.employerVerifiedAt}
                        notes={selectedSpell.employerVerificationNotes}
                        completed={!!selectedSpell.employerVerifiedAt}
                        icon={Building2}
                      />
                      <TimelineItem
                        label="Field Agent Verified"
                        date={selectedSpell.enumeratorVerifiedAt}
                        notes={selectedSpell.enumeratorVerificationNotes}
                        completed={!!selectedSpell.enumeratorVerifiedAt}
                        icon={ClipboardCheck}
                        extra={selectedSpell.enumeratorEmployeeConfirmed !== null && selectedSpell.enumeratorEmployeeConfirmed !== undefined ? (
                          <span className={`text-xs ${selectedSpell.enumeratorEmployeeConfirmed ? "text-green-600" : "text-red-600"}`}>
                            {selectedSpell.enumeratorEmployeeConfirmed ? "Employee confirmed present" : "Employee NOT confirmed"}
                          </span>
                        ) : null}
                      />
                      <TimelineItem
                        label="Ministry Approved"
                        date={selectedSpell.ministryVerifiedAt}
                        notes={selectedSpell.ministryVerificationNotes}
                        completed={!!selectedSpell.ministryVerifiedAt}
                        icon={ShieldCheck}
                      />
                    </div>
                  </div>

                  {/* Audit Trail */}
                  {auditTrail.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Audit Trail</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {auditTrail.map((log) => (
                          <div key={log.id} className="text-xs border-b pb-1">
                            <span className="font-medium">{log.action}</span>
                            <span className="text-muted-foreground"> — {formatDate(log.occurredAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  {/* Employer can sign pending records */}
                  {(isEmployer || user.role === "admin") && selectedSpell.verificationStatus === "pending" && (
                    <Button
                      onClick={() => employerVerifyMutation.mutate({ id: selectedSpell.id, notes: verifyNotes })}
                      disabled={employerVerifyMutation.isPending}
                      className="gap-2"
                      data-testid="button-employer-sign"
                    >
                      <Building2 className="w-4 h-4" />
                      {employerVerifyMutation.isPending ? "Signing..." : "Sign as Employer"}
                    </Button>
                  )}

                  {/* Enumerator can verify employer-signed records */}
                  {(isEnumerator || user.role === "admin") && selectedSpell.verificationStatus === "employer_verified" && (
                    <div className="w-full space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Field Visit Date *</label>
                          <Input
                            type="date"
                            value={fieldVisitDate}
                            onChange={(e) => setFieldVisitDate(e.target.value)}
                            data-testid="input-field-visit-date"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Employee Present at Workplace?</label>
                          <div className="flex gap-2 mt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={employeeConfirmed ? "default" : "outline"}
                              onClick={() => setEmployeeConfirmed(true)}
                              data-testid="button-employee-confirmed-yes"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Yes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!employeeConfirmed ? "destructive" : "outline"}
                              onClick={() => setEmployeeConfirmed(false)}
                              data-testid="button-employee-confirmed-no"
                            >
                              <XCircle className="w-4 h-4 mr-1" /> No
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Field visit notes..."
                        value={verifyNotes}
                        onChange={(e) => setVerifyNotes(e.target.value)}
                        rows={2}
                        data-testid="input-enumerator-notes"
                      />
                      <Button
                        onClick={() => {
                          if (!fieldVisitDate) {
                            toast({ title: "Please enter the field visit date", variant: "destructive" });
                            return;
                          }
                          enumeratorVerifyMutation.mutate({
                            id: selectedSpell.id,
                            employeeConfirmed,
                            fieldVisitDate,
                            notes: verifyNotes,
                          });
                        }}
                        disabled={enumeratorVerifyMutation.isPending}
                        className="gap-2 w-full"
                        data-testid="button-enumerator-verify"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        {enumeratorVerifyMutation.isPending ? "Submitting..." : "Submit Field Verification"}
                      </Button>
                    </div>
                  )}

                  {/* Ministry can approve/reject enumerator-verified or flagged records */}
                  {isMinistry && (selectedSpell.verificationStatus === "enumerator_verified" || selectedSpell.verificationStatus === "flagged") && (
                    <div className="w-full space-y-3">
                      <Textarea
                        placeholder="Ministry review notes..."
                        value={verifyNotes}
                        onChange={(e) => setVerifyNotes(e.target.value)}
                        rows={2}
                        data-testid="input-ministry-notes"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => ministryVerifyMutation.mutate({ id: selectedSpell.id, action: "approve", notes: verifyNotes })}
                          disabled={ministryVerifyMutation.isPending}
                          className="gap-2 flex-1"
                          data-testid="button-ministry-approve"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => ministryVerifyMutation.mutate({ id: selectedSpell.id, action: "flag", notes: verifyNotes })}
                          disabled={ministryVerifyMutation.isPending}
                          className="gap-2"
                          data-testid="button-ministry-flag"
                        >
                          <Flag className="w-4 h-4" />
                          Flag
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => ministryVerifyMutation.mutate({ id: selectedSpell.id, action: "reject", notes: verifyNotes })}
                          disabled={ministryVerifyMutation.isPending}
                          className="gap-2"
                          data-testid="button-ministry-reject"
                        >
                          <ShieldX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

function SpellCard({ spell, onView, userRole }: { spell: EmploymentSpell; onView: (spell: EmploymentSpell) => void; userRole: string }) {
  const config = statusConfig[spell.verificationStatus] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onView(spell)}
      data-testid={`card-spell-${spell.id}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{spell.employeeName || "Unknown Employee"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {spell.jobTitle} at {spell.employerName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">{spell.county}</p>
          <p className="text-xs text-muted-foreground">{spell.sector}</p>
        </div>
        <Badge variant={config.badgeVariant} className="whitespace-nowrap">{config.label}</Badge>
        {spell.discrepancyFlag && (
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        )}
        <Button variant="ghost" size="sm" data-testid={`button-view-${spell.id}`}>
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function TimelineItem({ label, date, notes, completed, icon: Icon, extra }: {
  label: string;
  date: Date | string | null | undefined;
  notes: string | null | undefined;
  completed: boolean;
  icon: any;
  extra?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 ${completed ? "bg-green-500 border-green-500" : "bg-white border-muted-foreground"}`} />
      <div className={completed ? "" : "opacity-50"}>
        <div className="flex items-center gap-1">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {date && (
          <p className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {notes && <p className="text-xs text-muted-foreground italic mt-0.5">{notes}</p>}
        {extra}
      </div>
    </div>
  );
}
