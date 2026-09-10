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
import { AlertTriangle, Search, FileText, Shield, CheckCircle, Clock, Eye } from "lucide-react";
import type { GrievanceCase } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const CATEGORIES = [
  { value: "wage_dispute", label: "Wage Dispute" },
  { value: "wrongful_termination", label: "Wrongful Termination" },
  { value: "workplace_harassment", label: "Workplace Harassment" },
  { value: "unsafe_conditions", label: "Unsafe Conditions" },
  { value: "discrimination", label: "Discrimination" },
  { value: "child_labour", label: "Child Labour" },
  { value: "forced_labour", label: "Forced Labour" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  under_review: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  investigating: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  resolved: "bg-green-500/15 text-green-700 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatCategory(cat: string) {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.label : cat;
}

function formatStatus(status: string) {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found ? found.label : status;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={STATUS_COLORS[status] || ""} data-testid={`badge-status-${status}`}>
      {formatStatus(status)}
    </Badge>
  );
}

export default function GrievanceSystem() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "ministry";

  const [activeTab, setActiveTab] = useState("file");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackedCase, setTrackedCase] = useState<GrievanceCase | null>(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [successTracking, setSuccessTracking] = useState("");

  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    county: "",
    employerName: "",
    category: "",
    description: "",
    priority: "medium",
    status: "submitted",
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<GrievanceCase | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const { data: allCases = [], isLoading: casesLoading } = useQuery<GrievanceCase[]>({
    queryKey: ["/api/grievances"],
    enabled: canManage,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/grievances", data);
      return res.json();
    },
    onSuccess: (data: GrievanceCase) => {
      setSuccessTracking(data.trackingNumber);
      setFormData({
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        county: "",
        employerName: "",
        category: "",
        description: "",
        priority: "medium",
        status: "submitted",
      });
      toast({ title: "Complaint filed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to submit complaint", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      return apiRequest("PATCH", `/api/grievances/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grievances"] });
      toast({ title: "Case updated successfully" });
      setSelectedCase(null);
    },
    onError: () => {
      toast({ title: "Failed to update case", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.contactName.trim()) {
      toast({ title: "Contact name is required", variant: "destructive" });
      return;
    }
    if (!formData.county) {
      toast({ title: "County is required", variant: "destructive" });
      return;
    }
    if (!formData.category) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleTrack = async () => {
    if (!trackingInput.trim()) {
      setTrackError("Please enter a tracking number");
      return;
    }
    setTrackError("");
    setTrackedCase(null);
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/grievances/track/${encodeURIComponent(trackingInput.trim())}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setTrackError("No complaint found with that tracking number");
        return;
      }
      const data = await res.json();
      setTrackedCase(data);
    } catch {
      setTrackError("Failed to look up complaint");
    } finally {
      setTrackLoading(false);
    }
  };

  const handleOpenCase = (c: GrievanceCase) => {
    setSelectedCase(c);
    setEditStatus(c.status);
    setEditPriority(c.priority);
    setEditNotes(c.resolutionNotes || "");
  };

  const handleUpdateCase = () => {
    if (!selectedCase) return;
    const data: Record<string, string> = {};
    if (editStatus !== selectedCase.status) data.status = editStatus;
    if (editPriority !== selectedCase.priority) data.priority = editPriority;
    if (editNotes !== (selectedCase.resolutionNotes || "")) data.resolutionNotes = editNotes;
    if (Object.keys(data).length === 0) {
      toast({ title: "No changes to save" });
      return;
    }
    updateMutation.mutate({ id: selectedCase.id, data });
  };

  const filteredCases = allCases.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (countyFilter !== "all" && c.county !== countyFilter) return false;
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
              <AlertTriangle className="w-8 h-8 text-primary" />
              Grievance & Complaint System
            </h1>
            <p className="text-muted-foreground mt-1">
              File and track labour-related complaints
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-list">
              <TabsTrigger value="file" data-testid="tab-file">
                <FileText className="w-4 h-4 mr-2" />
                File a Complaint
              </TabsTrigger>
              <TabsTrigger value="track" data-testid="tab-track">
                <Search className="w-4 h-4 mr-2" />
                Track Complaint
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="manage" data-testid="tab-manage">
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Cases
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="file" className="mt-6">
              {successTracking ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                    <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">Complaint Filed Successfully</h2>
                    <p className="text-muted-foreground mb-4">Your tracking number is:</p>
                    <div className="bg-muted rounded-md p-4 inline-block mb-4">
                      <p className="text-2xl font-mono font-bold" data-testid="text-tracking-number">{successTracking}</p>
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">
                      Please save this tracking number. You will need it to check the status of your complaint.
                    </p>
                    <Button
                      data-testid="button-file-another"
                      onClick={() => setSuccessTracking("")}
                    >
                      File Another Complaint
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit a Complaint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contactName">Contact Name *</Label>
                        <Input
                          id="contactName"
                          data-testid="input-contact-name"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            data-testid="input-contact-email"
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input
                            id="contactPhone"
                            data-testid="input-contact-phone"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            placeholder="+231 xxx xxx xxxx"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>County *</Label>
                          <Select value={formData.county} onValueChange={(v) => setFormData({ ...formData, county: v })}>
                            <SelectTrigger data-testid="select-county">
                              <SelectValue placeholder="Select county" />
                            </SelectTrigger>
                            <SelectContent>
                              {LIBERIA_COUNTIES.map(county => (
                                <SelectItem key={county} value={county}>{county}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="employerName">Employer Name</Label>
                          <Input
                            id="employerName"
                            data-testid="input-employer-name"
                            value={formData.employerName}
                            onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                            placeholder="Name of employer (if applicable)"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Category *</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select complaint category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          data-testid="input-description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Please describe your complaint in detail..."
                          className="min-h-[120px]"
                        />
                      </div>

                      <Button
                        data-testid="button-submit-complaint"
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                        className="w-full"
                      >
                        {submitMutation.isPending ? "Submitting..." : "Submit Complaint"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="track" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Track Your Complaint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      data-testid="input-tracking-number"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Enter tracking number (e.g., GRV-2026-ABC123)"
                      onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    />
                    <Button
                      data-testid="button-track"
                      onClick={handleTrack}
                      disabled={trackLoading}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {trackLoading ? "Searching..." : "Look Up"}
                    </Button>
                  </div>

                  {trackError && (
                    <p className="text-destructive text-sm mt-3" data-testid="text-track-error">{trackError}</p>
                  )}

                  {trackedCase && (
                    <Card className="mt-6">
                      <CardContent className="pt-6">
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-lg font-semibold" data-testid="text-tracked-tracking">
                              {trackedCase.trackingNumber}
                            </h3>
                            <StatusBadge status={trackedCase.status} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Category:</span>{" "}
                              <span data-testid="text-tracked-category">{formatCategory(trackedCase.category)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">County:</span>{" "}
                              <span data-testid="text-tracked-county">{trackedCase.county}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>{" "}
                              <span data-testid="text-tracked-date">
                                {new Date(trackedCase.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {trackedCase.resolutionNotes && (
                            <div className="border-t pt-3 mt-2">
                              <p className="text-sm text-muted-foreground mb-1">Resolution Notes:</p>
                              <p className="text-sm" data-testid="text-tracked-resolution">{trackedCase.resolutionNotes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {canManage && (
              <TabsContent value="manage" className="mt-6">
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={countyFilter} onValueChange={setCountyFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-filter-county">
                      <SelectValue placeholder="Filter by county" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Counties</SelectItem>
                      {LIBERIA_COUNTIES.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {casesLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
                  </div>
                ) : filteredCases.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No cases found</h3>
                      <p className="text-muted-foreground mt-1">No grievance cases match the current filters.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Tracking #</th>
                              <th className="text-left p-3 font-medium">Category</th>
                              <th className="text-left p-3 font-medium">County</th>
                              <th className="text-left p-3 font-medium">Status</th>
                              <th className="text-left p-3 font-medium">Priority</th>
                              <th className="text-left p-3 font-medium">Submitted</th>
                              <th className="text-left p-3 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCases.map(c => (
                              <tr
                                key={c.id}
                                className="border-b hover-elevate cursor-pointer"
                                onClick={() => handleOpenCase(c)}
                                data-testid={`row-case-${c.id}`}
                              >
                                <td className="p-3 font-mono text-xs">{c.trackingNumber}</td>
                                <td className="p-3">{formatCategory(c.category)}</td>
                                <td className="p-3">{c.county}</td>
                                <td className="p-3"><StatusBadge status={c.status} /></td>
                                <td className="p-3 capitalize">{c.priority}</td>
                                <td className="p-3">{new Date(c.submittedAt).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={`button-view-case-${c.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCase(c);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Case Details</DialogTitle>
                    </DialogHeader>
                    {selectedCase && (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tracking:</span>
                            <p className="font-mono" data-testid="text-dialog-tracking">{selectedCase.trackingNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <p data-testid="text-dialog-category">{formatCategory(selectedCase.category)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">County:</span>
                            <p data-testid="text-dialog-county">{selectedCase.county}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Contact:</span>
                            <p data-testid="text-dialog-contact">{selectedCase.contactName}</p>
                          </div>
                          {selectedCase.employerName && (
                            <div>
                              <span className="text-muted-foreground">Employer:</span>
                              <p data-testid="text-dialog-employer">{selectedCase.employerName}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <p>{new Date(selectedCase.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="text-sm mt-1" data-testid="text-dialog-description">{selectedCase.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                              <SelectTrigger data-testid="select-edit-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={editPriority} onValueChange={setEditPriority}>
                              <SelectTrigger data-testid="select-edit-priority">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRIORITY_OPTIONS.map(p => (
                                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Resolution Notes</Label>
                          <Textarea
                            data-testid="input-resolution-notes"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add resolution notes..."
                          />
                        </div>

                        <Button
                          data-testid="button-update-case"
                          onClick={handleUpdateCase}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? "Updating..." : "Update Case"}
                        </Button>
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
