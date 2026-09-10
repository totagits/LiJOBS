import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Briefcase, MapPin, Building2, Clock, DollarSign, Search, Filter, Users, Send, 
  CheckCircle2, ArrowLeft, Loader2, User, GraduationCap
} from "lucide-react";
import type { Vacancy, Employer, Application } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const HOW_HEARD_OPTIONS = [
  { value: "lijobs", label: "LiJOBS Platform" },
  { value: "newspaper", label: "Newspaper" },
  { value: "radio", label: "Radio" },
  { value: "referral", label: "Referral from Someone" },
  { value: "social_media", label: "Social Media" },
  { value: "employer_website", label: "Employer Website" },
  { value: "job_fair", label: "Job Fair" },
  { value: "other", label: "Other" },
];

export default function Jobs() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Simplified application form state (profile data is captured during registration)
  const [formData, setFormData] = useState({
    coverLetter: "",
    howHeardAboutJob: "",
  });

  const { data: vacancies = [], isLoading: vacanciesLoading } = useQuery<Vacancy[]>({
    queryKey: ["/api/vacancies"],
  });

  const { data: employers = [] } = useQuery<Employer[]>({
    queryKey: ["/api/employers"],
  });

  const { data: myApplications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications/me"],
    enabled: isAuthenticated,
  });

  const applyMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return apiRequest("POST", "/api/applications", data);
    },
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "Your application has been sent to the employer." });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/me"] });
      setSelectedVacancy(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ coverLetter: "", howHeardAboutJob: "" });
  };

  const getEmployerName = (employerId: string) => {
    const employer = employers.find(e => e.id === employerId);
    return employer?.legalName || "Unknown Employer";
  };

  const hasApplied = (vacancyId: string) => {
    return myApplications.some(a => a.vacancyId === vacancyId);
  };

  const filteredVacancies = vacancies.filter(v => {
    const matchesSearch = searchQuery === "" || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = countyFilter === "all" || v.county === countyFilter;
    return matchesSearch && matchesCounty && v.status === "open";
  });

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;

    const applicationData: Record<string, any> = {
      vacancyId: selectedVacancy.id,
      fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Applicant",
      phoneNumber: user?.phone || "",
      email: user?.email || "",
      coverLetter: formData.coverLetter || undefined,
      howHeardAboutJob: formData.howHeardAboutJob || undefined,
    };

    applyMutation.mutate(applicationData);
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Application form view
  if (selectedVacancy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => { setSelectedVacancy(null); resetForm(); }}
            data-testid="button-back-to-jobs"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Listings
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">{selectedVacancy.title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {getEmployerName(selectedVacancy.employerId)}
                  </span>
                  {selectedVacancy.county && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedVacancy.county}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedVacancy.contractType}
                  </span>
                  {(selectedVacancy.minSalary || selectedVacancy.maxSalary) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {selectedVacancy.minSalary && selectedVacancy.maxSalary 
                        ? `${selectedVacancy.currency} ${selectedVacancy.minSalary.toLocaleString()} - ${selectedVacancy.maxSalary.toLocaleString()}`
                        : selectedVacancy.minSalary 
                          ? `From ${selectedVacancy.currency} ${selectedVacancy.minSalary.toLocaleString()}`
                          : `Up to ${selectedVacancy.currency} ${selectedVacancy.maxSalary?.toLocaleString()}`
                      }
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              {(selectedVacancy.description || selectedVacancy.requiredEducation || selectedVacancy.requiredExperience || (selectedVacancy.requiredSkills && selectedVacancy.requiredSkills.length > 0)) && (
                <CardContent className="space-y-3">
                  {selectedVacancy.description && (
                    <p className="text-sm text-muted-foreground">{selectedVacancy.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedVacancy.requiredEducation && (
                      <Badge variant="outline"><GraduationCap className="h-3 w-3 mr-1" />{selectedVacancy.requiredEducation}</Badge>
                    )}
                    {selectedVacancy.requiredExperience && (
                      <Badge variant="outline"><Briefcase className="h-3 w-3 mr-1" />{selectedVacancy.requiredExperience}+ years experience</Badge>
                    )}
                    {selectedVacancy.requiredSkills?.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            <form onSubmit={handleSubmitApplication}>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-apply-title">Apply for This Position</h2>
              <p className="text-muted-foreground mb-6">Your profile information (education, skills, experience, references, documents) from registration will be included automatically with this application.</p>

              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Applying as: {user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}{user?.phone ? ` | ${user.phone}` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">Your full profile (skills, education, work history, documents, and references) will be shared with the employer.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="coverLetter">Cover Letter / Why You're a Good Fit</Label>
                    <Textarea
                      id="coverLetter"
                      data-testid="textarea-cover-letter"
                      value={formData.coverLetter}
                      onChange={e => updateField("coverLetter", e.target.value)}
                      placeholder="Tell the employer why you're interested in this position and what makes you a strong candidate..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="howHeardAboutJob">How Did You Hear About This Job?</Label>
                    <Select value={formData.howHeardAboutJob} onValueChange={v => updateField("howHeardAboutJob", v)}>
                      <SelectTrigger data-testid="select-how-heard"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {HOW_HEARD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 mb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedVacancy(null); resetForm(); }}
                  data-testid="button-cancel-application"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Submit Application</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Job listings view
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <BackButton />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Jobs in Liberia</h1>
          <p className="text-muted-foreground">Browse available positions across all sectors</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-job-search"
              placeholder="Search jobs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={countyFilter} onValueChange={setCountyFilter}>
            <SelectTrigger className="w-full md:w-[200px]" data-testid="select-county-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {LIBERIA_COUNTIES.map(county => (
                <SelectItem key={county} value={county}>{county}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {vacanciesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVacancies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Vacancies Found</h3>
              <p className="text-muted-foreground">
                {vacancies.length === 0 
                  ? "No job vacancies have been posted yet. Check back soon!"
                  : "No jobs match your search criteria. Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVacancies.map(vacancy => (
              <Card key={vacancy.id} className="flex flex-col" data-testid={`card-vacancy-${vacancy.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{vacancy.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {getEmployerName(vacancy.employerId)}
                      </CardDescription>
                    </div>
                    {hasApplied(vacancy.id) && (
                      <Badge variant="secondary" className="shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {vacancy.description || "No description provided"}
                  </p>
                  <div className="space-y-2 text-sm">
                    {vacancy.county && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {vacancy.county}{vacancy.district ? `, ${vacancy.district}` : ""}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {vacancy.contractType}
                    </div>
                    {(vacancy.minSalary || vacancy.maxSalary) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {vacancy.minSalary && vacancy.maxSalary 
                          ? `${vacancy.currency} ${vacancy.minSalary.toLocaleString()} - ${vacancy.maxSalary.toLocaleString()}`
                          : vacancy.minSalary 
                            ? `From ${vacancy.currency} ${vacancy.minSalary.toLocaleString()}`
                            : `Up to ${vacancy.currency} ${vacancy.maxSalary?.toLocaleString()}`
                        }
                      </div>
                    )}
                    {vacancy.openings > 1 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {vacancy.openings} positions
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {!isAuthenticated ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/login")}
                      data-testid={`button-login-to-apply-${vacancy.id}`}
                    >
                      Login to Apply
                    </Button>
                  ) : hasApplied(vacancy.id) ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Already Applied
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedVacancy(vacancy)}
                      data-testid={`button-apply-${vacancy.id}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredVacancies.length} of {vacancies.filter(v => v.status === "open").length} open positions
        </div>
      </main>

      <Footer />
    </div>
  );
}
