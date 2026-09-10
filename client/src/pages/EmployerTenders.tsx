import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { PageLoadingSpinner, SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Gavel,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Search,
  DollarSign,
  FileText,
  Award,
  Clock,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Tender } from "@shared/schema";

interface Employer {
  id: string;
  legalName: string;
  sector: string;
  county: string;
  userId: string;
}

export default function EmployerTenders() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: employer } = useQuery<Employer>({
    queryKey: ["/api/employers/me"],
    enabled: !!user && user.role === "employer",
  });

  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: [`/api/tenders?employerId=${employer?.id}`],
    enabled: !!employer?.id,
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!isAuthenticated || user?.role !== "employer") {
    setLocation("/login");
    return null;
  }

  const myTenders = tenders.filter((t) => t.employerId === employer?.id);
  const filteredTenders = myTenders.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.county && t.county.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCount = myTenders.length;
  const openCount = myTenders.filter((t) => t.status === "open").length;
  const awardedCount = myTenders.filter((t) => t.status === "awarded").length;
  const totalSubmissions = 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-emerald-500">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "awarded":
        return <Badge className="bg-blue-500">Awarded</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "procurement":
        return <Badge className="bg-blue-500">Procurement</Badge>;
      case "service":
        return <Badge className="bg-violet-500">Service</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatBudget = (min: number | null, max: number | null, currency: string | null) => {
    const curr = currency || "LRD";
    if (!min && !max) return "Negotiable";
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${curr} ${min.toLocaleString()}+`;
    return `Up to ${curr} ${max?.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen" data-testid="employer-tenders-page">
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
                <h1 className="text-3xl font-bold" data-testid="text-page-title">
                  My Tenders
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your bids and tender listings
                </p>
              </div>
              <Link href="/employer/tenders/new">
                <Button className="gap-2" data-testid="button-post-tender">
                  <Plus className="w-4 h-4" />
                  Post New Tender
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-total-tenders">{totalCount}</p>
                    <p className="text-sm text-muted-foreground">Total Tenders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-open-tenders">{openCount}</p>
                    <p className="text-sm text-muted-foreground">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-awarded-tenders">{awardedCount}</p>
                    <p className="text-sm text-muted-foreground">Awarded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-total-submissions">{totalSubmissions}</p>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenders by title or county..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tenders"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={typeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter("all")}
                    data-testid="button-filter-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={typeFilter === "procurement" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter("procurement")}
                    data-testid="button-filter-procurement"
                  >
                    Procurement
                  </Button>
                  <Button
                    variant={typeFilter === "service" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter("service")}
                    data-testid="button-filter-service"
                  >
                    Service
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <SectionLoadingSpinner />
          ) : filteredTenders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tenders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by posting your first tender to receive bids
                </p>
                <Link href="/employer/tenders/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your First Tender
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTenders.map((tender, index) => (
                <motion.div
                  key={tender.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover-elevate" data-testid={`tender-card-${tender.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold" data-testid={`text-tender-title-${tender.id}`}>
                              {tender.title}
                            </h3>
                            {getTypeBadge(tender.type)}
                            {getStatusBadge(tender.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {tender.category}
                            </span>
                            {tender.county && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {tender.county}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {formatBudget(tender.budgetMin, tender.budgetMax, tender.currency)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Deadline: {new Date(tender.deadline).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Posted: {new Date(tender.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/tenders/${tender.id}`}>
                            <Button variant="outline" size="sm" className="gap-2" data-testid={`button-view-tender-${tender.id}`}>
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/employer/tenders/${tender.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2" data-testid={`button-edit-tender-${tender.id}`}>
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
