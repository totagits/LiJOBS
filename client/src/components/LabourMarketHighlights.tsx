import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingDown, TrendingUp, Users, Briefcase, BarChart3, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface LabourIndicator {
  id: number;
  year: number;
  quarter: number | null;
  unemploymentRate: number;
  employmentToPopRatio: number;
  labourForceParticipation: number;
  youthUnemploymentRate: number;
  femaleLabourParticipation: number;
  informalEmploymentRate: number;
  totalLabourForce: number;
  totalEmployed: number;
  totalUnemployed: number;
  source: string;
}

export function LabourMarketHighlights() {
  const { data: indicators = [], isLoading } = useQuery<LabourIndicator[]>({
    queryKey: ["/api/labour-indicators"],
  });

  const sorted = [...indicators].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (b.quarter || 0) - (a.quarter || 0);
  });
  const latest = sorted[0];
  const previous = sorted[1];

  const getDelta = (current: number, prev: number) => {
    const diff = current - prev;
    return { value: Math.abs(diff).toFixed(1), isPositive: diff > 0, isZero: diff === 0 };
  };

  if (isLoading) {
    return (
      <section className="py-20" data-testid="labour-highlights-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-48 h-6 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="w-96 h-10 bg-muted rounded mx-auto mb-4 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="w-full h-24 bg-muted rounded" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!latest) return null;

  const highlights = [
    {
      label: "Unemployment Rate",
      value: `${latest.unemploymentRate}%`,
      icon: Activity,
      delta: previous ? getDelta(latest.unemploymentRate, previous.unemploymentRate) : null,
      invertColor: true,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Labour Force",
      value: latest.totalLabourForce >= 1000000
        ? `${(latest.totalLabourForce / 1000000).toFixed(1)}M`
        : latest.totalLabourForce.toLocaleString(),
      icon: Users,
      delta: previous ? getDelta(latest.totalLabourForce, previous.totalLabourForce) : null,
      invertColor: false,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Employment-to-Population",
      value: `${latest.employmentToPopRatio}%`,
      icon: Briefcase,
      delta: previous ? getDelta(latest.employmentToPopRatio, previous.employmentToPopRatio) : null,
      invertColor: false,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Youth Unemployment",
      value: `${latest.youthUnemploymentRate}%`,
      icon: BarChart3,
      delta: previous ? getDelta(latest.youthUnemploymentRate, previous.youthUnemploymentRate) : null,
      invertColor: true,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const periodLabel = latest.quarter ? `Q${latest.quarter} ${latest.year}` : `${latest.year}`;

  return (
    <section className="py-20" data-testid="labour-highlights-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Labour Market Overview
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-labour-highlights-title">
            Key Labour Market Indicators
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Latest official statistics from {periodLabel} - sourced from {latest.source}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {highlights.map((item, index) => {
            const IconComp = item.icon;
            const trendPositive = item.delta
              ? item.invertColor ? !item.delta.isPositive : item.delta.isPositive
              : null;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="p-6 hover-elevate transition-all duration-300"
                  data-testid={`highlight-card-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    {item.delta && !item.delta.isZero && (
                      <Badge
                        variant="secondary"
                        className={trendPositive
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                          : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950"
                        }
                      >
                        {trendPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {item.delta.value}
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold mb-1" data-testid={`highlight-value-${index}`}>
                    {item.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Female Labour Participation</p>
            <p className="text-2xl font-bold">{latest.femaleLabourParticipation}%</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Informal Employment Rate</p>
            <p className="text-2xl font-bold">{latest.informalEmploymentRate}%</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Employed</p>
            <p className="text-2xl font-bold">{latest.totalEmployed.toLocaleString()}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button variant="outline" className="gap-2" asChild data-testid="button-view-all-indicators">
            <Link href="/labour-indicators">
              View Full Indicators Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
