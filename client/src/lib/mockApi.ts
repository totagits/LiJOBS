// Comprehensive Mock API data provider for GitHub Pages static deployment
// Accurately matches shared/schema.ts types and endpoints

import type { NationalStat, CountyData, MonthlyData, SectorData } from "@shared/schema";

export const MOCK_STATS: NationalStat[] = [
  {
    id: "total-jobs",
    label: "Total Jobs Tracked",
    value: 49770,
    change: 4.8,
    changeLabel: "employment spells",
    icon: "Briefcase",
    color: "text-blue-500",
  },
  {
    id: "employers",
    label: "Registered Employers",
    value: 1942,
    change: 3.2,
    changeLabel: "organizations",
    icon: "Building2",
    color: "text-emerald-500",
  },
  {
    id: "verification-rate",
    label: "Verification Rate",
    value: 87,
    suffix: "%",
    change: 5.4,
    changeLabel: "trust verified",
    icon: "BadgeCheck",
    color: "text-amber-500",
  },
  {
    id: "counties",
    label: "Counties Covered",
    value: 15,
    change: 0,
    changeLabel: "nationwide coverage",
    icon: "MapPin",
    color: "text-purple-500",
  },
  {
    id: "vacancies",
    label: "Job Postings",
    value: 412,
    change: 14.5,
    changeLabel: "active vacancies",
    icon: "FileText",
    color: "text-indigo-500",
  },
  {
    id: "job-seekers",
    label: "Job Seekers",
    value: 14820,
    change: 9.1,
    changeLabel: "looking for work",
    icon: "UserSearch",
    color: "text-orange-500",
  },
];

export const MOCK_COUNTIES: CountyData[] = [
  { id: "montserrado", name: "Montserrado", jobs: 18450, employers: 620, growth: 5.2, color: "bg-blue-500", population: 1118241 },
  { id: "nimba", name: "Nimba", jobs: 7200, employers: 245, growth: 4.1, color: "bg-emerald-500", population: 462026 },
  { id: "bong", name: "Bong", jobs: 4950, employers: 180, growth: 3.8, color: "bg-amber-500", population: 333481 },
  { id: "lofa", name: "Lofa", jobs: 2900, employers: 115, growth: 2.9, color: "bg-violet-500", population: 276863 },
  { id: "grand-bassa", name: "Grand Bassa", jobs: 3820, employers: 140, growth: 3.5, color: "bg-rose-500", population: 221225 },
  { id: "margibi", name: "Margibi", jobs: 3600, employers: 135, growth: 4.0, color: "bg-cyan-500", population: 209923 },
  { id: "grand-cape-mount", name: "Grand Cape Mount", jobs: 1650, employers: 72, growth: 2.4, color: "bg-orange-500", population: 127076 },
  { id: "bomi", name: "Bomi", jobs: 1100, employers: 54, growth: 2.1, color: "bg-indigo-500", population: 84119 },
  { id: "grand-gedeh", name: "Grand Gedeh", jobs: 1310, employers: 58, growth: 1.8, color: "bg-teal-500", population: 125258 },
  { id: "sinoe", name: "Sinoe", jobs: 1420, employers: 62, growth: 2.0, color: "bg-pink-500", population: 102391 },
  { id: "river-cess", name: "River Cess", jobs: 680, employers: 32, growth: 1.2, color: "bg-lime-500", population: 71509 },
  { id: "gbarpolu", name: "Gbarpolu", jobs: 710, employers: 35, growth: 1.5, color: "bg-sky-500", population: 83758 },
  { id: "maryland", name: "Maryland", jobs: 1850, employers: 78, growth: 2.7, color: "bg-fuchsia-500", population: 135938 },
  { id: "grand-kru", name: "Grand Kru", jobs: 540, employers: 28, growth: 1.1, color: "bg-yellow-500", population: 57913 },
  { id: "river-gee", name: "River Gee", jobs: 590, employers: 30, growth: 1.3, color: "bg-red-500", population: 66789 },
];

export const MOCK_MONTHLY_DATA: MonthlyData[] = [
  { month: "Jan", jobs: 42100, formal: 25800, informal: 16300 },
  { month: "Feb", jobs: 43500, formal: 26400, informal: 17100 },
  { month: "Mar", jobs: 44900, formal: 27100, informal: 17800 },
  { month: "Apr", jobs: 46200, formal: 27900, informal: 18300 },
  { month: "May", jobs: 47800, formal: 28700, informal: 19100 },
  { month: "Jun", jobs: 48900, formal: 29300, informal: 19600 },
  { month: "Jul", jobs: 49770, formal: 29800, informal: 19970 },
];

export const MOCK_SECTORS: SectorData[] = [
  { sector: "private", jobs: 27150, postings: 215, color: "#3b82f6" },
  { sector: "public", jobs: 15200, postings: 85, color: "#8b5cf6" },
  { sector: "ngo", jobs: 7420, postings: 48, color: "#06b6d4" },
  { sector: "informal", jobs: 19970, postings: 32, color: "#f59e0b" },
  { sector: "seasonal", jobs: 8400, postings: 32, color: "#22c55e" },
];

export const MOCK_LABOUR_INDICATORS = [
  {
    id: 1,
    year: 2026,
    quarter: 1,
    unemploymentRate: 11.4,
    employmentToPopRatio: 55.3,
    labourForceParticipation: 62.4,
    youthUnemploymentRate: 16.8,
    femaleLabourParticipation: 58.2,
    informalEmploymentRate: 72.1,
    totalLabourForce: 1950000,
    totalEmployed: 1727700,
    totalUnemployed: 222300,
    source: "Liberia Jobs Observatory System (LiJOBS)",
  },
  {
    id: 2,
    year: 2025,
    quarter: 4,
    unemploymentRate: 11.8,
    employmentToPopRatio: 54.8,
    labourForceParticipation: 62.1,
    youthUnemploymentRate: 17.3,
    femaleLabourParticipation: 57.6,
    informalEmploymentRate: 73.0,
    totalLabourForce: 1920000,
    totalEmployed: 1693440,
    totalUnemployed: 226560,
    source: "Liberia Jobs Observatory System (LiJOBS)",
  },
  {
    id: 3,
    year: 2025,
    quarter: 3,
    unemploymentRate: 12.2,
    employmentToPopRatio: 54.2,
    labourForceParticipation: 61.8,
    youthUnemploymentRate: 17.9,
    femaleLabourParticipation: 57.1,
    informalEmploymentRate: 73.8,
    totalLabourForce: 1890000,
    totalEmployed: 1659420,
    totalUnemployed: 230580,
    source: "Liberia Jobs Observatory System (LiJOBS)",
  }
];

export const MOCK_DATA: Record<string, any> = {
  "/api/access-code/status": { granted: true },
  "/api/stats": MOCK_STATS,
  "/api/counties": MOCK_COUNTIES,
  "/api/monthly-data": MOCK_MONTHLY_DATA,
  "/api/sectors": MOCK_SECTORS,
  "/api/labour-indicators": MOCK_LABOUR_INDICATORS,
  "/api/auth/user": {
    id: "demo-admin-id",
    username: "director",
    role: "admin",
    fullName: "Hon. Samuel Kollie",
    email: "director@lijobs.gov.lr",
    organization: "Ministry of Labour / LiJOBS National Secretariat",
    county: "Montserrado",
    createdAt: new Date().toISOString()
  },
  "/api/auth/me": {
    user: {
      id: "demo-admin-id",
      email: "director@lijobs.gov.lr",
      firstName: "Hon. Samuel",
      lastName: "Kollie",
      role: "admin",
      sector: "Public Administration",
      county: "Montserrado",
      organizationName: "Ministry of Labour",
      organizationType: "ministry",
      phone: "+231 77 555 1234",
      isActive: true,
      isDemo: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      lastLogin: new Date().toISOString()
    }
  },
  "/api/auth/login": {
    user: {
      id: "demo-admin-id",
      email: "director@lijobs.gov.lr",
      firstName: "Hon. Samuel",
      lastName: "Kollie",
      role: "admin",
      sector: "Public Administration",
      county: "Montserrado",
      organizationName: "Ministry of Labour",
      organizationType: "ministry",
      phone: "+231 77 555 1234",
      isActive: true,
      isDemo: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      lastLogin: new Date().toISOString()
    }
  },
  "/api/observatory/stats": {
    totalJobs: 49770,
    activeSpells: 35840,
    verifiedSpells: 31250,
    employersReporting: 1942,
    formalJobs: 29800,
    informalJobs: 19970,
    publicSector: 15200,
    privateSector: 27150,
    ngoDonor: 7420,
    verifiedRate: 87.4,
    monthlyGrowth: 4.8,
    lastUpdated: new Date().toISOString(),
    breakdownBySector: [
      { sector: "Agriculture & Agro-processing", count: 14200, percentage: 28.5 },
      { sector: "Mining & Extractives", count: 8350, percentage: 16.8 },
      { sector: "Commerce, Retail & Trade", count: 7890, percentage: 15.9 },
      { sector: "Education & Health Services", count: 6720, percentage: 13.5 },
      { sector: "Public Administration & Governance", count: 5410, percentage: 10.9 },
      { sector: "Construction & Infrastructure", count: 4200, percentage: 8.4 },
      { sector: "ICT & Telecommunications", count: 3000, percentage: 6.0 }
    ],
    spellsByCounty: MOCK_COUNTIES.map(c => ({ county: c.name, count: c.jobs, verifiedRate: 88 }))
  },
  "/api/county-indicators": MOCK_COUNTIES.map(c => ({
    county: c.name,
    unemploymentRate: 11.4,
    youthUnemploymentRate: 16.8,
    informalRate: 68.2,
    labourForce: Math.round((c.population || 100000) * 0.58),
    employmentPopulationRatio: 52.4,
    activeVacancies: Math.round(c.jobs * 0.08)
  })),
  "/api/labour-market-indicators": {
    nationalUnemploymentRate: 11.4,
    youthUnemploymentRate: 16.8,
    femaleUnemploymentRate: 12.9,
    maleUnemploymentRate: 10.1,
    labourForceParticipation: 62.4,
    employmentToPopulationRatio: 55.3,
    informalEmploymentRatio: 72.1,
    totalWorkingAgePopulation: 3120000,
    totalEmployed: 1725360,
    quarterlyTrend: [
      { quarter: "2025-Q1", employment: 1610000, unemployment: 12.8 },
      { quarter: "2025-Q2", employment: 1645000, unemployment: 12.3 },
      { quarter: "2025-Q3", employment: 1680000, unemployment: 11.9 },
      { quarter: "2025-Q4", employment: 1710000, unemployment: 11.6 },
      { quarter: "2026-Q1", employment: 1725360, unemployment: 11.4 }
    ]
  },
  "/api/vacancies": [
    {
      id: "vac-001",
      title: "Senior Agronomist & Extension Officer",
      employerName: "Liberia Agricultural Produce Consortium",
      sector: "Agriculture & Agro-processing",
      county: "Nimba",
      location: "Ganta / Sanniquellie",
      contractType: "Permanent",
      positions: 5,
      salaryMin: 650,
      salaryMax: 950,
      currency: "USD",
      status: "open",
      description: "Oversee smallholder farmer cooperatives, implement climate-smart irrigation, and train extension agents across Nimba County.",
      requirements: "BSc in Agronomy or Agricultural Science, 3+ years experience with tropical cash crops.",
      closingDate: "2026-10-31T23:59:59Z",
      createdAt: "2026-08-15T10:00:00Z"
    },
    {
      id: "vac-002",
      title: "Health Information Systems Specialist",
      employerName: "Ministry of Health - National Digital Unit",
      sector: "Healthcare & Public Health",
      county: "Montserrado",
      location: "Monrovia",
      contractType: "Contract (2 Years)",
      positions: 3,
      salaryMin: 800,
      salaryMax: 1200,
      currency: "USD",
      status: "open",
      description: "Manage electronic medical records, DHIS2 health tracker data pipelines, and county healthcare analytics dashboards.",
      requirements: "Degree in Computer Science, Public Health Informatics, or Data Systems. Proven SQL and DHIS2 skills.",
      closingDate: "2026-10-15T23:59:59Z",
      createdAt: "2026-08-20T11:00:00Z"
    },
    {
      id: "vac-003",
      title: "Heavy Equipment Maintenance Engineer",
      employerName: "Western Cluster Mining Operations",
      sector: "Mining & Extractives",
      county: "Bomi",
      location: "Tubmanburg",
      contractType: "Permanent",
      positions: 8,
      salaryMin: 900,
      salaryMax: 1400,
      currency: "USD",
      status: "open",
      description: "Maintain Caterpillar haul trucks, excavators, and crushing plant electrical-mechanical systems in mining corridor.",
      requirements: "Mechanical Engineering diploma/degree, certified heavy equipment maintenance qualifications.",
      closingDate: "2026-11-15T23:59:59Z",
      createdAt: "2026-08-25T09:30:00Z"
    },
    {
      id: "vac-004",
      title: "Port Logistics & Cargo Supervisor",
      employerName: "National Port Authority of Liberia",
      sector: "Transport & Logistics",
      county: "Grand Bassa",
      location: "Port of Buchanan",
      contractType: "Permanent",
      positions: 4,
      salaryMin: 550,
      salaryMax: 850,
      currency: "USD",
      status: "open",
      description: "Coordinate vessel discharge operations, container yard logistics, and customs documentation compliance.",
      requirements: "Diploma in Supply Chain or Logistics Management, minimum 2 years maritime port experience.",
      closingDate: "2026-10-25T23:59:59Z",
      createdAt: "2026-09-01T08:00:00Z"
    }
  ],
  "/api/courses": [
    {
      id: "crs-001",
      title: "Renewable Solar PV Installation & Grid Maintenance",
      providerName: "Booker Washington Institute (BWI)",
      category: "Technical & Vocational",
      durationWeeks: 12,
      cost: 0,
      currency: "USD",
      county: "Margibi",
      level: "Intermediate",
      certified: true,
      description: "Hands-on training in solar panel sizing, inverter installation, lithium battery storage systems, and safety protocols.",
      enrolledCount: 48,
      rating: 4.8
    },
    {
      id: "crs-002",
      title: "Modern Commercial Poultry & Livestock Husbandry",
      providerName: "Central Agricultural Research Institute (CARI)",
      category: "Agriculture",
      durationWeeks: 8,
      cost: 0,
      currency: "USD",
      county: "Bong",
      level: "Beginner to Intermediate",
      certified: true,
      description: "Commercial broiler and layer management, biosecurity, feed formulation, and value addition for local markets.",
      enrolledCount: 65,
      rating: 4.9
    }
  ],
  "/api/training-providers": [
    { id: "tp-1", name: "Booker Washington Institute (BWI)", location: "Kakata, Margibi County", accredited: true, studentCapacity: 1200, coursesOffered: 18 },
    { id: "tp-2", name: "Monrovia Vocational Training Center (MVTC)", location: "Paynesville, Montserrado County", accredited: true, studentCapacity: 850, coursesOffered: 14 }
  ],
  "/api/pec-centers": MOCK_COUNTIES.map((c, i) => ({
    id: `pec-${i + 1}`,
    name: `${c.name} Public Employment Centre`,
    county: c.name,
    city: c.name,
    address: `Ministry of Labour County Service Centre, ${c.name}`,
    phone: `+231 77 000 ${1000 + i}`,
    email: `pec.${c.id}@mol.gov.lr`,
    status: "Operational",
    staffCount: 4 + (i % 3)
  })),
  "/api/tenders": [
    {
      id: "tdr-001",
      title: "Supply and Installation of Solar Power Equipment for 15 County PECs",
      issuingAgency: "Ministry of Labour / PAYEI Program",
      category: "Renewable Energy & Infrastructure",
      budgetEstimated: 125000,
      currency: "USD",
      closingDate: "2026-10-30T17:00:00Z",
      status: "active",
      description: "Procurement of 10kVA solar hybrid systems, batteries, and installation services across 15 Public Employment Centres nationwide."
    }
  ],
  "/api/knowledge-base": [
    {
      id: "kb-001",
      title: "Decent Work Act 2015 - Complete Republic of Liberia Statute",
      category: "Labour Legislation",
      publishedYear: 2015,
      downloadUrl: "#",
      summary: "Official statutory framework governing minimum wage, employment contracts, occupational safety, and labor dispute resolution in Liberia."
    }
  ],
  "/api/workplace-safety/stats": {
    totalIncidentsReported: 42,
    resolvedIncidents: 38,
    pendingInvestigation: 4,
    fatalitiesCount: 0,
    complianceInspectionCount: 312,
    bySector: [
      { sector: "Mining & Extractives", incidents: 16 },
      { sector: "Construction", incidents: 12 },
      { sector: "Agriculture & Rubber Concessions", incidents: 9 },
      { sector: "Manufacturing & Commerce", incidents: 5 }
    ]
  },
  "/api/economic-indicators": {
    cpiIndex: 124.8,
    monthlyInflationRate: 0.6,
    annualInflationRate: 7.2,
    averageMonthlyWageUSD: 245,
    minimumWageHourlyUSD: 0.85,
    basketItemsCount: 20,
    costOfLivingIndex: [
      { county: "Montserrado", monthlyCostUSD: 285, rank: 1 },
      { county: "Nimba", monthlyCostUSD: 220, rank: 2 },
      { county: "Grand Bassa", monthlyCostUSD: 215, rank: 3 },
      { county: "Margibi", monthlyCostUSD: 210, rank: 4 },
      { county: "Bong", monthlyCostUSD: 195, rank: 5 }
    ]
  },
  "/api/grievances": [
    {
      id: "grv-101",
      trackingCode: "GRV-2026-089",
      category: "Wage Dispute",
      county: "Montserrado",
      status: "Under Investigation",
      filingDate: "2026-08-28",
      resolutionExpected: "2026-09-18"
    }
  ]
};

// Interceptor helper to fulfill API requests
export function getMockResponse(url: string, method = "GET"): any | null {
  const cleanUrl = url.split("?")[0];
  
  // Exact match
  if (cleanUrl in MOCK_DATA) {
    return MOCK_DATA[cleanUrl];
  }

  // Prefix matches
  for (const [key, data] of Object.entries(MOCK_DATA)) {
    if (cleanUrl.startsWith(key) && key !== "/") {
      return data;
    }
  }

  // Handle generic mutations
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    return { success: true, message: "Action recorded successfully (Static Demo Mode)", id: `mock-${Date.now()}` };
  }

  if (method === "DELETE") {
    return { success: true, message: "Item removed (Static Demo Mode)" };
  }

  // Default to empty array for collection endpoints, or empty object
  if (cleanUrl.endsWith("s") || cleanUrl.includes("list")) {
    return [];
  }

  return { success: true };
}
