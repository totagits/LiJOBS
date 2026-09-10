import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileText, 
  Users,
  Building2,
  Briefcase,
  Database,
  Loader2,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  MapPin,
  ShieldCheck,
  UserCheck,
  DollarSign,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface NationalStatsData {
  keyIndicators: { label: string; value: string; description: string }[];
  sectorBreakdown: { sector: string; count: number; color: string }[];
  countyBreakdown: { county: string; count: number }[];
  contractTypes: { type: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  verificationBreakdown: { status: string; count: number }[];
  formalityBreakdown: { type: string; count: number }[];
}

interface DrilldownData {
  totalRecords: number;
  activeRecords: number;
  averageWage: number;
  contractTypes: { type: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  verificationBreakdown: { status: string; count: number }[];
  sectorBreakdown: { sector: string; count: number }[];
  countyBreakdown: { county: string; count: number }[];
  filterApplied: { sector: string | null; county: string | null };
}

const dataExports = [
  {
    id: "employment",
    title: "Employment Spells Data",
    description: "Export all employment records with verification status, trust scores, and contract details",
    icon: Briefcase,
    endpoint: "/api/export/employment",
    color: "text-blue-500"
  },
  {
    id: "vacancies",
    title: "Job Vacancies Data",
    description: "Export all job postings with employer details, requirements, and status",
    icon: FileText,
    endpoint: "/api/export/vacancies",
    color: "text-green-500"
  },
  {
    id: "job-seekers",
    title: "Job Seekers Data",
    description: "Export registered job seekers with skills, education, and preferences",
    icon: Users,
    endpoint: "/api/export/job-seekers",
    color: "text-purple-500"
  },
  {
    id: "employers",
    title: "Employers Registry",
    description: "Export all registered employers with sector, verification, and trust scores",
    icon: Building2,
    endpoint: "/api/export/employers",
    color: "text-orange-500"
  }
];

const SECTOR_COLORS: Record<string, string> = {
  "Private": "#3b82f6",
  "Public": "#8b5cf6",
  "NGO/Projects": "#06b6d4",
  "Informal": "#f59e0b",
  "Seasonal": "#22c55e",
  "private": "#3b82f6",
  "public": "#8b5cf6",
  "ngo": "#06b6d4",
  "informal": "#f59e0b",
  "seasonal": "#22c55e",
};

const VERIFICATION_LABELS: Record<string, string> = {
  self_reported: "Self-Reported",
  employer_verified: "Employer Verified",
  enumerator_verified: "Enumerator Verified",
  triple_verified: "Triple Verified",
  pending: "Pending",
  flagged: "Flagged",
  rejected: "Rejected"
};

const CONTRACT_LABELS: Record<string, string> = {
  permanent: "Permanent",
  fixed_term: "Fixed-Term",
  casual: "Casual/Daily",
  seasonal: "Seasonal",
  contract: "Contract",
  internship: "Internship",
  unknown: "Not Specified"
};

function DrilldownView({ filterType, filterValue, onBack }: { filterType: "sector" | "county"; filterValue: string; onBack: () => void }) {
  const queryParam = filterType === "sector" ? `sector=${encodeURIComponent(filterValue)}` : `county=${encodeURIComponent(filterValue)}`;
  
  const { data: drilldown, isLoading } = useQuery<DrilldownData>({
    queryKey: [`/api/reports/drilldown?${queryParam}`],
  });

  if (isLoading) {
    return <SectionLoadingSpinner />;
  }

  if (!drilldown) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
          <p>No data available for this filter.</p>
        </CardContent>
      </Card>
    );
  }

  const totalGender = drilldown.genderDistribution.reduce((s, g) => s + g.count, 0);
  const totalVerification = drilldown.verificationBreakdown.reduce((s, v) => s + v.count, 0);

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={onBack} data-testid="button-drilldown-back">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Data Overview
      </Button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {filterType === "sector" ? <Briefcase className="w-6 h-6 text-primary" /> : <MapPin className="w-6 h-6 text-primary" />}
          {filterType === "sector" ? `${filterValue} Sector` : `${filterValue} County`} - Employment Data
        </h2>
        <p className="text-muted-foreground mt-1">Detailed breakdown of employment records</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{drilldown.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{drilldown.activeRecords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Employment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{drilldown.averageWage > 0 ? `LRD ${drilldown.averageWage.toLocaleString()}` : "N/A"}</p>
                <p className="text-sm text-muted-foreground">Average Wage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {totalVerification > 0 
                    ? `${Math.round((drilldown.verificationBreakdown.filter(v => v.status !== "self_reported" && v.status !== "pending").reduce((s, v) => s + v.count, 0) / totalVerification) * 100)}%`
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Verified Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Contract Type</CardTitle>
          </CardHeader>
          <CardContent>
            {drilldown.contractTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {drilldown.contractTypes.map((ct) => {
                  const pct = drilldown.totalRecords > 0 ? Math.round((ct.count / drilldown.totalRecords) * 100) : 0;
                  return (
                    <div key={ct.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{CONTRACT_LABELS[ct.type] || ct.type}</span>
                        <span className="font-medium">{ct.count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Gender</CardTitle>
          </CardHeader>
          <CardContent>
            {drilldown.genderDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {drilldown.genderDistribution.map((g) => {
                  const pct = totalGender > 0 ? Math.round((g.count / totalGender) * 100) : 0;
                  const gLower = g.gender.toLowerCase();
                  const label = gLower === "male" || gLower === "m" ? "Male" : gLower === "female" || gLower === "f" ? "Female" : gLower === "other" ? "Other" : gLower === "unknown" ? "Not Specified" : g.gender;
                  const isMale = gLower === "male" || gLower === "m";
                  const isFemale = gLower === "female" || gLower === "f";
                  return (
                    <div key={g.gender}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{label}</span>
                        <span className="font-medium">{g.count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`rounded-full h-2 transition-all ${isMale ? "bg-blue-500" : isFemale ? "bg-pink-500" : "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            {drilldown.verificationBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {drilldown.verificationBreakdown.map((v) => {
                  const pct = totalVerification > 0 ? Math.round((v.count / totalVerification) * 100) : 0;
                  return (
                    <div key={v.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-4 h-4 ${v.status.includes("verified") ? "text-green-600" : v.status === "flagged" || v.status === "rejected" ? "text-red-500" : "text-yellow-500"}`} />
                        <span className="text-sm">{VERIFICATION_LABELS[v.status] || v.status}</span>
                      </div>
                      <span className="font-medium">{v.count.toLocaleString()} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {filterType === "sector" && drilldown.countyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By County</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drilldown.countyBreakdown.map((c) => (
                  <div key={c.county} className="flex items-center justify-between">
                    <span className="text-sm">{c.county}</span>
                    <span className="font-medium">{c.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filterType === "county" && drilldown.sectorBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drilldown.sectorBreakdown.map((s) => (
                  <div key={s.sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] || "#94a3b8" }} />
                      <span className="text-sm capitalize">{s.sector}</span>
                    </div>
                    <span className="font-medium">{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<{ type: "sector" | "county"; value: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: statsData, isLoading } = useQuery<NationalStatsData>({
    queryKey: ["/api/national-statistics"],
  });

  const hasData = statsData && statsData.keyIndicators.some(i => i.value !== "0");

  const handleExportData = async (exportItem: typeof dataExports[0]) => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to export data.",
        variant: "destructive"
      });
      return;
    }
    
    setExporting(exportItem.id);
    try {
      const response = await fetch(exportItem.endpoint, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportItem.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `${exportItem.title} has been downloaded.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen" data-testid="reports-page">
      <Header />
      <main className="pt-24">
        <section className="relative py-16 bg-primary text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <BackButton />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4">Reports & Data Exports</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-reports-title">
                Reports & Data Exports
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Export real employment data from the LiJOBS system. All exports contain 
                actual records entered and verified through the platform.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <SectionLoadingSpinner />
            ) : drilldown ? (
              <DrilldownView 
                filterType={drilldown.type} 
                filterValue={drilldown.value} 
                onBack={() => setDrilldown(null)} 
              />
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2">System Data Summary</h2>
                  <p className="text-muted-foreground mb-6">Current data available for export from the system</p>
                  
                  {hasData ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {statsData!.keyIndicators.slice(0, 4).map((indicator, index) => (
                        <Card key={index}>
                          <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground mb-1">{indicator.label}</p>
                            <p className="text-2xl font-bold">{indicator.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{indicator.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Database className="w-12 h-12 mb-3 opacity-30" />
                          <p className="font-medium">No data yet</p>
                          <p className="text-sm mt-1 text-center max-w-md">
                            No employment data has been entered into the system. 
                            Reports will be available once data is recorded through LiJOBS.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">Data Exports</h2>
                  <p className="text-muted-foreground mb-6">
                    Download system data as Excel files. {!user && "Sign in to access exports."}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {dataExports.map((exportItem, index) => (
                      <motion.div
                        key={exportItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card 
                          data-testid={`export-card-${exportItem.id}`}
                          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
                          onClick={() => {
                            if (!user) {
                              navigate("/login");
                            } else {
                              handleExportData(exportItem);
                            }
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg bg-muted ${exportItem.color}`}>
                                <exportItem.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg">{exportItem.title}</CardTitle>
                                <CardDescription className="mt-1">{exportItem.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground border rounded-md py-2">
                              {exporting === exportItem.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Downloading...</span>
                                </>
                              ) : user ? (
                                <>
                                  <Download className="w-4 h-4" />
                                  <span>Click to Download Excel</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  <span>Sign in to Export</span>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {hasData && (
                  <div className="mt-10">
                    <h2 className="text-2xl font-bold mb-2">Data Breakdown</h2>
                    <p className="text-muted-foreground mb-6">Click any sector or county to see detailed employment data breakdown</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {statsData!.sectorBreakdown.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Sector</CardTitle>
                            <CardDescription>Click a sector to view detailed breakdown</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {statsData!.sectorBreakdown.map((sector) => (
                                <div 
                                  key={sector.sector} 
                                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                                  onClick={() => setDrilldown({ type: "sector", value: sector.sector })}
                                  data-testid={`drilldown-sector-${sector.sector}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                                    <span className="text-sm">{sector.sector}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{sector.count.toLocaleString()}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statsData!.countyBreakdown.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By County (Top 10)</CardTitle>
                            <CardDescription>Click a county to view detailed breakdown</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {statsData!.countyBreakdown.slice(0, 10).map((county) => (
                                <div 
                                  key={county.county} 
                                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                                  onClick={() => setDrilldown({ type: "county", value: county.county })}
                                  data-testid={`drilldown-county-${county.county}`}
                                >
                                  <span className="text-sm">{county.county}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{county.count.toLocaleString()}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statsData!.contractTypes && statsData!.contractTypes.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Contract Type</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {statsData!.contractTypes.map((ct) => (
                                <div key={ct.type} className="flex items-center justify-between">
                                  <span className="text-sm">{CONTRACT_LABELS[ct.type] || ct.type}</span>
                                  <span className="font-medium">{ct.count.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statsData!.verificationBreakdown && statsData!.verificationBreakdown.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Verification Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {statsData!.verificationBreakdown.map((v) => (
                                <div key={v.status} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className={`w-4 h-4 ${v.status.includes("verified") ? "text-green-600" : v.status === "flagged" || v.status === "rejected" ? "text-red-500" : "text-yellow-500"}`} />
                                    <span className="text-sm">{VERIFICATION_LABELS[v.status] || v.status}</span>
                                  </div>
                                  <span className="font-medium">{v.count.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statsData!.genderDistribution && statsData!.genderDistribution.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Gender</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {statsData!.genderDistribution.map((g) => {
                                const label = g.gender === "M" ? "Male" : g.gender === "F" ? "Female" : g.gender;
                                return (
                                  <div key={g.gender} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className={`w-4 h-4 ${g.gender === "M" ? "text-blue-500" : "text-pink-500"}`} />
                                      <span className="text-sm">{label}</span>
                                    </div>
                                    <span className="font-medium">{g.count.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statsData!.formalityBreakdown && statsData!.formalityBreakdown.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">By Formality</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {statsData!.formalityBreakdown.map((f) => (
                                <div key={f.type} className="flex items-center justify-between">
                                  <span className="text-sm capitalize">{f.type}</span>
                                  <span className="font-medium">{f.count.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
