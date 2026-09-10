import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { StatsSection } from "@/components/StatsSection";
import { ChartsSection } from "@/components/ChartsSection";
import { CountyMap } from "@/components/CountyMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  BarChart3, 
  Map, 
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalJobs: number;
  verifiedJobs: number;
  activeEmployers: number;
  countiesReporting: number;
}

const quickExports = [
  { title: "Monthly Summary", format: "Excel", endpoint: "/api/export/employment", filename: "monthly_summary" },
  { title: "Sector Breakdown", format: "Excel", endpoint: "/api/export/employment", filename: "sector_breakdown" },
  { title: "County Statistics", format: "Excel", endpoint: "/api/export/vacancies", filename: "county_statistics" },
  { title: "Raw Data Export", format: "Excel", endpoint: "/api/export/employers", filename: "raw_data_export" }
];

export default function DataPortal() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"]
  });
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleQuickExport = async (item: typeof quickExports[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setExporting(item.filename);
    try {
      const response = await fetch(item.endpoint, { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export Complete", description: `${item.title} has been downloaded.` });
    } catch {
      toast({ title: "Export Failed", description: "There was an error exporting the data.", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen" data-testid="data-portal-page">
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
              <div className="flex items-center flex-wrap gap-4 mb-4">
                <Badge variant="secondary">Data Portal</Badge>
                <Badge variant="outline" className="border-green-400 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                  Live Data
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-portal-title">
                National Employment Data Portal
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mb-8">
                Access real-time employment statistics, sector analysis, and county-level data 
                for the Republic of Liberia.
              </p>
              <div className="flex items-center flex-wrap gap-4">
                <Button variant="secondary" className="gap-2" data-testid="button-download-report">
                  <Download className="w-4 h-4" />
                  Download Full Report
                </Button>
                <Button variant="outline" className="gap-2 border-white/30 text-white" data-testid="button-api-access">
                  <FileSpreadsheet className="w-4 h-4" />
                  API Access
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center flex-wrap gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </Button>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                <span className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
                <Button variant="ghost" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>

        <StatsSection />

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="charts" className="space-y-8">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="charts">
                <ChartsSection />
              </TabsContent>

              <TabsContent value="map">
                <CountyMap />
              </TabsContent>

              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Employment Trends Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">+12.4%</p>
                        <p className="text-sm text-muted-foreground mt-2">Year-over-Year Growth</p>
                      </div>
                      <div className="text-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">67,234</p>
                        <p className="text-sm text-muted-foreground mt-2">New Jobs This Quarter</p>
                      </div>
                      <div className="text-center p-6 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">89%</p>
                        <p className="text-sm text-muted-foreground mt-2">Verification Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Quick Data Access</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickExports.map((item, index) => (
                <Card 
                  key={index} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => handleQuickExport(item)}
                  data-testid={`quick-export-${item.filename}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {user ? `${item.format} - Click to download` : "Sign in to download"}
                      </p>
                    </div>
                    {exporting === item.filename ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
