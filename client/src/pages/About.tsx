import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Eye, 
  Shield, 
  Users, 
  BarChart3, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Building2,
  Landmark
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";
import sealOfLiberia from "@/assets/images/seal-of-liberia.png";

const values = [
  {
    icon: Shield,
    title: "Data Integrity",
    description: "Ensuring accurate, verified employment statistics through rigorous validation processes."
  },
  {
    icon: Users,
    title: "Inclusivity",
    description: "Tracking all forms of employment across formal, informal, and seasonal sectors."
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Open access to methodology and data for public accountability."
  },
  {
    icon: Globe,
    title: "National Coverage",
    description: "Complete geographic coverage across all 15 Liberian counties."
  }
];

const milestones = [
  { year: "2023", title: "Platform Launch", description: "LiJOBS officially launched as the national jobs observatory" },
  { year: "2023", title: "County Integration", description: "All 15 counties connected to the central system" },
  { year: "2024", title: "Employer Portal", description: "Self-service portal launched for employer job reporting" },
  { year: "2024", title: "Mobile App", description: "Enumerator mobile app deployed for field data collection" },
  { year: "2025", title: "AI Analytics", description: "Advanced analytics and forecasting capabilities added" }
];

const partners = [
  { name: "Ministry of Labor", logo: ministryOfLaborLogo },
  { name: "Government of Liberia", logo: sealOfLiberia }
];

export default function About() {
  return (
    <div className="min-h-screen" data-testid="about-page">
      <Header />
      <main className="pt-24">
        <section className="relative py-20 bg-primary text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <BackButton />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Badge variant="secondary" className="mb-4">About LiJOBS</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-about-title">
                Liberia Jobs Observatory System
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                The official National Job Creation Data Platform providing real-time, 
                trustworthy, and privacy-safe employment statistics for the Republic of Liberia.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  To provide the Government of Liberia and its citizens with accurate, 
                  real-time employment data that enables evidence-based policy making, 
                  tracks job creation progress, and supports economic development initiatives 
                  across all sectors of the economy.
                </p>
                <ul className="space-y-3">
                  {["Track employment spells across all sectors", "Verify job creation claims with data", "Enable privacy-safe statistical reporting", "Support county-level decision making"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-8 h-8 text-secondary" />
                  <h2 className="text-3xl font-bold">Our Vision</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  To become the most trusted and comprehensive employment data platform 
                  in West Africa, setting the standard for transparent, accurate, and 
                  accessible national job creation statistics.
                </p>
                <Card className="border-secondary/30 bg-secondary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="w-12 h-12 text-secondary" />
                      <div>
                        <p className="text-2xl font-bold">773,000+</p>
                        <p className="text-muted-foreground">Employment spells tracked</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do at LiJOBS
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Platform Milestones</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Key achievements in our journey to transform employment data in Liberia
              </p>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border hidden md:block" />
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`flex items-center gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <Card>
                        <CardContent className="p-4">
                          <Badge variant="outline" className="mb-2">{milestone.year}</Badge>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-primary border-4 border-background z-10 hidden md:block" />
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Working together to build Liberia's employment data infrastructure
              </p>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-8">
              <div className="flex items-center gap-4 p-6 bg-background rounded-lg border">
                <div className="w-16 h-16 rounded-full bg-white overflow-hidden flex items-center justify-center">
                  <img src={ministryOfLaborLogo} alt="Ministry of Labor" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <Landmark className="w-5 h-5 text-muted-foreground mb-1" />
                  <p className="font-semibold">Ministry of Labor</p>
                  <p className="text-sm text-muted-foreground">Republic of Liberia</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-background rounded-lg border">
                <div className="w-16 h-16 rounded-full bg-white overflow-hidden flex items-center justify-center">
                  <img src={sealOfLiberia} alt="Seal of Liberia" className="w-full h-full object-cover" />
                </div>
                <div>
                  <Building2 className="w-5 h-5 text-muted-foreground mb-1" />
                  <p className="font-semibold">Government of Liberia</p>
                  <p className="text-sm text-muted-foreground">Executive Branch</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Explore the Data?</h2>
            <p className="text-white/80 mb-8 text-lg">
              Access real-time employment statistics and contribute to Liberia's job creation tracking.
            </p>
            <div className="flex items-center justify-center flex-wrap gap-4">
              <Link href="/data">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-explore-portal">
                  Explore Data Portal
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white" data-testid="button-register-cta">
                  Register as Employer
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
