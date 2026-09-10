import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { PageLoadingSpinner, SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Users, 
  Edit, 
  Eye,
  Building2,
  Search,
  DollarSign,
  Clock
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Vacancy {
  id: number;
  title: string;
  description: string;
  county: string;
  district: string | null;
  employmentType: string;
  sector: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  positionsAvailable: number;
  applicationDeadline: string | null;
  status: string;
  iscoCode: string | null;
  isicCode: string | null;
  createdAt: string;
  employerId: number;
}

interface Employer {
  id: number;
  name: string;
  sector: string;
  county: string;
  userId: number;
}

export default function EmployerVacancies() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employer } = useQuery<Employer>({
    queryKey: ["/api/employers/me"],
    enabled: !!user && user.role === "employer",
  });

  const { data: vacancies = [], isLoading } = useQuery<Vacancy[]>({
    queryKey: ["/api/vacancies", { employerId: employer?.id }],
    enabled: !!employer?.id,
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!isAuthenticated || user?.role !== "employer") {
    setLocation("/login");
    return null;
  }

  const myVacancies = vacancies.filter(v => v.employerId === employer?.id);
  const filteredVacancies = myVacancies.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = myVacancies.filter(v => v.status === "open").length;
  const closedCount = myVacancies.filter(v => v.status === "closed").length;
  const totalPositions = myVacancies.reduce((sum, v) => sum + v.positionsAvailable, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-emerald-500">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "filled":
        return <Badge className="bg-blue-500">Filled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return "Negotiable";
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max?.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen" data-testid="employer-vacancies-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-page-title">My Job Postings</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your vacancies and job listings
                </p>
              </div>
              <Link href="/employer/vacancies/new">
                <Button className="gap-2" data-testid="button-post-vacancy">
                  <Plus className="w-4 h-4" />
                  Post New Vacancy
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeCount}</p>
                    <p className="text-sm text-muted-foreground">Active Vacancies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalPositions}</p>
                    <p className="text-sm text-muted-foreground">Total Positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{closedCount}</p>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vacancies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-vacancies"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <SectionLoadingSpinner />
          ) : filteredVacancies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No vacancies yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by posting your first job vacancy to attract candidates
                </p>
                <Link href="/employer/vacancies/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your First Vacancy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVacancies.map((vacancy, index) => (
                <motion.div
                  key={vacancy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover-elevate" data-testid={`vacancy-card-${vacancy.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{vacancy.title}</h3>
                            {getStatusBadge(vacancy.status)}
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {vacancy.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {vacancy.county}{vacancy.district ? `, ${vacancy.district}` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {vacancy.positionsAvailable} position{vacancy.positionsAvailable !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.salaryCurrency)}
                            </span>
                            {vacancy.applicationDeadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Deadline: {new Date(vacancy.applicationDeadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/employer/applications?vacancyId=${vacancy.id}`}>
                            <Button variant="outline" size="sm" className="gap-2" data-testid={`button-view-applications-${vacancy.id}`}>
                              <Eye className="w-4 h-4" />
                              Applications
                            </Button>
                          </Link>
                          <Link href={`/employer/vacancies/${vacancy.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2" data-testid={`button-edit-${vacancy.id}`}>
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
