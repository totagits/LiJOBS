import { useState, useEffect, useRef } from "react";
import flagImg from "@assets/liberian-flag-ribbon.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  BarChart3,
  Activity,
  Shield,
  Globe,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LabourIndicator, SectorData, MonthlyData } from "@shared/schema";

function AnimatedCounter({ value, duration = 2000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const sectorColors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e"];

export function Hero() {
  const { data: indicators = [] } = useQuery<LabourIndicator[]>({
    queryKey: ["/api/labour-indicators"],
  });

  const { data: sectorData = [] } = useQuery<SectorData[]>({
    queryKey: ["/api/sectors"],
  });

  const { data: monthlyData = [] } = useQuery<MonthlyData[]>({
    queryKey: ["/api/monthly-data"],
  });

  const sorted = [...indicators].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.quarter || 0) - (a.quarter || 0);
  });
  const latest = sorted[0];

  const pieData = sectorData.filter(s => s.jobs > 0).length > 0
    ? sectorData
        .map((s, i) => ({ name: s.sector, value: s.jobs, color: s.color || sectorColors[i % sectorColors.length] }))
        .filter(s => s.value > 0)
    : [
        { name: "Private", value: 42, color: "#3b82f6" },
        { name: "Public", value: 28, color: "#8b5cf6" },
        { name: "NGO", value: 12, color: "#06b6d4" },
        { name: "Informal", value: 15, color: "#f59e0b" },
        { name: "Seasonal", value: 3, color: "#22c55e" },
      ];

  const hasRealMonthly = monthlyData.some(m => m.jobs > 0 || m.formal > 0);
  const trendData = hasRealMonthly
    ? monthlyData.slice(-8)
    : [
        { month: "Q1'23", formal: 420, informal: 310 },
        { month: "Q2'23", formal: 480, informal: 335 },
        { month: "Q3'23", formal: 510, informal: 320 },
        { month: "Q4'23", formal: 550, informal: 340 },
        { month: "Q1'24", formal: 590, informal: 360 },
        { month: "Q2'24", formal: 630, informal: 385 },
        { month: "Q3'24", formal: 680, informal: 390 },
        { month: "Q4'24", formal: 720, informal: 410 },
      ];

  const unemploymentRate = latest?.unemploymentRate ?? 3.0;
  const labourForce = latest?.totalLabourForce ?? 1920000;
  const participation = latest?.labourForceParticipation ?? 60;
  const totalEmployed = latest?.totalEmployed ?? 1862400;

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85"
      data-testid="hero-section"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/[0.03] -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/10 translate-y-1/3 -translate-x-1/3" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center flex-wrap gap-3"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm" data-testid="badge-official">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Official Government Platform
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs" data-testid="badge-isco">
                <Shield className="w-3 h-3" />
                ISCO-08 Compliant
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-12" data-testid="text-hero-title">
                Liberia Jobs
                <span className="block text-white/80">Observatory System</span>
              </h1>
              <div className="relative inline-block" data-testid="text-lijobs-ribbon">
                <img
                  src={flagImg}
                  alt="Liberian flag"
                  className="w-full max-w-[180px] h-auto drop-shadow-xl ribbon-flutter"
                />
                <span className="absolute -top-6 left-0 right-0 text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-[#002868] tracking-wider drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]">
                  LiJOBS
                </span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/80 max-w-lg leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              The National Platform for Real-Time, Trustworthy, and Privacy-Safe
              Employment Statistics Across All Sectors of Liberia
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "Unemployment", value: `${unemploymentRate}%`, icon: Activity, trend: "down" },
                { label: "Labour Force", value: `${(labourForce / 1000000).toFixed(1)}M`, icon: Users, trend: "up" },
                { label: "Participation", value: `${participation}%`, icon: BarChart3, trend: "up" },
                { label: "Employed", value: `${(totalEmployed / 1000000).toFixed(1)}M`, icon: Briefcase, trend: "up" },
              ].map((stat, i) => (
                <div key={stat.label} className="px-3 py-3 rounded-lg bg-white/[0.07] backdrop-blur-sm border border-white/10" data-testid={`hero-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium" data-testid={`hero-stat-label-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-white" data-testid={`hero-stat-value-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>{stat.value}</span>
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start flex-wrap gap-3"
            >
              <Button
                size="lg"
                className="gap-2 bg-white text-primary min-w-[180px] font-semibold shadow-lg shadow-black/20"
                asChild
                data-testid="button-explore-data"
              >
                <Link href="/data">
                  Explore Data
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 text-white backdrop-blur-sm min-w-[180px] font-semibold"
                asChild
                data-testid="button-report-jobs"
              >
                <Link href="/report-jobs">
                  Report Jobs
                  <Building2 className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center flex-wrap gap-4 text-white/50 text-xs"
            >
              <span className="flex items-center gap-1.5" data-testid="text-counties-covered">
                <Globe className="w-3.5 h-3.5" />
                15 Counties Covered
              </span>
              <span className="flex items-center gap-1.5" data-testid="text-privacy">
                <Shield className="w-3.5 h-3.5" />
                Privacy by Design
              </span>
              <span className="flex items-center gap-1.5" data-testid="text-live-feed">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Data Feed
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative" data-testid="hero-dashboard">
              <div className="absolute -inset-4 bg-white/5 rounded-2xl blur-xl" />

              <div className="relative space-y-4">
                <Card className="p-5 bg-white/[0.08] backdrop-blur-md border-white/10 shadow-2xl" data-testid="hero-chart-trends">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Employment Trends</p>
                        <p className="text-[10px] text-white/50">Formal vs Informal</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid="badge-live">
                      Live
                    </Badge>
                  </div>
                  <div style={{ width: "100%", height: 140 }} className="-mx-2">
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="heroGradFormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="heroGradInformal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15,23,42,0.95)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          itemStyle={{ color: "#fff" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Area type="monotone" dataKey="formal" stroke="#60a5fa" fill="url(#heroGradFormal)" strokeWidth={2} />
                        <Area type="monotone" dataKey="informal" stroke="#f59e0b" fill="url(#heroGradInformal)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-white/60" data-testid="hero-legend-formal">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Formal
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-white/60" data-testid="hero-legend-informal">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Informal
                    </span>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-white/[0.08] backdrop-blur-md border-white/10 shadow-2xl" data-testid="hero-chart-sectors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">By Sector</p>
                    </div>
                    <div style={{ width: "100%", height: 120 }}>
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart width={120} height={120}>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.95)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                            itemStyle={{ color: "#fff" }}
                            labelStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {pieData.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5 text-[10px] text-white/60" data-testid={`hero-sector-legend-${s.name.toLowerCase()}`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="truncate">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-white/[0.08] backdrop-blur-md border-white/10 shadow-2xl" data-testid="hero-indicators-panel">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">Key Indicators</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Unemployment Rate", value: `${unemploymentRate}%`, color: "text-blue-300", id: "unemployment" },
                        { label: "Participation Rate", value: `${participation}%`, color: "text-emerald-300", id: "participation" },
                        { label: "Youth Unemployment", value: `${latest?.youthUnemploymentRate ?? 4.4}%`, color: "text-amber-300", id: "youth" },
                        { label: "Informal Rate", value: `${latest?.informalEmploymentRate ?? 73.5}%`, color: "text-violet-300", id: "informal" },
                      ].map(ind => (
                        <div key={ind.label} className="flex items-center justify-between gap-2" data-testid={`hero-indicator-${ind.id}`}>
                          <span className="text-[10px] text-white/50 leading-tight">{ind.label}</span>
                          <span className={`text-sm font-bold ${ind.color}`} data-testid={`hero-indicator-value-${ind.id}`}>{ind.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[9px] text-white/40 text-center">
                        Source: {latest?.source ? latest.source.split(' ').slice(0, 4).join(' ') : "LISGIS Report"} {latest?.year ?? "2024"}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
