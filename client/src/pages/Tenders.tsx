import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  Gavel,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Filter,
  FileText,
  Building2,
  Eye,
  Clock,
} from "lucide-react";
import type { Tender, Employer } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

export default function Tenders() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tenders = [], isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: employers = [] } = useQuery<Employer[]>({
    queryKey: ["/api/employers"],
  });

  const getEmployerName = (employerId: string) => {
    const employer = employers.find((e) => e.id === employerId);
    return employer?.legalName || "Unknown Organization";
  };

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCounty = countyFilter === "all" || (t.county && t.county.includes(countyFilter));
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesType && matchesCounty && matchesStatus;
  });

  const openTenders = tenders.filter((t) => t.status === "open");
  const procurementCount = openTenders.filter((t) => t.type === "procurement").length;
  const serviceCount = openTenders.filter((t) => t.type === "service").length;

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
    <div className="min-h-screen flex flex-col" data-testid="tenders-page">
      <Header />

      <div className="bg-blue-600 text-white pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-page-title">
              Bids & Tenders
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl" data-testid="text-page-description">
              Browse open tenders and submit your bids. Find procurement and service opportunities across Liberia.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 rounded-md p-4">
              <p className="text-3xl font-bold" data-testid="text-stat-open">{openTenders.length}</p>
              <p className="text-blue-100 text-sm">Total Open Tenders</p>
            </div>
            <div className="bg-white/10 rounded-md p-4">
              <p className="text-3xl font-bold" data-testid="text-stat-procurement">{procurementCount}</p>
              <p className="text-blue-100 text-sm">Procurement</p>
            </div>
            <div className="bg-white/10 rounded-md p-4">
              <p className="text-3xl font-bold" data-testid="text-stat-service">{serviceCount}</p>
              <p className="text-blue-100 text-sm">Service</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-tenders"
              placeholder="Search tenders by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              data-testid="button-type-all"
            >
              All
            </Button>
            <Button
              variant={typeFilter === "procurement" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("procurement")}
              data-testid="button-type-procurement"
            >
              Procurement
            </Button>
            <Button
              variant={typeFilter === "service" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("service")}
              data-testid="button-type-service"
            >
              Service
            </Button>
          </div>
          <Select value={countyFilter} onValueChange={setCountyFilter}>
            <SelectTrigger className="w-full md:w-[200px]" data-testid="select-county-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {LIBERIA_COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tendersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : filteredTenders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-tenders">No Tenders Found</h3>
              <p className="text-muted-foreground">
                {tenders.length === 0
                  ? "No tenders have been posted yet. Check back soon!"
                  : "No tenders match your search criteria. Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTenders.map((tender) => (
              <motion.div
                key={tender.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="flex flex-col h-full" data-testid={`card-tender-${tender.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg" data-testid={`text-tender-title-${tender.id}`}>
                          {tender.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {getEmployerName(tender.employerId)}
                        </p>
                      </div>
                      {getStatusBadge(tender.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getTypeBadge(tender.type)}
                      <Badge variant="outline">{tender.category}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {tender.county && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {tender.county}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {formatBudget(tender.budgetMin, tender.budgetMax, tender.currency)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Deadline: {new Date(tender.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/tenders/${tender.id}`} className="w-full">
                      <Button variant="outline" className="w-full gap-2" data-testid={`button-view-details-${tender.id}`}>
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground" data-testid="text-showing-count">
          Showing {filteredTenders.length} of {tenders.length} tenders
        </div>
      </main>

      <Footer />
    </div>
  );
}
