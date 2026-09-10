import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  MessageSquareWarning,
  BookOpen,
  HardHat,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const services = [
  {
    id: "indicators",
    icon: BarChart3,
    title: "Labour Market Indicators",
    description: "Interactive dashboard with unemployment rates, labour force participation, and employment trends across all sectors.",
    href: "/labour-indicators",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "grievance",
    icon: MessageSquareWarning,
    title: "Grievance & Complaints",
    description: "File and track workplace complaints including wage disputes, discrimination, and unsafe conditions.",
    href: "/grievances",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "knowledge",
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Research library with policy documents, statistical bulletins, legal frameworks, and training materials.",
    href: "/knowledge-base",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    id: "safety",
    icon: HardHat,
    title: "Workplace Safety",
    description: "Report workplace incidents and access safety statistics across industries and counties.",
    href: "/workplace-safety",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "exchange",
    icon: Briefcase,
    title: "Labour Exchange",
    description: "Browse available vacancies, register as a job seeker, and get matched with suitable opportunities.",
    href: "/jobs",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "training",
    icon: GraduationCap,
    title: "Training & Courses",
    description: "Access accredited training programs with lessons, quizzes, and professional certification.",
    href: "/courses",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
];

export function QuickAccessSection() {
  return (
    <section className="py-20" data-testid="quick-access-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Platform Services
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-quick-access-title">
            Everything You Need in One Place
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access comprehensive employment services, data insights, and citizen tools - surpassing international GLMIS standards
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const IconComp = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Link href={service.href}>
                  <Card
                    className="p-6 h-full hover-elevate transition-all duration-300 cursor-pointer"
                    data-testid={`service-card-${service.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${service.color} shrink-0`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2" data-testid={`service-title-${service.id}`}>
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {service.description}
                        </p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary" data-testid={`service-link-${service.id}`}>
                          Explore
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Card className="inline-flex flex-col sm:flex-row items-center flex-wrap gap-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold">Are you an employer?</h3>
                <p className="text-sm text-muted-foreground">Register your organization and start reporting employment data</p>
              </div>
            </div>
            <Button className="gap-2" asChild data-testid="button-employer-register">
              <Link href="/register">
                Register Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
