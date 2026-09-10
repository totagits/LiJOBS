import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Building2, Briefcase, MapPin, BadgeCheck, Activity, FileText, UserSearch } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { NationalStat } from "@shared/schema";

const iconMap: Record<string, typeof Users> = {
  Briefcase,
  Building2,
  BadgeCheck,
  MapPin,
  Users,
  Activity,
  FileText,
  UserSearch,
};

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
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

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function StatsSection() {
  const { data: stats, isLoading } = useQuery<NationalStat[]>({
    queryKey: ["/api/stats"],
  });

  return (
    <section
      id="stats"
      className="py-20"
      data-testid="stats-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            National Employment Data
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-stats-title">
            Real-Time Job Creation Statistics
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive employment data collected and verified across all sectors of Liberia's economy
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-muted" />
                  <div className="w-16 h-6 rounded bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="w-32 h-10 rounded bg-muted" />
                  <div className="w-24 h-5 rounded bg-muted" />
                  <div className="w-20 h-4 rounded bg-muted" />
                </div>
              </Card>
            ))
          ) : (
            stats?.map((stat, index) => {
              const IconComponent = iconMap[stat.icon] || Briefcase;
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 hover-elevate transition-all duration-300"
                    data-testid={`stat-card-${stat.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      {stat.change !== 0 && (
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            stat.change > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {stat.change > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {stat.change > 0 ? "+" : ""}
                          {stat.change}%
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div
                        className="text-3xl sm:text-4xl font-bold tracking-tight"
                        data-testid={`stat-value-${stat.id}`}
                      >
                        {stat.prefix}
                        <AnimatedCounter value={stat.value} />
                        {stat.suffix}
                      </div>
                      <p className="text-muted-foreground font-medium" data-testid={`stat-label-${stat.id}`}>
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {stat.changeLabel}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Data updated in real-time from verified sources across all 15 counties
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Data Feed
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="w-4 h-4 text-primary" />
              Government Verified
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
