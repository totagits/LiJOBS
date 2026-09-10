import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Users,
  Filter,
  Mail,
  Phone,
  Award
} from "lucide-react";

interface JobSeekerProfile {
  id: number;
  personId: number;
  currentStatus: string;
  availableFrom: string | null;
  preferredEmploymentType: string | null;
  preferredCounties: string[] | null;
  expectedSalaryMin: number | null;
  expectedSalaryCurrency: string;
  yearsOfExperience: number | null;
  highestEducation: string | null;
  summary: string | null;
  isActive: boolean;
  createdAt: string;
  person?: {
    id: number;
    firstName: string;
    lastName: string;
    gender: string;
    county: string;
    email: string;
  };
  skills?: {
    id: number;
    name: string;
    category: string;
  }[];
}

const LIBERIA_COUNTIES = [
  "All Counties",
  "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa", "Margibi",
  "Grand Cape Mount", "Bomi", "Grand Gedeh", "Sinoe", "River Cess",
  "Gbarpolu", "Maryland", "Grand Kru", "River Gee"
];

const EDUCATION_LEVELS = [
  { value: "all", label: "All Education Levels" },
  { value: "primary", label: "Primary School" },
  { value: "secondary", label: "Secondary School" },
  { value: "vocational", label: "Vocational/Technical" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
];

export default function JobSeekers() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedEducation, setSelectedEducation] = useState("all");

  const { data: profiles = [], isLoading } = useQuery<JobSeekerProfile[]>({
    queryKey: ["/api/job-seekers"],
    enabled: !!user && ["admin", "ministry", "employer"].includes(user.role),
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!isAuthenticated || !["admin", "ministry", "employer"].includes(user?.role || "")) {
    setLocation("/login");
    return null;
  }

  const activeProfiles = profiles.filter(p => p.isActive);
  
  const filteredProfiles = activeProfiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      (profile.person?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.person?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (profile.summary?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCounty = selectedCounty === "All Counties" || 
      profile.person?.county === selectedCounty ||
      profile.preferredCounties?.includes(selectedCounty);
    
    const matchesEducation = selectedEducation === "all" || 
      profile.highestEducation === selectedEducation;
    
    return matchesSearch && matchesCounty && matchesEducation;
  });

  const getEducationLabel = (education: string | null) => {
    if (!education) return "Not specified";
    const level = EDUCATION_LEVELS.find(e => e.value === education);
    return level?.label || education;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "actively_seeking":
        return <Badge className="bg-emerald-500">Actively Seeking</Badge>;
      case "open_to_offers":
        return <Badge className="bg-blue-500">Open to Offers</Badge>;
      case "employed":
        return <Badge variant="secondary">Employed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen" data-testid="job-seekers-page">
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
                <h1 className="text-3xl font-bold" data-testid="text-page-title">Browse Job Seekers</h1>
                <p className="text-muted-foreground mt-1">
                  Find qualified candidates for your vacancies
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {activeProfiles.length} Active Candidates
              </Badge>
            </div>
          </motion.div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, skills, or summary..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-county">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIBERIA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedEducation} onValueChange={setSelectedEducation}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-education">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <SectionLoadingSpinner />
          ) : filteredProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No job seekers found</h3>
                <p className="text-muted-foreground">
                  {activeProfiles.length === 0 
                    ? "No job seekers have registered yet"
                    : "Try adjusting your search filters"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover-elevate h-full" data-testid={`profile-card-${profile.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(profile.person?.firstName || "", profile.person?.lastName || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {profile.person?.firstName} {profile.person?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {profile.person?.county || "Location not specified"}
                          </p>
                          {getStatusBadge(profile.currentStatus)}
                        </div>
                      </div>

                      {profile.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {profile.summary}
                        </p>
                      )}

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          <span>{getEducationLabel(profile.highestEducation)}</span>
                        </div>
                        {profile.yearsOfExperience && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="w-4 h-4" />
                            <span>{profile.yearsOfExperience} years experience</span>
                          </div>
                        )}
                      </div>

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {profile.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill.id} variant="secondary" className="text-xs">
                                {skill.name}
                              </Badge>
                            ))}
                            {profile.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {profile.person?.email && (
                          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                            <a href={`mailto:${profile.person.email}`}>
                              <Mail className="w-4 h-4" />
                              Contact
                            </a>
                          </Button>
                        )}
                        <Button variant="default" size="sm" className="flex-1 gap-2" data-testid={`button-view-profile-${profile.id}`}>
                          <Award className="w-4 h-4" />
                          View Profile
                        </Button>
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
