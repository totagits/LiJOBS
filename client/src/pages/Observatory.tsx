import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Building2, 
  BadgeCheck, 
  ShieldCheck,
  AlertCircle,
  Clock,
  UserCheck,
  Briefcase,
  FileCheck,
  MapPin,
  PieChart,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface ObservatoryStats {
  totalSpells: number;
  activeSpells: number;
  verifiedSpells: number;
  selfReportedSpells: number;
  formalJobs: number;
  informalJobs: number;
  avgTrustScore: number;
  youthEmployment: number;
  femaleEmployment: number;
  pendingSpells: number;
  employerVerifiedSpells: number;
  enumeratorVerifiedSpells: number;
  flaggedSpells: number;
  rejectedSpells: number;
}

export default function Observatory() {
  const { data: stats, isLoading: statsLoading } = useQuery<ObservatoryStats>({
    queryKey: ["/api/observatory/stats"],
  });

  const { data: sectorData } = useQuery<{ sector: string; jobs: number; color: string }[]>({
    queryKey: ["/api/sectors"],
  });

  const { data: countyData } = useQuery<{ name: string; jobs: number }[]>({
    queryKey: ["/api/counties"],
  });

  // Calculate derived metrics
  const totalJobs = stats?.totalSpells || 0;
  const verifiedJobs = stats?.verifiedSpells || 0;
  const verificationRate = totalJobs > 0 ? Math.round((verifiedJobs / totalJobs) * 100) : 0;
  const formalRate = totalJobs > 0 ? Math.round((stats?.formalJobs || 0) / totalJobs * 100) : 0;
  const youthRate = totalJobs > 0 ? Math.round((stats?.youthEmployment || 0) / totalJobs * 100) : 0;
  const femaleRate = totalJobs > 0 ? Math.round((stats?.femaleEmployment || 0) / totalJobs * 100) : 0;

  // Three-layer verification data for pie chart
  const verificationData = [
    { name: "Fully Verified", value: verifiedJobs, color: "#22c55e" },
    { name: "Enumerator Verified", value: stats?.enumeratorVerifiedSpells || 0, color: "#8b5cf6" },
    { name: "Employer Signed", value: stats?.employerVerifiedSpells || 0, color: "#3b82f6" },
    { name: "Pending", value: stats?.pendingSpells || 0, color: "#6b7280" },
    { name: "Flagged", value: stats?.flaggedSpells || 0, color: "#f97316" },
    { name: "Rejected", value: stats?.rejectedSpells || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Formality data
  const formalityData = [
    { name: "Formal", value: stats?.formalJobs || 0, color: "#3b82f6" },
    { name: "Informal", value: stats?.informalJobs || 0, color: "#f97316" },
    { name: "Unknown", value: totalJobs - (stats?.formalJobs || 0) - (stats?.informalJobs || 0), color: "#9ca3af" },
  ].filter(d => d.value > 0);

  // Demographics data
  const demographicsData = [
    { category: "Youth (15-35)", count: stats?.youthEmployment || 0, color: "#8b5cf6" },
    { category: "Female Workers", count: stats?.femaleEmployment || 0, color: "#ec4899" },
    { category: "Active Spells", count: stats?.activeSpells || 0, color: "#06b6d4" },
  ];

  // Top counties by jobs
  const topCounties = countyData
    ?.filter(c => c.jobs > 0)
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 5) || [];

  const hasData = totalJobs > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Jobs Observatory</h1>
            <Badge className="bg-blue-600">LiJOBS Differentiator</Badge>
          </div>
          <p className="text-muted-foreground">
            Real-time job creation tracking with verification and trust scoring - Liberia's competitive advantage
          </p>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employment Spells</p>
                    <p className="text-2xl font-bold" data-testid="text-total-spells">
                      {hasData ? totalJobs.toLocaleString() : "No data yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verified Jobs</p>
                    <p className="text-2xl font-bold" data-testid="text-verified-jobs">
                      {hasData ? `${verificationRate}%` : "No data yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
                    <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Trust Score</p>
                    <p className="text-2xl font-bold" data-testid="text-trust-score">
                      {hasData ? (stats?.avgTrustScore || 0).toFixed(2) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formal Jobs</p>
                    <p className="text-2xl font-bold" data-testid="text-formal-rate">
                      {hasData ? `${formalRate}%` : "No data yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="verification" data-testid="tab-verification">
              <BadgeCheck className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="formality" data-testid="tab-formality">
              <FileCheck className="w-4 h-4 mr-2" />
              Formality
            </TabsTrigger>
            <TabsTrigger value="demographics" data-testid="tab-demographics">
              <Users className="w-4 h-4 mr-2" />
              Demographics
            </TabsTrigger>
            <TabsTrigger value="geography" data-testid="tab-geography">
              <MapPin className="w-4 h-4 mr-2" />
              Geography
            </TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Verification Status Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of job records by verification level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasData && verificationData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={verificationData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {verificationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No verification data available yet</p>
                        <p className="text-sm">Start entering employment records to see statistics</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Verification Workflow
                  </CardTitle>
                  <CardDescription>
                    How job records move through verification stages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { label: "Pending", count: stats?.pendingSpells || 0, icon: Clock, bg: "bg-gray-100 dark:bg-gray-800", iconColor: "text-gray-600", barClass: "" },
                      { label: "Employer Signed", count: stats?.employerVerifiedSpells || 0, icon: Building2, bg: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600", barClass: "[&>div]:bg-blue-500" },
                      { label: "Field Verified", count: stats?.enumeratorVerifiedSpells || 0, icon: Users, bg: "bg-purple-100 dark:bg-purple-900", iconColor: "text-purple-600", barClass: "[&>div]:bg-purple-500" },
                      { label: "Fully Verified", count: verifiedJobs, icon: BadgeCheck, bg: "bg-emerald-100 dark:bg-emerald-900", iconColor: "text-emerald-600", barClass: "[&>div]:bg-emerald-500" },
                      { label: "Flagged", count: stats?.flaggedSpells || 0, icon: AlertCircle, bg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600", barClass: "[&>div]:bg-orange-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${item.bg}`}>
                          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-sm">{item.label}</span>
                            <span className="text-sm text-muted-foreground">{item.count} records</span>
                          </div>
                          <Progress value={totalJobs > 0 ? (item.count / totalJobs) * 100 : 0} className={`h-2 ${item.barClass}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Three-Layer Trust Score System
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Trust score progresses through three verification layers:
                    </p>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                      <li>• <strong>Pending</strong> — Score: 0.3 (unverified self-report)</li>
                      <li>• <strong>Employer Signed</strong> — Score: 0.4 (employer confirms data)</li>
                      <li>• <strong>Field Verified</strong> — Score: 0.7 (enumerator confirms at workplace)</li>
                      <li>• <strong>Fully Verified</strong> — Score: 1.0 (ministry final approval)</li>
                      <li>• <strong>Flagged</strong> — Score: 0.2 (discrepancies detected)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Formality Tab */}
          <TabsContent value="formality">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Formal vs Informal Employment
                  </CardTitle>
                  <CardDescription>
                    Classification based on written contracts and social security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasData && formalityData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={formalityData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {formalityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No formality data available yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formality Indicators</CardTitle>
                  <CardDescription>
                    Criteria used to classify formal employment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-semibold text-emerald-600 mb-2">Formal Employment</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✓ Written employment contract</li>
                        <li>✓ Social security contributions</li>
                        <li>✓ Regular wage payment</li>
                        <li>✓ Registered employer</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-semibold text-amber-600 mb-2">Informal Employment</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Verbal agreements</li>
                        <li>• No social protection</li>
                        <li>• Irregular payments</li>
                        <li>• Unregistered businesses</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Why This Matters
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Tracking formal vs informal employment is crucial for policy decisions 
                      around social protection, tax revenue, and labor rights in Liberia.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Employment Demographics
                  </CardTitle>
                  <CardDescription>
                    Key demographic breakdowns of employment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasData ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicsData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="category" width={120} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {demographicsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No demographic data available yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inclusion Metrics</CardTitle>
                  <CardDescription>
                    Tracking employment for priority groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-violet-500" />
                          Youth Employment (Age 15-35)
                        </span>
                        <span className="font-bold">{hasData ? `${youthRate}%` : "N/A"}</span>
                      </div>
                      <Progress value={youthRate} className="h-3 [&>div]:bg-violet-500" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-500" />
                          Female Workers
                        </span>
                        <span className="font-bold">{hasData ? `${femaleRate}%` : "N/A"}</span>
                      </div>
                      <Progress value={femaleRate} className="h-3 [&>div]:bg-pink-500" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-500" />
                          Active Employment Spells
                        </span>
                        <span className="font-bold">
                          {hasData ? stats?.activeSpells?.toLocaleString() : "N/A"}
                        </span>
                      </div>
                      <Progress 
                        value={totalJobs > 0 ? ((stats?.activeSpells || 0) / totalJobs) * 100 : 0} 
                        className="h-3 [&>div]:bg-cyan-500" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Top Counties by Jobs
                  </CardTitle>
                  <CardDescription>
                    Counties with the highest job creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topCounties.length > 0 ? (
                    <div className="space-y-4">
                      {topCounties.map((county, index) => (
                        <div key={county.name} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{county.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {county.jobs.toLocaleString()} jobs
                              </span>
                            </div>
                            <Progress 
                              value={(county.jobs / (topCounties[0]?.jobs || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No geographic data available yet</p>
                        <p className="text-sm">Enter employment records to see county breakdown</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sector Distribution
                  </CardTitle>
                  <CardDescription>
                    Jobs by economic sector
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sectorData && sectorData.some(s => s.jobs > 0) ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sector" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="jobs" radius={[4, 4, 0, 0]}>
                            {sectorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No sector data available yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
