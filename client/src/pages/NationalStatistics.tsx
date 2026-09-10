import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  Users, 
  Briefcase, 
  Building2, 
  MapPin,
  Download,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Database,
  ShieldCheck,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface NationalStatsData {
  keyIndicators: { label: string; value: string; description: string }[];
  sectorBreakdown: { sector: string; count: number; color: string }[];
  countyBreakdown: { county: string; count: number }[];
  contractTypes: { type: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  verificationBreakdown: { status: string; count: number }[];
  formalityBreakdown: { type: string; count: number }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#14b8a6"];
const genderColors: Record<string, string> = { male: "#3b82f6", female: "#ec4899", other: "#8b5cf6" };
const verificationColors: Record<string, string> = { self_reported: "#f59e0b", partial: "#3b82f6", verified: "#22c55e" };

function NoDataMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground" data-testid="no-data-message">
      <Database className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">No data yet</p>
      <p className="text-sm mt-1 text-center max-w-xs">{message}</p>
    </div>
  );
}

export default function NationalStatistics() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<NationalStatsData>({
    queryKey: ["/api/national-statistics"],
  });

  const hasData = data && data.keyIndicators.some(i => i.value !== "0");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/national-statistics"] });
    toast({
      title: "Data Refreshed",
      description: "Statistics updated with latest data from the system.",
    });
  };

  const handleDownload = () => {
    if (!data) return;
    const csvRows = [
      ["LiJOBS National Statistics Report"],
      ["Generated: " + new Date().toLocaleDateString()],
      ["Source: Real system data"],
      [""],
      ["KEY EMPLOYMENT INDICATORS"],
      ["Indicator", "Value", "Description"],
      ...data.keyIndicators.map(i => [i.label, i.value, i.description]),
      [""],
      ["SECTOR BREAKDOWN"],
      ["Sector", "Count"],
      ...data.sectorBreakdown.map(s => [s.sector, s.count.toString()]),
      [""],
      ["COUNTY BREAKDOWN"],
      ["County", "Count"],
      ...data.countyBreakdown.map(c => [c.county, c.count.toString()]),
      [""],
      ["CONTRACT TYPES"],
      ["Type", "Count"],
      ...data.contractTypes.map(c => [c.type, c.count.toString()]),
      [""],
      ["GENDER DISTRIBUTION"],
      ["Gender", "Count"],
      ...data.genderDistribution.map(g => [g.gender, g.count.toString()]),
      [""],
      ["VERIFICATION STATUS"],
      ["Status", "Count"],
      ...data.verificationBreakdown.map(v => [v.status, v.count.toString()]),
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LiJOBS_National_Statistics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Download Complete", description: "Statistics exported as CSV." });
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text("LiJOBS National Statistics Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Source: Real system data`, pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Key Employment Indicators", 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [["Indicator", "Value", "Description"]],
      body: data.keyIndicators.map(i => [i.label, i.value, i.description]),
      theme: "striped",
      headStyles: { fillColor: [0, 51, 102] },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    if (data.sectorBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.text("Employment by Sector", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Sector", "Employment Count"]],
        body: data.sectorBreakdown.map(s => [s.sector, s.count.toLocaleString()]),
        theme: "striped",
        headStyles: { fillColor: [0, 51, 102] },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.countyBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.text("Employment by County", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [["County", "Employment Count"]],
        body: data.countyBreakdown.map(c => [c.county, c.count.toLocaleString()]),
        theme: "striped",
        headStyles: { fillColor: [0, 51, 102] },
      });
    }
    
    doc.save(`LiJOBS_National_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Download Complete", description: "Statistics exported as PDF." });
  };

  return (
    <div className="min-h-screen" data-testid="national-statistics-page">
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
              <Badge variant="secondary" className="mb-4">Data Portal</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-national-stats-title">
                National Statistics
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Employment data calculated from real records entered into LiJOBS. 
                All statistics are derived from verified system data across all 15 counties.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Key Employment Indicators</h2>
                <p className="text-muted-foreground">Calculated from system records</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} data-testid="button-refresh-stats">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {hasData && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" data-testid="button-download-stats">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDownload} data-testid="button-download-csv">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Download as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadPDF} data-testid="button-download-pdf">
                        <FileText className="w-4 h-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 w-24 bg-muted rounded mb-4" />
                      <div className="h-8 w-16 bg-muted rounded mb-2" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !hasData ? (
              <Card className="mb-12">
                <CardContent className="py-16">
                  <NoDataMessage message="No employment data has been entered into the system yet. Data will appear here once employment spells, employers, or job postings are recorded." />
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {data!.keyIndicators.map((indicator, index) => {
                  const icons = [Briefcase, Activity, ShieldCheck, Building2, Building2, FileText, Users, Users];
                  const Icon = icons[index] || Briefcase;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card data-testid={`indicator-${index}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-muted-foreground">{indicator.label}</p>
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-3xl font-bold mb-1">{indicator.value}</p>
                          <p className="text-xs text-muted-foreground">{indicator.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {hasData && (
              <Tabs defaultValue="sectors" className="space-y-6">
                <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0" data-testid="stats-tabs">
                  <TabsTrigger value="sectors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    By Sector
                  </TabsTrigger>
                  <TabsTrigger value="counties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    By County
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Contract Types
                  </TabsTrigger>
                  <TabsTrigger value="demographics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Demographics
                  </TabsTrigger>
                  <TabsTrigger value="verification" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Verification
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sectors">
                  <Card className="p-6" data-testid="chart-sectors">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle>Employment by Sector</CardTitle>
                      <CardDescription>Distribution of employment spells across economic sectors</CardDescription>
                    </CardHeader>
                    {data!.sectorBreakdown.length > 0 ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data!.sectorBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={140}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="sector"
                              label={({ sector, count }) => `${sector}: ${count}`}
                            >
                              {data!.sectorBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), "Employment Spells"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <NoDataMessage message="No sector data available yet." />
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="counties">
                  <Card className="p-6" data-testid="chart-counties">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle>Employment by County</CardTitle>
                      <CardDescription>Geographic distribution of employment records</CardDescription>
                    </CardHeader>
                    {data!.countyBreakdown.length > 0 ? (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data!.countyBreakdown} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" className="text-xs" />
                            <YAxis type="category" dataKey="county" className="text-xs" width={120} />
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), "Employment Spells"]} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                              {data!.countyBreakdown.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <NoDataMessage message="No county data available yet." />
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="contracts">
                  <Card className="p-6" data-testid="chart-contracts">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle>Employment by Contract Type</CardTitle>
                      <CardDescription>Distribution of employment by contract arrangements</CardDescription>
                    </CardHeader>
                    {data!.contractTypes.length > 0 ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data!.contractTypes}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="type" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), "Records"]} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {data!.contractTypes.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <NoDataMessage message="No contract type data available yet." />
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="demographics">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6" data-testid="chart-gender">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle>Gender Distribution</CardTitle>
                        <CardDescription>Employment by gender identity</CardDescription>
                      </CardHeader>
                      {data!.genderDistribution.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data!.genderDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="gender"
                                label={({ gender, count }) => `${gender}: ${count}`}
                              >
                                {data!.genderDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={genderColors[entry.gender] || COLORS[index]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), "Workers"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <NoDataMessage message="No gender data recorded yet." />
                      )}
                    </Card>

                    <Card className="p-6" data-testid="chart-formality">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle>Formal vs Informal Employment</CardTitle>
                        <CardDescription>Employment formality classification</CardDescription>
                      </CardHeader>
                      {data!.formalityBreakdown.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data!.formalityBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="type"
                                label={({ type, count }) => `${type}: ${count}`}
                              >
                                {data!.formalityBreakdown.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={["#22c55e", "#f59e0b", "#6b7280"][index] || COLORS[index]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), "Spells"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <NoDataMessage message="No formality data recorded yet." />
                      )}
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="verification">
                  <Card className="p-6" data-testid="chart-verification">
                    <CardHeader className="p-0 mb-6">
                      <CardTitle>Verification Status</CardTitle>
                      <CardDescription>Progress of employment record verification</CardDescription>
                    </CardHeader>
                    {data!.verificationBreakdown.length > 0 ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data!.verificationBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="status" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), "Records"]} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {data!.verificationBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={verificationColors[entry.status] || COLORS[index]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <NoDataMessage message="No verification data available yet." />
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Data Source</h3>
                    <p className="text-sm text-muted-foreground">Real System Data</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  All statistics are calculated from actual employment records entered into LiJOBS.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Geographic Coverage</h3>
                    <p className="text-sm text-muted-foreground">All 15 Counties</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete national coverage including urban and rural areas.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sector Coverage</h3>
                    <p className="text-sm text-muted-foreground">5 Employment Sectors</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Private, Public, NGO/Projects, Informal, and Seasonal sectors.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
