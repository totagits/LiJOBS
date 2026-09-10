import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, MapPin, Calendar, Search, Filter, Download, TrendingUp } from "lucide-react";
import { useState } from "react";

const SECTORS = [
  { id: "all", label: "All Sectors", color: "bg-gray-500" },
  { id: "private", label: "Private", color: "bg-blue-500" },
  { id: "public", label: "Public", color: "bg-green-500" },
  { id: "ngo", label: "NGO/Projects", color: "bg-purple-500" },
  { id: "informal", label: "Informal", color: "bg-orange-500" },
  { id: "seasonal", label: "Seasonal", color: "bg-yellow-500" },
];

const COUNTIES = [
  "All Counties", "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa",
  "Margibi", "Grand Cape Mount", "Maryland", "Grand Gedeh", "Sinoe",
  "Rivercess", "Grand Kru", "Gbarpolu", "River Gee", "Bomi"
];

const CONTRACT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "permanent", label: "Permanent" },
  { value: "temporary", label: "Temporary" },
  { value: "contract", label: "Contract" },
  { value: "apprentice", label: "Apprentice" },
  { value: "intern", label: "Intern" },
  { value: "gig", label: "Gig/Freelance" },
];

interface Vacancy {
  id: string;
  title: string;
  employerName: string;
  sector: string;
  county: string;
  contractType: string;
  openings: number;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string;
  status: string;
  createdAt: string;
}

export default function DataPortalPostings() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedContract, setSelectedContract] = useState("all");

  const { data: postings, isLoading } = useQuery<Vacancy[]>({
    queryKey: ["/api/data/postings", activeTab, selectedCounty, selectedContract],
  });

  const { data: stats } = useQuery<{ total: number; bySector: Record<string, number>; byCounty: Record<string, number> }>({
    queryKey: ["/api/data/postings/stats"],
  });

  const postingsList = Array.isArray(postings) ? postings : [];
  const filteredPostings = postingsList.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = activeTab === "all" || p.sector === activeTab;
    const matchesCounty = selectedCounty === "All Counties" || p.county === selectedCounty;
    const matchesContract = selectedContract === "all" || p.contractType === selectedContract;
    return matchesSearch && matchesSector && matchesCounty && matchesContract;
  });

  const getSectorColor = (sector: string) => {
    const s = SECTORS.find(s => s.id === sector);
    return s?.color || "bg-gray-500";
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Job Postings</h1>
            </div>
            <p className="text-muted-foreground">
              Browse all job vacancies posted across Liberia's employment sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Postings</p>
                    <p className="text-2xl font-bold" data-testid="text-total-postings">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <Briefcase className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Private Sector</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.bySector?.private || 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Public Sector</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.bySector?.public || 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">NGO/Projects</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.bySector?.ngo || 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search job titles, employers..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-county">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedContract} onValueChange={setSelectedContract}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-contract">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" data-testid="button-export">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 h-auto p-1">
              {SECTORS.map(sector => (
                <TabsTrigger
                  key={sector.id}
                  value={sector.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-${sector.id}`}
                >
                  {sector.label}
                  {stats?.bySector && sector.id !== "all" && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.bySector[sector.id] || 0}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPostings.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No job postings found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCounty !== "All Counties" || selectedContract !== "all"
                        ? "Try adjusting your filters to see more results"
                        : "No job postings have been added yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredPostings.map(posting => (
                    <Card key={posting.id} className="hover-elevate" data-testid={`card-posting-${posting.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{posting.title}</h3>
                              <Badge className={getSectorColor(posting.sector)}>
                                {posting.sector}
                              </Badge>
                              <Badge variant="outline">{posting.contractType}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {posting.employerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {posting.county || "Liberia"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(posting.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Openings</p>
                              <p className="text-xl font-bold">{posting.openings}</p>
                            </div>
                            {posting.minSalary && (
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Salary</p>
                                <p className="font-medium">
                                  {posting.currency} {posting.minSalary.toLocaleString()}
                                  {posting.maxSalary && ` - ${posting.maxSalary.toLocaleString()}`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Postings by County
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {COUNTIES.slice(1).map(county => (
                  <div key={county} className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats?.byCounty?.[county] || 0}</p>
                    <p className="text-sm text-muted-foreground">{county}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
