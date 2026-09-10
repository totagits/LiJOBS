# LiJOBS - Liberia Jobs Observatory System
### Republic of Liberia | National Job Creation Data Platform

[![Deploy LiJOBS to GitHub Pages](https://github.com/totagits/LiJOBS/actions/workflows/deploy.yml/badge.svg)](https://github.com/totagits/LiJOBS/actions/workflows/deploy.yml)
[![Live Online Access](https://img.shields.io/badge/Live%20Online%20Platform-https%3A%2F%2Ftotagits.github.io%2FLiJOBS%2F-blue?style=for-the-badge&logo=github)](https://totagits.github.io/LiJOBS/)

---

## 🌐 Live Online Access
The application is deployed and available for online access at:
**[https://totagits.github.io/LiJOBS/](https://totagits.github.io/LiJOBS/)**

---

## 🇱🇷 Overview

**LiJOBS (Liberia Jobs Observatory System)** is a national-scale, enterprise platform developed for the Government of Liberia and its stakeholders. It provides real-time, trustworthy, and privacy-safe job creation statistics by tracking time-bound "employment spells" across all 15 Liberian counties and across all economic sectors (public, private, NGO/donor, informal, seasonal).

### Key Pillars
1. **National Jobs Observatory**: Real-time tracking, verification workflow, and trust scoring of employment spells.
2. **Comprehensive Labour Exchange**: Vacancy postings, candidate matching, and employer application pipelines.
3. **15-County Coverage**: Montserrado, Nimba, Bong, Grand Bassa, Margibi, Lofa, Maryland, Sinoe, Grand Gedeh, Grand Cape Mount, Bomi, Rivercess, Grand Kru, River Gee, and Gbarpolu.
4. **Labour Market Indicators**: Advanced dashboards with unemployment, youth labor force participation, underemployment, and gender metrics.
5. **Occupational Economics**: Wage breakdowns by ISCO codes, skills gap analysis, and employment trend projections.
6. **Course Catalog & Skills Training**: Vocational training accreditation, enrollment, and certification.
7. **Citizen Grievance & Workplace Safety**: Transparent reporting channels for workplace disputes and safety compliance.

---

## 🏗️ Technical Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Radix UI primitives, Lucide Icons, Recharts, Wouter routing with SPA fallback.
- **Backend**: Node.js, Express.js 5, TypeScript, Drizzle ORM, PostgreSQL.
- **Deployment**: 
  - **GitHub Pages**: Automated CI/CD via GitHub Actions (`.github/workflows/deploy.yml`) with offline/demo data fallback for client-side exploration.
  - **Server / Cloud**: Docker / Google Cloud Run container deployment ready.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Access the application locally at `http://localhost:5000`.

### 3. Build Client & Server
```bash
npm run build
```

### 4. Build for GitHub Pages
```bash
npm run build:pages
```

---

## 🚢 Continuous Deployment
Pushes to the `main` branch automatically trigger the GitHub Actions workflow to build and deploy the latest version directly to GitHub Pages at **`https://totagits.github.io/LiJOBS/`**.

---

© 2026 Republic of Liberia — Ministry of Labour / Liberia Jobs Observatory Secretariat.
