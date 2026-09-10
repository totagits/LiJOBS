import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Users, Briefcase, Clock, CheckCircle2, XCircle, MessageSquare, Eye, FileText,
  User, Phone, Mail, MapPin, GraduationCap, Download, ExternalLink, Calendar
} from "lucide-react";
import type { Vacancy, Application } from "@shared/schema";

const APPLICATION_STATUSES = [
  { value: "submitted", label: "Submitted", color: "secondary" },
  { value: "reviewed", label: "Reviewed", color: "secondary" },
  { value: "shortlisted", label: "Shortlisted", color: "default" },
  { value: "interview", label: "Interview", color: "default" },
  { value: "offered", label: "Offered", color: "default" },
  { value: "hired", label: "Hired", color: "default" },
  { value: "rejected", label: "Rejected", color: "destructive" },
  { value: "withdrawn", label: "Withdrawn", color: "secondary" },
] as const;

const EDUCATION_LABELS: Record<string, string> = {
  none: "No Formal Education",
  primary: "Primary School",
  junior_high: "Junior High School",
  senior_high: "Senior High School",
  vocational: "Vocational/Technical",
  associate: "Associate Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: "Doctorate/PhD",
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export default function EmployerApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: vacancies = [], isLoading: vacanciesLoading } = useQuery<Vacancy[]>({
    queryKey: ["/api/vacancies"],
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/vacancies", selectedVacancyId, "applications"],
    enabled: !!selectedVacancyId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/applications/${id}`, { status, notes });
    },
    onSuccess: () => {
      toast({ title: "Application updated", description: "The application status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/vacancies", selectedVacancyId, "applications"] });
      setSelectedApplication(null);
      setNewStatus("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusInfo = APPLICATION_STATUSES.find(s => s.value === status);
    return (
      <Badge variant={statusInfo?.color as "default" | "secondary" | "destructive" || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const handleUpdateStatus = () => {
    if (!selectedApplication || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedApplication.id,
      status: newStatus,
      notes: notes || undefined,
    });
  };

  const groupedApplications = {
    pending: applications.filter(a => ["submitted", "reviewed"].includes(a.status)),
    inProgress: applications.filter(a => ["shortlisted", "interview", "offered"].includes(a.status)),
    completed: applications.filter(a => ["hired", "rejected", "withdrawn"].includes(a.status)),
  };

  const renderApplicationCard = (application: Application) => (
    <Card key={application.id} data-testid={`card-application-${application.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{application.fullName || "Applicant"}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {application.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {application.phoneNumber}
            </div>
          )}
          {application.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {application.email}
            </div>
          )}
          {application.county && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {application.county}{application.district ? `, ${application.district}` : ""}
            </div>
          )}
          {application.educationLevel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              {EDUCATION_LABELS[application.educationLevel] || application.educationLevel}
            </div>
          )}
          {application.yearsOfExperience != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              {application.yearsOfExperience} years experience
            </div>
          )}
        </div>

        {application.resumeUrl && (
          <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <FileText className="h-3.5 w-3.5" />
            View Resume
          </a>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSelectedApplication(application);
                setNewStatus(application.status);
                setNotes(application.notes || "");
              }}
              data-testid={`button-review-${application.id}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Profile & Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{application.fullName || "Applicant Profile"}</DialogTitle>
              <DialogDescription>
                Full application details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* Personal Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal Information</h4>
                <div className="space-y-1.5 pl-6">
                  <InfoRow icon={User} label="Full Name" value={application.fullName} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={application.dateOfBirth} />
                  <InfoRow icon={User} label="Gender" value={application.gender} />
                  <InfoRow icon={User} label="Nationality" value={application.nationality} />
                  <InfoRow icon={Phone} label="Phone" value={application.phoneNumber} />
                  <InfoRow icon={Mail} label="Email" value={application.email} />
                  <InfoRow icon={MapPin} label="County" value={application.county} />
                  <InfoRow icon={MapPin} label="District" value={application.district} />
                  <InfoRow icon={MapPin} label="Address" value={application.physicalAddress} />
                </div>
              </div>

              <Separator />

              {/* Education & Experience */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Education & Experience</h4>
                <div className="space-y-1.5 pl-6">
                  <InfoRow icon={GraduationCap} label="Education" value={application.educationLevel ? (EDUCATION_LABELS[application.educationLevel] || application.educationLevel) : null} />
                  <InfoRow icon={GraduationCap} label="Institution" value={application.educationInstitution} />
                  <InfoRow icon={GraduationCap} label="Field of Study" value={application.fieldOfStudy} />
                  <InfoRow icon={Briefcase} label="Experience" value={application.yearsOfExperience != null ? `${application.yearsOfExperience} years` : null} />
                  <InfoRow icon={Briefcase} label="Current Employer" value={application.currentEmployer} />
                  <InfoRow icon={Briefcase} label="Current Title" value={application.currentJobTitle} />
                </div>
                {application.relevantSkills && (
                  <div className="mt-2 pl-6">
                    <p className="text-xs text-muted-foreground mb-1">Relevant Skills:</p>
                    <p className="text-sm bg-muted p-2 rounded-md">{application.relevantSkills}</p>
                  </div>
                )}
                {application.languagesSpoken && (
                  <div className="mt-2 pl-6">
                    <p className="text-xs text-muted-foreground mb-1">Languages:</p>
                    <p className="text-sm">{application.languagesSpoken}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Job Details */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Job-Specific</h4>
                <div className="space-y-1.5 pl-6">
                  {application.expectedSalary != null && (
                    <InfoRow icon={Briefcase} label="Expected Salary" value={`${application.salaryCurrency || "LRD"} ${application.expectedSalary.toLocaleString()}/month`} />
                  )}
                  <InfoRow icon={Calendar} label="Available Start" value={application.availableStartDate} />
                  <InfoRow icon={Briefcase} label="How Heard" value={application.howHeardAboutJob} />
                  {application.willingToRelocate && <InfoRow icon={MapPin} label="Relocation" value="Willing to relocate" />}
                  {application.hasDisability && application.hasDisability !== "prefer_not_to_say" && (
                    <InfoRow icon={User} label="Disability" value={application.hasDisability === "yes" ? "Yes" : "No"} />
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              {application.coverLetter && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Cover Letter</h4>
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {application.coverLetter}
                    </div>
                  </div>
                </>
              )}

              {/* Documents */}
              {(application.resumeUrl || (application.supportingDocUrls && application.supportingDocUrls.length > 0)) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documents</h4>
                    <div className="space-y-2 pl-6">
                      {application.resumeUrl && (
                        <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Download className="h-3.5 w-3.5" />
                          Resume / CV
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {application.supportingDocUrls?.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Download className="h-3.5 w-3.5" />
                          Supporting Document {i + 1}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* References */}
              {(application.referenceName1 || application.referenceName2) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> References</h4>
                    <div className="space-y-3 pl-6">
                      {application.referenceName1 && (
                        <div className="text-sm">
                          <p className="font-medium">{application.referenceName1}</p>
                          {application.referenceRelation1 && <p className="text-muted-foreground text-xs">{application.referenceRelation1}</p>}
                          {application.referencePhone1 && <p className="text-muted-foreground text-xs">{application.referencePhone1}</p>}
                        </div>
                      )}
                      {application.referenceName2 && (
                        <div className="text-sm">
                          <p className="font-medium">{application.referenceName2}</p>
                          {application.referenceRelation2 && <p className="text-muted-foreground text-xs">{application.referenceRelation2}</p>}
                          {application.referencePhone2 && <p className="text-muted-foreground text-xs">{application.referencePhone2}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Status Update */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Update Application Status</h4>
                <div className="space-y-3">
                  <div>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Textarea
                      data-testid="textarea-notes"
                      placeholder="Add internal notes about this applicant..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={updateStatusMutation.isPending}
                data-testid="button-save-status"
              >
                {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <BackButton />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage Applications</h1>
          <p className="text-muted-foreground">Review and manage job applications for your vacancies</p>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Select a Vacancy</label>
          <Select value={selectedVacancyId || ""} onValueChange={setSelectedVacancyId}>
            <SelectTrigger className="w-full md:w-[400px]" data-testid="select-vacancy">
              <SelectValue placeholder="Choose a vacancy to view applications" />
            </SelectTrigger>
            <SelectContent>
              {vacancies.map(vacancy => (
                <SelectItem key={vacancy.id} value={vacancy.id}>
                  {vacancy.title} ({vacancy.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {vacanciesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-[400px]" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : vacancies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Vacancies Posted</h3>
              <p className="text-muted-foreground">
                You haven't posted any job vacancies yet. Post a vacancy to start receiving applications.
              </p>
            </CardContent>
          </Card>
        ) : !selectedVacancyId ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Select a Vacancy</h3>
              <p className="text-muted-foreground">
                Choose a vacancy from the dropdown above to view its applications.
              </p>
            </CardContent>
          </Card>
        ) : applicationsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">
                No one has applied to this vacancy yet. Share the job listing to attract candidates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({groupedApplications.pending.length})
              </TabsTrigger>
              <TabsTrigger value="inProgress" data-testid="tab-in-progress">
                In Progress ({groupedApplications.inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                Completed ({groupedApplications.completed.length})
              </TabsTrigger>
            </TabsList>

            {Object.entries(groupedApplications).map(([key, apps]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                {apps.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">No applications in this category</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {apps.map(renderApplicationCard)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupedApplications.pending.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === "hired").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
