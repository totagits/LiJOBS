import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getRoleLabel, getSectorLabel } from "@/hooks/use-auth";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  Plus, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Users,
  Briefcase,
  LogOut,
  Settings,
  Shield,
  GraduationCap,
  Play,
  Video,
  ExternalLink,
  Database,
  Search,
  Gavel,
  ShieldCheck,
  ClipboardCheck,
  Eye,
  Activity,
  TrendingUp
} from "lucide-react";

interface TrainingVideo {
  id: string;
  scriptId: string;
  title: string;
  description: string | null;
  targetAudience: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  duration: string | null;
}

interface VideoScript {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  duration: string;
  script: string;
}

function getRoleAudience(role: string): string {
  switch (role) {
    case "admin": return "admin";
    case "ministry": return "ministry";
    case "employer": return "employer";
    case "enumerator": return "enumerator";
    default: return "individual";
  }
}

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: scripts = [] } = useQuery<VideoScript[]>({
    queryKey: ["/api/training/scripts"],
    enabled: !!user,
  });

  const { data: videos = [] } = useQuery<TrainingVideo[]>({
    queryKey: ["/api/training/videos"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const videoMap = new Map(videos.map(v => [v.scriptId, v]));
  const userAudience = getRoleAudience(user.role);
  const roleScripts = scripts.filter(s => s.targetAudience === userAudience);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return Shield;
      case "ministry": return Building2;
      case "employer": return Briefcase;
      case "enumerator": return Users;
      case "individual": return User;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  // Quick actions based on role
  const getQuickActions = () => {
    const actions = [];
    
    // Employer-specific Labour Exchange actions
    if (user.role === "employer") {
      actions.push({
        title: "Post New Vacancy",
        description: "Create a new job listing",
        icon: Plus,
        href: "/employer/vacancies/new",
        color: "bg-primary",
      });
      actions.push({
        title: "Manage Vacancies",
        description: "View and edit your job postings",
        icon: Briefcase,
        href: "/employer/vacancies",
        color: "bg-blue-500",
      });
      actions.push({
        title: "View Applications",
        description: "Review candidates who applied",
        icon: Users,
        href: "/employer/applications",
        color: "bg-emerald-500",
      });
      actions.push({
        title: "Browse Job Seekers",
        description: "Find qualified candidates",
        icon: Search,
        href: "/job-seekers",
        color: "bg-violet-500",
      });
      actions.push({
        title: "Manage Tenders",
        description: "Post and manage bids & tenders",
        icon: Gavel,
        href: "/employer/tenders",
        color: "bg-amber-500",
      });
    }
    
    if (["admin", "ministry", "enumerator"].includes(user.role)) {
      actions.push({
        title: "Report New Jobs",
        description: "Add employment records to the system",
        icon: Plus,
        href: "/report-jobs",
        color: "bg-primary",
      });
    }

    if (user.role === "enumerator") {
      actions.push({
        title: "Field Verification",
        description: "Verify employment records in the field",
        icon: ClipboardCheck,
        href: "/verification",
        color: "bg-emerald-500",
      });
      actions.push({
        title: "Jobs Observatory",
        description: "View all employment spells and records",
        icon: Eye,
        href: "/observatory",
        color: "bg-blue-500",
      });
    }

    if (user.role === "director") {
      actions.push({
        title: "Director Dashboard",
        description: "System overview and officer performance",
        icon: Activity,
        href: "/director",
        color: "bg-primary",
      });
      actions.push({
        title: "Verify Records",
        description: "Final approval of verified employment records",
        icon: ShieldCheck,
        href: "/verification",
        color: "bg-emerald-500",
      });
      actions.push({
        title: "Jobs Observatory",
        description: "View all employment spells and records",
        icon: Eye,
        href: "/observatory",
        color: "bg-blue-500",
      });
      actions.push({
        title: "Occupational Economics",
        description: "Wage trends, skills gaps, and projections",
        icon: TrendingUp,
        href: "/occupational-economics",
        color: "bg-violet-500",
      });
    }

    if (["admin", "ministry"].includes(user.role)) {
      actions.push({
        title: "Verify Records",
        description: "Review and verify pending submissions",
        icon: CheckCircle,
        href: "/admin/verifications",
        color: "bg-emerald-500",
      });
      actions.push({
        title: "Employment Verification",
        description: "Three-layer spell verification pipeline",
        icon: ClipboardCheck,
        href: "/verification",
        color: "bg-purple-500",
      });
    }

    if (user.role === "admin") {
      actions.push({
        title: "User Management",
        description: "View and manage all registered users",
        icon: Users,
        href: "/admin/users",
        color: "bg-indigo-500",
      });
      actions.push({
        title: "Video Management",
        description: "Generate and manage training videos",
        icon: Video,
        href: "/admin/videos",
        color: "bg-purple-500",
      });
      actions.push({
        title: "Baseline Data",
        description: "Manage county populations and targets",
        icon: Database,
        href: "/admin/baseline-data",
        color: "bg-amber-500",
      });
    }

    if (["admin", "ministry", "director"].includes(user.role)) {
      actions.push({
        title: "Statistical Rigor",
        description: "Data quality checks & methodology",
        icon: ShieldCheck,
        href: "/statistical-rigor",
        color: "bg-teal-500",
      });
    }

    // Common actions for all roles
    actions.push({
      title: "Browse Jobs",
      description: "Explore available job opportunities",
      icon: Search,
      href: "/jobs",
      color: "bg-cyan-500",
    });

    actions.push({
      title: "View Statistics",
      description: "Explore employment data and trends",
      icon: BarChart3,
      href: "/data",
      color: "bg-blue-500",
    });

    actions.push({
      title: "Download Reports",
      description: "Access published reports and documents",
      icon: FileText,
      href: "/reports",
      color: "bg-violet-500",
    });

    return actions;
  };

  // Stats based on role (mock data for demo)
  const getStats = () => {
    if (user.role === "employer") {
      return [
        { label: "Jobs Reported", value: "24", icon: Briefcase },
        { label: "Pending Verification", value: "3", icon: Clock },
        { label: "Verified", value: "21", icon: CheckCircle },
      ];
    }
    if (user.role === "enumerator") {
      return [
        { label: "Workers Registered", value: "156", icon: Users },
        { label: "Pending Field Verification", value: "12", icon: ClipboardCheck },
        { label: "This Month", value: "42", icon: Plus },
      ];
    }
    if (user.role === "director") {
      return [
        { label: "Total Records", value: "847,562", icon: Briefcase },
        { label: "Awaiting Final Approval", value: "245", icon: ShieldCheck },
        { label: "Verified This Month", value: "1,847", icon: CheckCircle },
      ];
    }
    if (user.role === "admin" || user.role === "ministry") {
      return [
        { label: "Total Records", value: "847,562", icon: Briefcase },
        { label: "Pending Verification", value: "1,245", icon: Clock },
        { label: "Active Employers", value: "15,847", icon: Building2 },
      ];
    }
    return [
      { label: "My Records", value: "1", icon: User },
      { label: "Status", value: "Active", icon: CheckCircle },
    ];
  };

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-dashboard-welcome">
                  Welcome, {user.firstName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  {user.isDemo && <Badge variant="outline" className="mr-2">Demo Account</Badge>}
                  {getRoleLabel(user.role)} {user.organizationName && `at ${user.organizationName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-settings">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RoleIcon className="w-5 h-5" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                    </div>
                    {user.sector && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sector</span>
                        <span>{getSectorLabel(user.sector)}</span>
                      </div>
                    )}
                    {user.county && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">County</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.county}
                        </span>
                      </div>
                    )}
                    {user.organizationName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Organization</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.organizationName}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Your activity summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {getStats().map((stat, index) => (
                      <div
                        key={stat.label}
                        className="p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickActions().map((action, index) => (
                <Link key={action.title} href={action.href}>
                  <Card className="cursor-pointer transition-all hover-elevate h-full" data-testid={`action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-4`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* My Training Section */}
          {roleScripts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">My Training</h2>
                </div>
                <Badge variant="outline">{roleScripts.length} videos</Badge>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleScripts.map((script) => {
                  const video = videoMap.get(script.id);
                  const hasVideo = video?.status === "completed" && video.videoUrl;
                  
                  return (
                    <Card key={script.id} className="hover-elevate" data-testid={`training-card-${script.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <Badge variant={hasVideo ? "default" : "secondary"}>
                            {hasVideo ? "Available" : "Coming Soon"}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">{script.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{script.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Clock className="w-4 h-4" />
                          <span>{script.duration}</span>
                        </div>
                        {hasVideo ? (
                          <a href={video.videoUrl!} target="_blank" rel="noopener noreferrer">
                            <Button className="w-full gap-2" size="sm" data-testid={`button-watch-${script.id}`}>
                              <Play className="w-4 h-4" />
                              Watch Video
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        ) : (
                          <Button variant="secondary" className="w-full gap-2" size="sm" disabled>
                            <Video className="w-4 h-4" />
                            Coming Soon
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Role-specific content */}
          {(user.role === "admin" || user.role === "ministry") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pending Verifications</CardTitle>
                  <CardDescription>Recent submissions awaiting review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending verifications at this time</p>
                    <p className="text-sm">New submissions will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
