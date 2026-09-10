import { lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { TrustBar } from "@/components/TrustBar";
import { QuickAccessSection } from "@/components/QuickAccessSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";

const Hero = lazy(() => import("@/components/Hero").then(m => ({ default: m.Hero })));
const StatsSection = lazy(() => import("@/components/StatsSection").then(m => ({ default: m.StatsSection })));
const LabourMarketHighlights = lazy(() => import("@/components/LabourMarketHighlights").then(m => ({ default: m.LabourMarketHighlights })));
const ChartsSection = lazy(() => import("@/components/ChartsSection").then(m => ({ default: m.ChartsSection })));
const CountyMap = lazy(() => import("@/components/CountyMap").then(m => ({ default: m.CountyMap })));

export default function Home() {
  return (
    <div className="min-h-screen" data-testid="home-page">
      <Header />
      <main>
        <Suspense fallback={<SectionLoadingSpinner />}>
          <Hero />
        </Suspense>
        <TrustBar />
        <Suspense fallback={<SectionLoadingSpinner />}>
          <StatsSection />
        </Suspense>
        <Suspense fallback={<SectionLoadingSpinner />}>
          <LabourMarketHighlights />
        </Suspense>
        <QuickAccessSection />
        <Suspense fallback={<SectionLoadingSpinner />}>
          <ChartsSection />
        </Suspense>
        <Suspense fallback={<SectionLoadingSpinner />}>
          <CountyMap />
        </Suspense>
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
