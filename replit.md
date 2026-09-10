# LiJOBS - Liberia Jobs Observatory System

## Overview
LiJOBS (Liberia Jobs Observatory System) is a national-scale, enterprise platform for the Government of Liberia. Its primary purpose is to provide real-time, trustworthy, and privacy-safe job creation statistics by tracking time-bound "employment spells" across all sectors (public, private, NGO, informal, seasonal). It serves as the official National Job Creation Data Platform, enabling tracking, verification, and reporting of employment data with complete geographic coverage across all 15 Liberian counties. Key capabilities include a Jobs Observatory for employment spell tracking and verification, a comprehensive Labour Exchange for job matching and applications, a Course Catalog & Learning System for skill development, and various GLMIS-surpassing features like a Grievance System, Labour Market Indicators, and a Knowledge Base.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with a custom Liberian flag-inspired color theme, using shadcn/ui component library built on Radix UI primitives.
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization.
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **API Design**: RESTful JSON APIs under `/api/*` prefix.
- **Build Process**: Custom esbuild configuration for server bundling.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod
- **Database**: PostgreSQL
- **Migrations**: Drizzle Kit

### Key Design Patterns
- **Monorepo Structure**: Client, server, and shared code in a single repository.
- **Type Sharing**: Common types defined in `/shared` and imported by both client and server.
- **Memory Storage Fallback**: For development before database integration.
- **Authentication**: Session-based with Express-session and PostgreSQL store, using bcrypt for password hashing. Role-based access control is implemented for admin, ministry, employer, and enumerator roles.

### Core Features
- **Jobs Observatory**: Tracks employment spells with start/end dates, ISCO-08 occupation codes, and ISIC Rev.4 industry codes. Includes a Trust Score System for employment records and a verification workflow. Provides observable statistics on employment.
- **Labour Exchange**: Enables employers to post vacancies and job seekers to apply. Includes an employer dashboard for application management.
- **Data Portal**: Allows browsing of job postings and job seekers with filtering capabilities.
- **Job Matching System**: A weighted scoring algorithm matches job seekers to vacancies based on skills, location, sector preference, and experience.
- **Reports & Exports**: Provides API endpoints to export various data types (employment spells, vacancies, employers, job-seekers, applications) as Excel/CSV.
- **Training Providers**: Management system for accredited training centers.
- **Course Catalog & Learning System**: Offers training courses with lessons, quizzes, and certification. Open enrollment is available.
- **PEC Management**: Manages Public Employment Centres across all 15 counties.
- **Bulk Upload**: Facilitates mass data import via Excel files for employment spells, employers, and vacancies.
- **Labour Market Indicators**: Comprehensive GLMIS-surpassing dashboard with 5 tabbed sections (Unemployment, Employment, Underemployment, Jobs, Job Seekers). Features county-level data for all 15 counties, combined bar+line charts, scatter plots by county, gender/urban-rural breakdown cards, sector pie charts, and CSV export. Uses `county_indicators` table for per-county data and `labour_market_indicators` for national-level time series.
- **Grievance & Complaint System**: Allows citizens to file and track complaints without authentication, with categories like wage disputes and discrimination.
- **Knowledge Base & Research Library**: A public repository for policy documents, research reports, and other publications.
- **Workplace Safety & Incident Reporting**: Enables public reporting of workplace incidents, with a safety dashboard for aggregate statistics.
- **Accessibility Widget**: A global component providing font size control, high contrast mode, and text-to-speech functionality.
- **AI Assistant Widget**: A conversational AI assistant floating widget (bottom-right) with voice call and text chat modes. Uses ElevenLabs API for natural human-like text-to-speech and speech-to-text via server endpoints (`/api/ai-assistant/tts`, `/api/ai-assistant/stt`). Features silence detection for automatic turn-taking, rate-limited endpoints (30 req/min per IP). **Powered by OpenAI** via Replit AI Integrations (`/api/ai-assistant/chat` endpoint) with live LiJOBS data context (vacancy counts, employer stats, recent job listings) injected into the system prompt for intelligent, contextual responses. Replaces the old keyword-matching system. Server module: `server/elevenlabs.ts`. Component: `client/src/components/AIAssistant.tsx`. DB tables: `conversations`, `messages`.
- **Economic Indicators**: Collects consumer price data (basket of 20 goods) by county/month, auto-calculates CPI, cost of living comparisons across counties, and wage vs. cost of living affordability analysis. Uses `price_entries` table. Data entry by ministry/enumerator staff at `/price-entry`, dashboard at `/economic-indicators`.
- **Occupational Economics**: Deep analytics at `/occupational-economics` with 5 tabs: (1) Wage by Occupation - average salaries broken down by ISCO code and county, (2) Occupation Demand Trends - tracking which occupations are growing/declining based on employment spell creation rates, (3) Skills Gap Analysis - comparing job seeker skills supply vs employer demand from vacancies, identifying training opportunities, (4) Employment Projections - linear trend projections for sectors and occupations, (5) Injury & Risk by Occupation - workplace safety incident rates by sector and county. Uses existing `employment_spells`, `vacancies`, `skills`, `person_skills`, and `workplace_incidents` tables. Seeded with realistic demo data across all 15 counties.
- **Statistical Rigor**: Comprehensive data quality and statistical methodology suite at `/statistical-rigor` with 5 tabs: (1) Automated Quality Checks - flags duplicate records using overlap detection (unique record counting), impossible dates, wage outliers via IQR method, and unusual employer headcounts, with data quality score. (2) Sampling Frameworks - Cochran's formula for finite population sample size calculation with proportional allocation across counties and sectors, minimum 30 per stratum. (3) Seasonal Adjustment - ratio-to-moving-average method with 13-month centered MA, normalized indices averaging to 1.0, raw vs adjusted time series charts. (4) Confidence Intervals - 95% CI for employment counts by county and wages by sector, with coefficient of variation reliability ratings (high/moderate/low). (5) Methodology Documentation - transparent calculation notes for all statistical outputs including formulas, data sources, and limitations. All computed from existing `employment_spells` and `employers` tables, no new schema required.

### Enterprise Database Schema (27 Tables)
Includes tables for reference data (districts, ISCO, ISIC, job sources), organization (employers, establishments), labour (persons, job_seeker_profiles, skills), PII vault for encrypted personal identities, jobs (vacancies, applications), observatory data (employment_spells, job_creation_events, baseline_data), and audit logs.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.

### UI/Component Libraries
- **Radix UI**: Accessible, unstyled component primitives.
- **shadcn/ui**: Pre-styled component library built on Radix.
- **Embla Carousel**: Carousel/slider functionality.
- **cmdk**: Command menu component.

### Development Tools
- **Drizzle Kit**: Database migration and schema management.
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment.

### Authentication
- **connect-pg-simple**: PostgreSQL session store for Express sessions.
- **bcrypt**: For password hashing.

### Additional Services
- **Nodemailer**: Email sending.
- **Multer**: File upload handling.
- **XLSX**: Excel file processing for bulk data uploads.
- **Stripe**: Payment processing.
- **OpenAI/Google Generative AI**: AI capabilities.
- **HeyGen API**: AI video generation with avatars and text-to-speech for training videos.