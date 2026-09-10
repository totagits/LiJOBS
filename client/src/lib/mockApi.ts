// Mock API data provider for GitHub Pages static deployment
// Provides realistic Liberian labor market data for all 15 counties

export const LIBERIA_COUNTIES = [
  { id: "montserrado", name: "Montserrado", capital: "Monrovia", region: "Greater Monrovia", population: 1118241, activeJobs: 18450, unemploymentRate: 8.5, pecsCount: 3, verifiedRate: 92 },
  { id: "nimba", name: "Nimba", capital: "Sanniquellie", region: "North-Central", population: 462026, activeJobs: 7200, unemploymentRate: 11.2, pecsCount: 2, verifiedRate: 88 },
  { id: "bong", name: "Bong", capital: "Gbarnga", region: "Central", population: 333481, activeJobs: 4950, unemploymentRate: 12.1, pecsCount: 1, verifiedRate: 85 },
  { id: "grand_bassa", name: "Grand Bassa", capital: "Buchanan", region: "South-Central", population: 221225, activeJobs: 3820, unemploymentRate: 10.4, pecsCount: 1, verifiedRate: 89 },
  { id: "margibi", name: "Margibi", capital: "Kakata", region: "Central", population: 209923, activeJobs: 3600, unemploymentRate: 9.8, pecsCount: 1, verifiedRate: 86 },
  { id: "lofa", name: "Lofa", capital: "Voinjama", region: "North", population: 276863, activeJobs: 2900, unemploymentRate: 13.5, pecsCount: 1, verifiedRate: 81 },
  { id: "maryland", name: "Maryland", capital: "Harper", region: "South-East", population: 135938, activeJobs: 1850, unemploymentRate: 14.2, pecsCount: 1, verifiedRate: 83 },
  { id: "sinoe", name: "Sinoe", capital: "Greenville", region: "South-East", population: 102391, activeJobs: 1420, unemploymentRate: 13.8, pecsCount: 1, verifiedRate: 84 },
  { id: "grand_gedeh", name: "Grand Gedeh", capital: "Zwedru", region: "East", population: 125258, activeJobs: 1310, unemploymentRate: 14.5, pecsCount: 1, verifiedRate: 80 },
  { id: "grand_cape_mount", name: "Grand Cape Mount", capital: "Robertsport", region: "Western", population: 127076, activeJobs: 1650, unemploymentRate: 12.9, pecsCount: 1, verifiedRate: 87 },
  { id: "bomi", name: "Bomi", capital: "Tubmanburg", region: "Western", population: 84119, activeJobs: 1100, unemploymentRate: 13.1, pecsCount: 1, verifiedRate: 82 },
  { id: "rivercess", name: "Rivercess", capital: "Cestos City", region: "South-Central", population: 71509, activeJobs: 680, unemploymentRate: 15.2, pecsCount: 1, verifiedRate: 79 },
  { id: "grand_kru", name: "Grand Kru", capital: "Barclayville", region: "South-East", population: 57913, activeJobs: 540, unemploymentRate: 16.0, pecsCount: 1, verifiedRate: 78 },
  { id: "river_gee", name: "River Gee", capital: "Fish Town", region: "South-East", population: 66789, activeJobs: 590, unemploymentRate: 15.5, pecsCount: 1, verifiedRate: 77 },
  { id: "gbarpolu", name: "Gbarpolu", capital: "Bopolu", region: "Western", population: 83758, activeJobs: 710, unemploymentRate: 14.8, pecsCount: 1, verifiedRate: 81 }
];

export const MOCK_DATA: Record<string, any> = {
  "/api/access-code/status": { granted: true },
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
    spellsByCounty: LIBERIA_COUNTIES.map(c => ({ county: c.name, count: c.activeJobs, verifiedRate: c.verifiedRate }))
  },
  "/api/counties": LIBERIA_COUNTIES,
  "/api/county-indicators": LIBERIA_COUNTIES.map(c => ({
    county: c.name,
    unemploymentRate: c.unemploymentRate,
    youthUnemploymentRate: (c.unemploymentRate * 1.45).toFixed(1),
    informalRate: 68.2,
    labourForce: Math.round(c.population * 0.58),
    employmentPopulationRatio: 52.4,
    activeVacancies: Math.round(c.activeJobs * 0.08)
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
    },
    {
      id: "vac-005",
      title: "Full-Stack Web & Mobile Developer",
      employerName: "Liberia Telecommunications Corporation (LTC)",
      sector: "ICT & Telecommunications",
      county: "Montserrado",
      location: "Monrovia",
      contractType: "Permanent",
      positions: 6,
      salaryMin: 750,
      salaryMax: 1300,
      currency: "USD",
      status: "open",
      description: "Develop citizen digital portal services, mobile payment gateways, and API integrations for e-governance systems.",
      requirements: "Proficiency in React/TypeScript, Node.js/Express, PostgreSQL, and RESTful APIs.",
      closingDate: "2026-11-01T23:59:59Z",
      createdAt: "2026-09-05T14:00:00Z"
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
    },
    {
      id: "crs-003",
      title: "Full-Stack Web Development & Cloud Deployment",
      providerName: "Liberia Digital Skills Academy",
      category: "Information Technology",
      durationWeeks: 16,
      cost: 0,
      currency: "USD",
      county: "Montserrado",
      level: "Intermediate",
      certified: true,
      description: "Modern web architecture using React, Node.js, TypeScript, and cloud deployment pipelines for Liberian digital platforms.",
      enrolledCount: 120,
      rating: 4.9
    }
  ],
  "/api/training-providers": [
    { id: "tp-1", name: "Booker Washington Institute (BWI)", location: "Kakata, Margibi County", accredited: true, studentCapacity: 1200, coursesOffered: 18 },
    { id: "tp-2", name: "Monrovia Vocational Training Center (MVTC)", location: "Paynesville, Montserrado County", accredited: true, studentCapacity: 850, coursesOffered: 14 },
    { id: "tp-3", name: "Stella Maris Polytechnic University", location: "Monrovia, Montserrado County", accredited: true, studentCapacity: 2500, coursesOffered: 32 },
    { id: "tp-4", name: "Nimba County University College", location: "Sanniquellie, Nimba County", accredited: true, studentCapacity: 900, coursesOffered: 12 }
  ],
  "/api/pec-centers": LIBERIA_COUNTIES.map((c, i) => ({
    id: `pec-${i + 1}`,
    name: `${c.capital} Public Employment Centre`,
    county: c.name,
    city: c.capital,
    address: `Ministry of Labour County Service Centre, ${c.capital}`,
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
    },
    {
      id: "tdr-002",
      title: "Digital Labor Market Survey & Biometric Enumeration Hardware",
      issuingAgency: "Liberia Jobs Observatory Secretariat",
      category: "IT Hardware & Equipment",
      budgetEstimated: 78000,
      currency: "USD",
      closingDate: "2026-10-20T17:00:00Z",
      status: "active",
      description: "Supply of rugged tablets, biometric fingerprint readers, and portable solar power banks for county enumerators."
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
    },
    {
      id: "kb-002",
      title: "National Labour Force & Employment Observatory Survey Report",
      category: "Statistical Reports",
      publishedYear: 2025,
      downloadUrl: "#",
      summary: "Comprehensive statistical analysis of employment spells, youth labor force dynamics, and county-by-county wage variations."
    },
    {
      id: "kb-003",
      title: "Guidelines on Employment Spell Verification and Trust Scoring",
      category: "Observatory Methodology",
      publishedYear: 2026,
      downloadUrl: "#",
      summary: "Technical standard operating procedure for enumerator verification of public, private, and informal sector employment spells."
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
  if (MOCK_DATA[cleanUrl]) {
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

  return { success: true, data: [] };
}
