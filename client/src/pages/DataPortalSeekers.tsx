import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPin, GraduationCap, Search, Filter, Download, TrendingUp, Briefcase, CheckCircle } from "lucide-react";
import { useState } from "react";

const EDUCATION_LEVELS = [
  { value: "all", label: "All Education" },
  { value: "none", label: "No Formal Education" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "vocational", label: "Vocational/Technical" },
  { value: "tertiary", label: "Tertiary/University" },
  { value: "postgraduate", label: "Postgraduate" },
];

const SECTORS = [
  { id: "all", label: "All Preferences", color: "bg-gray-500" },
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

interface JobSeeker {
  id: string;
  personUid: string;
  county: string;
  sex: string;
  isYouth: boolean;
  headline: string;
  highestEducation: string;
  yearsExperience: string;
  isOpenToWork: boolean;
  preferredSectors: string[];
  preferredCounties: string[];
  willingToRelocate: boolean;
  skillCount: number;
}

export default function DataPortalSeekers() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedEducation, setSelectedEducation] = useState("all");

  const { data: seekers, isLoading } = useQuery<JobSeeker[]>({
    queryKey: ["/api/data/seekers", activeTab, selectedCounty, selectedEducation],
  });

  const { data: stats } = useQuery<{ 
    total: number; 
    openToWork: number;
    bySector: Record<string, number>; 
    byCounty: Record<string, number>;
    byEducation: Record<string, number>;
  }>({
    queryKey: ["/api/data/seekers/stats"],
  });

  const filteredSeekers = seekers?.filter(s => {
    const matchesSearch = !searchQuery || 
      s.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.personUid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = activeTab === "all" || s.preferredSectors?.includes(activeTab);
    const matchesCounty = selectedCounty === "All Counties" || s.county === selectedCounty;
    const matchesEducation = selectedEducation === "all" || s.highestEducation === selectedEducation;
    return matchesSearch && matchesSector && matchesCounty && matchesEducation;
  }) || [];

  const getEducationLabel = (level: string) => {
    const edu = EDUCATION_LEVELS.find(e => e.value === level);
    return edu?.label || level || "Not specified";
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
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Job Seekers</h1>
            </div>
            <p className="text-muted-foreground">
              Browse registered job seekers across Liberia looking for employment opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registered</p>
                    <p className="text-2xl font-bold" data-testid="text-total-seekers">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open to Work</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.openToWork || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tertiary Education</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.byEducation?.tertiary || 0}
                    </p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Youth (15-35)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {seekers?.filter(s => s.isYouth).length || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
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
                    placeholder="Search by headline, ID..."
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
                <Select value={selectedEducation} onValueChange={setSelectedEducation}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-education">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map(edu => (
                      <SelectItem key={edu.value} value={edu.value}>{edu.label}</SelectItem>
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
              ) : filteredSeekers.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No job seekers found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCounty !== "All Counties" || selectedEducation !== "all"
                        ? "Try adjusting your filters to see more results"
                        : "No job seekers have registered yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredSeekers.map(seeker => (
                    <Card key={seeker.id} className="hover-elevate" data-testid={`card-seeker-${seeker.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                {seeker.headline || "Job Seeker"}
                              </h3>
                              {seeker.isOpenToWork && (
                                <Badge className="bg-green-500">Open to Work</Badge>
                              )}
                              {seeker.isYouth && (
                                <Badge variant="outline">Youth</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {seeker.county || "Liberia"}
                              </span>
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                {getEducationLabel(seeker.highestEducation)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {seeker.yearsExperience || "0"} years exp.
                              </span>
                            </div>
                            {seeker.preferredSectors && seeker.preferredSectors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {seeker.preferredSectors.map(sector => (
                                  <Badge key={sector} variant="secondary" className="text-xs">
                                    {sector}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Skills</p>
                              <p className="text-xl font-bold">{seeker.skillCount || 0}</p>
                            </div>
                            {seeker.willingToRelocate && (
                              <Badge variant="outline" className="whitespace-nowrap">
                                Will Relocate
                              </Badge>
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
                Job Seekers by County
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
