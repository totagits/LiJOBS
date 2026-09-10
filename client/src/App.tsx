import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { AccessCodeGate } from "@/components/AccessCodeGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const DataPortal = lazy(() => import("@/pages/DataPortal"));
const Reports = lazy(() => import("@/pages/Reports"));
const Resources = lazy(() => import("@/pages/Resources"));
const Contact = lazy(() => import("@/pages/Contact"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ReportJobs = lazy(() => import("@/pages/ReportJobs"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const TrainingCenter = lazy(() => import("@/pages/TrainingCenter"));
const VideoManagement = lazy(() => import("@/pages/VideoManagement"));
const AdminBaselineData = lazy(() => import("@/pages/AdminBaselineData"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminVerifications = lazy(() => import("@/pages/AdminVerifications"));
const NationalStatistics = lazy(() => import("@/pages/NationalStatistics"));
const CountyData = lazy(() => import("@/pages/CountyData"));
const SectorAnalysis = lazy(() => import("@/pages/SectorAnalysis"));
const Observatory = lazy(() => import("@/pages/Observatory"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const EmployerApplications = lazy(() => import("@/pages/EmployerApplications"));
const EmployerVacancies = lazy(() => import("@/pages/EmployerVacancies"));
const EmployerVacancyForm = lazy(() => import("@/pages/EmployerVacancyForm"));
const JobSeekers = lazy(() => import("@/pages/JobSeekers"));
const DataPortalPostings = lazy(() => import("@/pages/DataPortalPostings"));
const DataPortalSeekers = lazy(() => import("@/pages/DataPortalSeekers"));
const JobMatching = lazy(() => import("@/pages/JobMatching"));
const TrainingProviders = lazy(() => import("@/pages/TrainingProviders"));
const CourseCatalog = lazy(() => import("@/pages/CourseCatalog"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const PECManagement = lazy(() => import("@/pages/PECManagement"));
const BulkUpload = lazy(() => import("@/pages/BulkUpload"));
const LabourIndicators = lazy(() => import("@/pages/LabourIndicators"));
const GrievanceSystem = lazy(() => import("@/pages/GrievanceSystem"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const WorkplaceSafety = lazy(() => import("@/pages/WorkplaceSafety"));
const EmployerTenders = lazy(() => import("@/pages/EmployerTenders"));
const EmployerTenderForm = lazy(() => import("@/pages/EmployerTenderForm"));
const Tenders = lazy(() => import("@/pages/Tenders"));
const TenderDetail = lazy(() => import("@/pages/TenderDetail"));
const VerificationDashboard = lazy(() => import("@/pages/VerificationDashboard"));
const DirectorDashboard = lazy(() => import("@/pages/DirectorDashboard"));
const EconomicIndicators = lazy(() => import("@/pages/EconomicIndicators"));
const PriceEntry = lazy(() => import("@/pages/PriceEntry"));
const OccupationalEconomics = lazy(() => import("@/pages/OccupationalEconomics"));
const StatisticalRigor = lazy(() => import("@/pages/StatisticalRigor"));
const DataHub = lazy(() => import("@/pages/DataHub"));
const Methodology = lazy(() => import("@/pages/Methodology"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AccessibilityWidget = lazy(() => import("@/components/AccessibilityWidget").then(m => ({ default: m.AccessibilityWidget })));
const AIAssistant = lazy(() => import("@/components/AIAssistant").then(m => ({ default: m.AIAssistant })));

function Router() {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/data" component={DataPortal} />
        <Route path="/data/national" component={NationalStatistics} />
        <Route path="/data/counties" component={CountyData} />
        <Route path="/data/sectors" component={SectorAnalysis} />
        <Route path="/data/postings" component={DataPortalPostings} />
        <Route path="/data/seekers" component={DataPortalSeekers} />
        <Route path="/job-matching" component={JobMatching} />
        <Route path="/reports" component={Reports} />
        <Route path="/resources" component={Resources} />
        <Route path="/contact" component={Contact} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/report-jobs" component={ReportJobs} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/training" component={TrainingCenter} />
        <Route path="/admin/videos" component={VideoManagement} />
        <Route path="/admin/baseline-data" component={AdminBaselineData} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/verifications" component={AdminVerifications} />
        <Route path="/observatory" component={Observatory} />
        <Route path="/employer/applications" component={EmployerApplications} />
        <Route path="/employer/vacancies" component={EmployerVacancies} />
        <Route path="/employer/vacancies/new" component={EmployerVacancyForm} />
        <Route path="/employer/vacancies/:id/edit" component={EmployerVacancyForm} />
        <Route path="/job-seekers" component={JobSeekers} />
        <Route path="/training-providers" component={TrainingProviders} />
        <Route path="/courses" component={CourseCatalog} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/pec-management" component={PECManagement} />
        <Route path="/bulk-upload" component={BulkUpload} />
        <Route path="/labour-indicators" component={LabourIndicators} />
        <Route path="/grievances" component={GrievanceSystem} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/workplace-safety" component={WorkplaceSafety} />
        <Route path="/employer/tenders" component={EmployerTenders} />
        <Route path="/employer/tenders/new" component={EmployerTenderForm} />
        <Route path="/employer/tenders/:id/edit" component={EmployerTenderForm} />
        <Route path="/tenders" component={Tenders} />
        <Route path="/tenders/:id" component={TenderDetail} />
        <Route path="/verification" component={VerificationDashboard} />
        <Route path="/director" component={DirectorDashboard} />
        <Route path="/economic-indicators" component={EconomicIndicators} />
        <Route path="/price-entry" component={PriceEntry} />
        <Route path="/occupational-economics" component={OccupationalEconomics} />
        <Route path="/statistical-rigor" component={StatisticalRigor} />
        <Route path="/data-hub" component={DataHub} />
        <Route path="/methodology" component={Methodology} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

function App() {
  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => {
        if (loader.parentNode) loader.remove();
      }, 400);
    }
  }, []);

  return (
    <WouterRouter base={base}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AccessCodeGate>
            <AuthProvider>
              <Toaster />
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
              <Suspense fallback={null}>
                <AccessibilityWidget />
              </Suspense>
              <Suspense fallback={null}>
                <AIAssistant />
              </Suspense>
            </AuthProvider>
          </AccessCodeGate>
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
