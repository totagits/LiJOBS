import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Database,
  BarChart3,
  Globe,
  Users,
  Smartphone,
  FileCheck,
  Lock,
  Zap,
  ArrowRight,
  Accessibility,
  MessageSquareWarning,
  HardHat,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const features = [
  {
    id: "realtime",
    icon: Zap,
    title: "Real-Time Data",
    description: "Live employment statistics updated as jobs are created and verified across all sectors.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "verified",
    icon: FileCheck,
    title: "Verified Employment",
    description: "Multi-layer verification system ensures accuracy through payroll, tax, and site visits.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy by Design",
    description: "Personal data is hashed and protected. Only aggregated statistics are publicly visible.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    id: "multichannel",
    icon: Smartphone,
    title: "Multi-Channel Access",
    description: "Web portal, mobile app, USSD/SMS for rural areas, and bulk upload for enterprises.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "sectors",
    icon: Users,
    title: "All Sectors Covered",
    description: "Public, private, NGO, informal economy, seasonal work, and donor-funded projects.",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Policy-Ready Analytics",
    description: "Dashboards and reports designed for evidence-based policymaking and planning.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    id: "coverage",
    icon: Globe,
    title: "National Coverage",
    description: "Complete coverage across all 15 counties with district-level granularity.",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "audit",
    icon: Shield,
    title: "Full Audit Trail",
    description: "Immutable logs of all changes ensure transparency and accountability.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    id: "integration",
    icon: Database,
    title: "System Integration",
    description: "Connects with HRMIS, Business Registry, tax systems, and donor project databases.",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "grievance",
    icon: MessageSquareWarning,
    title: "Grievance System",
    description: "Citizens can file and track workplace complaints with automatic case management and resolution tracking.",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    id: "safety",
    icon: HardHat,
    title: "Workplace Safety",
    description: "Public incident reporting with real-time safety dashboards and aggregate statistics across industries.",
    color: "bg-yellow-500/10 text-yellow-600",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    title: "Full Accessibility",
    description: "Built-in accessibility widget with font scaling, high contrast mode, and text-to-speech for all users.",
    color: "bg-sky-500/10 text-sky-600",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20"
      data-testid="features-section"
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
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="text-features-title">
            Enterprise-Grade Capabilities
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built with security, scalability, and reliability at its core to serve the nation's employment data needs
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card
                className="p-6 h-full hover-elevate transition-all duration-300"
                data-testid={`feature-card-${feature.id}`}
              >
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Card className="inline-flex flex-col sm:flex-row items-center flex-wrap gap-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-1">Ready to get started?</h3>
              <p className="text-sm text-muted-foreground">
                Register your organization and start reporting jobs today
              </p>
            </div>
            <Button className="gap-2" asChild data-testid="button-get-started">
              <Link href="/register">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
