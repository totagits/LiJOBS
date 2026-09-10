import { db } from "./db";
import { users, employmentSpells, trainingVideos, labourMarketIndicators, countyIndicators, priceEntries, vacancies, skills, personSkills, persons, jobSeekerProfiles, workplaceIncidents } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEMO_PASSWORD = "Demo@2025";

// Export for use in routes.ts on startup
export async function initializeDemoData() {
  try {
    console.log("Checking/initializing demo accounts...");

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUsers = [
    // Admin
    {
      email: "demo_admin@test.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      sector: null,
      county: null,
      organizationName: "Ministry of Labor",
      organizationType: "government",
      phone: "+231-88-000-0001",
      isActive: true,
      isDemo: true,
    },
    // Ministry Verifier
    {
      email: "demo_ministry@test.com",
      password: hashedPassword,
      firstName: "James",
      lastName: "Johnson",
      role: "ministry",
      sector: null,
      county: "Montserrado",
      organizationName: "Ministry of Labor",
      organizationType: "government",
      phone: "+231-88-000-0002",
      isActive: true,
      isDemo: true,
    },
    // Private Sector Employer
    {
      email: "demo_private@test.com",
      password: hashedPassword,
      firstName: "Mary",
      lastName: "Williams",
      role: "employer",
      sector: "private",
      county: "Montserrado",
      organizationName: "Liberia Trading Co.",
      organizationType: "private_company",
      phone: "+231-88-000-0003",
      isActive: true,
      isDemo: true,
    },
    // Public Sector Employer
    {
      email: "demo_public@test.com",
      password: hashedPassword,
      firstName: "Thomas",
      lastName: "Brown",
      role: "employer",
      sector: "public",
      county: "Montserrado",
      organizationName: "Ministry of Finance",
      organizationType: "government",
      phone: "+231-88-000-0004",
      isActive: true,
      isDemo: true,
    },
    // NGO Employer
    {
      email: "demo_ngo@test.com",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Davis",
      role: "employer",
      sector: "ngo",
      county: "Montserrado",
      organizationName: "USAID Liberia",
      organizationType: "ngo",
      phone: "+231-88-000-0005",
      isActive: true,
      isDemo: true,
    },
    // Director of Statistics
    {
      email: "demo_director@test.com",
      password: hashedPassword,
      firstName: "Charles",
      lastName: "Weah",
      role: "director",
      sector: null,
      county: null,
      organizationName: "Ministry of Labor - Statistics Division",
      organizationType: "government",
      phone: "+231-88-000-0009",
      isActive: true,
      isDemo: true,
    },
    // County Enumerator - Montserrado
    {
      email: "demo_enumerator@test.com",
      password: hashedPassword,
      firstName: "Peter",
      lastName: "Harris",
      role: "enumerator",
      sector: "informal",
      county: "Montserrado",
      organizationName: "Montserrado County Office",
      organizationType: "government",
      phone: "+231-88-000-0006",
      isActive: true,
      isDemo: true,
    },
    // County Enumerator - Nimba
    {
      email: "demo_enumerator2@test.com",
      password: hashedPassword,
      firstName: "Grace",
      lastName: "Miller",
      role: "enumerator",
      sector: "informal",
      county: "Nimba",
      organizationName: "Nimba County Office",
      organizationType: "government",
      phone: "+231-88-000-0007",
      isActive: true,
      isDemo: true,
    },
    // Individual Worker
    {
      email: "demo_individual@test.com",
      password: hashedPassword,
      firstName: "David",
      lastName: "Taylor",
      role: "individual",
      sector: null,
      county: "Montserrado",
      organizationName: null,
      organizationType: null,
      phone: "+231-88-000-0008",
      isActive: true,
      isDemo: true,
    },
  ];

  for (const user of demoUsers) {
    try {
      const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ password: hashedPassword, isActive: true, isDemo: true }).where(eq(users.email, user.email));
        console.log(`Updated demo user: ${user.email}`);
      } else {
        await db.insert(users).values(user);
        console.log(`Created demo user: ${user.email}`);
      }
    } catch (error) {
      console.log(`User ${user.email} error:`, error);
    }
  }

  // Create some sample employment spells for demo
  const sampleSpells = [
    {
      reportedBy: "demo_private@test.com",
      employerName: "Liberia Trading Co.",
      employerType: "private_company",
      sector: "private",
      county: "Montserrado",
      district: "Central",
      jobTitle: "Accountant",
      employeeName: "John Smith",
      employeeGender: "male",
      employeeAge: 32,
      contractType: "full_time",
      startDate: "2024-01-15",
      endDate: null,
      isActive: true,
      monthlySalary: 45000,
      currency: "LRD",
      verificationStatus: "verified",
      notes: "Senior position",
    },
    {
      reportedBy: "demo_private@test.com",
      employerName: "Liberia Trading Co.",
      employerType: "private_company",
      sector: "private",
      county: "Montserrado",
      district: "Central",
      jobTitle: "Sales Representative",
      employeeName: "Jane Doe",
      employeeGender: "female",
      employeeAge: 28,
      contractType: "full_time",
      startDate: "2024-03-01",
      endDate: null,
      isActive: true,
      monthlySalary: 35000,
      currency: "LRD",
      verificationStatus: "pending",
      notes: null,
    },
    {
      reportedBy: "demo_public@test.com",
      employerName: "Ministry of Finance",
      employerType: "government",
      sector: "public",
      county: "Montserrado",
      district: "Central",
      jobTitle: "Budget Analyst",
      employeeName: "Michael Johnson",
      employeeGender: "male",
      employeeAge: 35,
      contractType: "full_time",
      startDate: "2023-06-01",
      endDate: null,
      isActive: true,
      monthlySalary: 55000,
      currency: "LRD",
      verificationStatus: "verified",
      notes: null,
    },
    {
      reportedBy: "demo_enumerator@test.com",
      employerName: "Waterside Market",
      employerType: "informal",
      sector: "informal",
      county: "Montserrado",
      district: "Waterside",
      jobTitle: "Market Trader",
      employeeName: "Mama Fatou",
      employeeGender: "female",
      employeeAge: 45,
      contractType: "informal",
      startDate: "2020-01-01",
      endDate: null,
      isActive: true,
      monthlySalary: 15000,
      currency: "LRD",
      verificationStatus: "verified",
      notes: "Long-standing trader at Waterside",
    },
    {
      reportedBy: "demo_enumerator2@test.com",
      employerName: "Ganta Farm Cooperative",
      employerType: "cooperative",
      sector: "seasonal",
      county: "Nimba",
      district: "Ganta",
      jobTitle: "Farm Worker",
      employeeName: "Emmanuel Cooper",
      employeeGender: "male",
      employeeAge: 25,
      contractType: "seasonal",
      startDate: "2024-03-01",
      endDate: "2024-08-31",
      isActive: false,
      monthlySalary: 12000,
      currency: "LRD",
      verificationStatus: "verified",
      notes: "Seasonal harvest worker",
    },
  ];

  // Seed training videos (for both dev and production)
  // Object storage IDs point to files in the shared bucket accessible from both environments
  const defaultVideos = [
    {
      id: crypto.randomUUID(),
      scriptId: "public-registration",
      title: "How to Register on LiJOBS",
      description: "Step-by-step guide to creating your account",
      targetAudience: "public",
      videoUrl: "/api/videos/lijobs-registration-guide.mp4",
      status: "completed",
      duration: "3-4 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "ministry-overview",
      title: "Ministry Verifier Training",
      description: "Complete guide for ministry verification officers",
      targetAudience: "ministry",
      videoUrl: "/api/training/stream/a0099fbc-b6f7-4e9a-8d1e-06bed4b91cac",
      status: "completed",
      duration: "7-8 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "mol-data-collection",
      title: "Data Collection & Entry Training for MOL Staff",
      description: "Step-by-step training for Ministry enumerators on collecting and entering employment data in LiJOBS",
      targetAudience: "ministry",
      videoUrl: "/api/training/stream/aff2a882-df8d-4cf3-abb1-df91ef86e4ca",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "mol-statistical-literacy",
      title: "Statistical Literacy for Ministry Officials",
      description: "Training on understanding labour market statistics, reading charts, and presenting data to stakeholders",
      targetAudience: "ministry",
      videoUrl: "/api/training/stream/5852319f-7d33-4bac-a25f-406cc94f5147",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "employer-overview",
      title: "Employer Portal Training",
      description: "Complete guide for employers on using the LiJOBS platform",
      targetAudience: "employer",
      videoUrl: "/api/training/stream/7755c53b-2c22-4728-8cc0-1b94f73a3c39",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "employer-bulk-upload",
      title: "Bulk Upload Training for Employers",
      description: "How to use bulk upload features to submit employment data efficiently",
      targetAudience: "employer",
      videoUrl: "/api/training/stream/01a39e91-684c-421c-aa2f-b82b1713f470",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "enumerator-overview",
      title: "County Enumerator Training",
      description: "Training for county enumerators on data collection procedures",
      targetAudience: "enumerator",
      videoUrl: "/api/training/stream/68834ba3-458d-4a16-929f-5312e83de1ab",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "enumerator-mobile",
      title: "Using the Mobile Data Collection App",
      description: "How to use mobile devices for field data collection",
      targetAudience: "enumerator",
      videoUrl: "/api/training/stream/c84029b3-a772-46fa-85a9-5c52d15ad01f",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "individual-overview",
      title: "Individual Worker Guide",
      description: "Guide for individual workers on using LiJOBS to manage their employment records",
      targetAudience: "individual",
      videoUrl: "/api/training/stream/cbe9238c-0a17-42e9-92fe-4410c55a0006",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "individual-self-registration",
      title: "Self-Registering Your Employment",
      description: "How to self-register your employment records on LiJOBS",
      targetAudience: "individual",
      videoUrl: "/api/training/stream/08a153c0-103d-43ce-ad78-b0aa7cc73ad6",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "admin-overview",
      title: "System Administration Overview",
      description: "Administration guide for managing the LiJOBS platform",
      targetAudience: "admin",
      videoUrl: "/api/training/stream/6a1fdcda-c9ef-43c2-98ea-9ca459df8be1",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "admin-user-management",
      title: "Managing Users and Permissions",
      description: "How to manage user accounts and access permissions",
      targetAudience: "admin",
      videoUrl: "/api/training/stream/60da8505-9e4b-4768-9ce0-11c490764c7d",
      status: "completed",
      duration: "8-10 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "public-overview",
      title: "Welcome to LiJOBS - Liberia Jobs Observatory System",
      description: "An introduction to the national job creation data platform",
      targetAudience: "public",
      videoUrl: "/api/training/stream/6db5af3c-00ef-44fa-a81a-dd26c32d64f7",
      status: "completed",
      duration: "3-4 minutes",
    },
    {
      id: crypto.randomUUID(),
      scriptId: "public-features",
      title: "LiJOBS Features and Capabilities",
      description: "Overview of all the features available on the LiJOBS platform",
      targetAudience: "public",
      videoUrl: "/api/training/stream/7b604189-2092-4749-9a68-558a8d06415c",
      status: "completed",
      duration: "5-6 minutes",
    },
  ];

  for (const video of defaultVideos) {
    try {
      const existing = await db.select().from(trainingVideos).where(
        eq(trainingVideos.scriptId, video.scriptId)
      );
      if (existing.length === 0) {
        await db.insert(trainingVideos).values(video);
        console.log(`Created training video: ${video.title}`);
      } else if (video.videoUrl.startsWith("/api/training/stream/") && existing[0].videoUrl !== video.videoUrl) {
        await db.update(trainingVideos)
          .set({ videoUrl: video.videoUrl, title: video.title, description: video.description, status: video.status, duration: video.duration })
          .where(eq(trainingVideos.scriptId, video.scriptId));
        console.log(`Updated training video URL: ${video.title}`);
      }
    } catch (error) {
      console.log(`Video ${video.title} already exists or error`);
    }
  }

    await seedLabourMarketIndicators();
    await seedCountyIndicators();
    await seedPriceData();

    console.log("Demo data initialization complete!");

    const { seedCoursesAndProviders } = await import("./seed-courses");
    await seedCoursesAndProviders();

    const { seedMinistryTrainingCourses } = await import("./seed-ministry-training");
    await seedMinistryTrainingCourses();
  } catch (error) {
    console.error("Failed to initialize demo data (database may not be ready):", error);
  }
}

async function seedLabourMarketIndicators() {
  const existing = await db.select().from(labourMarketIndicators);
  if (existing.length > 0) {
    console.log("Labour market indicators already exist, skipping.");
    return;
  }
  console.log("Seeding labour market indicators...");
  const data = [
    { year: 2020, quarter: null, unemploymentRate: 18.2, employmentToPopRatio: 55.3, labourForceParticipation: 42.8, youthUnemploymentRate: 32.5, femaleLabourParticipation: 38.5, informalEmploymentRate: 72.4, minimumDailyWage: 5.5, wageCurrency: "USD", totalLabourForce: 1850000, totalEmployed: 1513000, totalUnemployed: 337000, source: "LISGIS Labor Force Survey 2020" },
    { year: 2021, quarter: null, unemploymentRate: 15.8, employmentToPopRatio: 57.1, labourForceParticipation: 45.3, youthUnemploymentRate: 29.1, femaleLabourParticipation: 40.2, informalEmploymentRate: 70.1, minimumDailyWage: 5.5, wageCurrency: "USD", totalLabourForce: 1920000, totalEmployed: 1617000, totalUnemployed: 303000, source: "LISGIS Labor Force Survey 2021" },
    { year: 2022, quarter: null, unemploymentRate: 13.5, employmentToPopRatio: 58.9, labourForceParticipation: 47.6, youthUnemploymentRate: 26.4, femaleLabourParticipation: 42.1, informalEmploymentRate: 68.3, minimumDailyWage: 6.0, wageCurrency: "USD", totalLabourForce: 1985000, totalEmployed: 1717000, totalUnemployed: 268000, source: "LISGIS Labor Force Survey 2022" },
    { year: 2023, quarter: null, unemploymentRate: 11.9, employmentToPopRatio: 60.5, labourForceParticipation: 49.8, youthUnemploymentRate: 24.0, femaleLabourParticipation: 44.0, informalEmploymentRate: 66.7, minimumDailyWage: 6.0, wageCurrency: "USD", totalLabourForce: 2050000, totalEmployed: 1806000, totalUnemployed: 244000, source: "LISGIS Labor Force Survey 2023" },
    { year: 2024, quarter: 1, unemploymentRate: 10.4, employmentToPopRatio: 61.8, labourForceParticipation: 51.2, youthUnemploymentRate: 21.7, femaleLabourParticipation: 45.8, informalEmploymentRate: 65.2, minimumDailyWage: 6.5, wageCurrency: "USD", totalLabourForce: 2120000, totalEmployed: 1900000, totalUnemployed: 220000, source: "LISGIS Quarterly Report Q1 2024" },
    { year: 2024, quarter: 2, unemploymentRate: 9.6, employmentToPopRatio: 62.7, labourForceParticipation: 52.5, youthUnemploymentRate: 19.8, femaleLabourParticipation: 47.2, informalEmploymentRate: 64.0, minimumDailyWage: 6.5, wageCurrency: "USD", totalLabourForce: 2180000, totalEmployed: 1971000, totalUnemployed: 209000, source: "LISGIS Quarterly Report Q2 2024" },
  ];
  for (const row of data) {
    await db.insert(labourMarketIndicators).values(row as any);
  }
  console.log("Labour market indicators seeded.");
}

async function seedCountyIndicators() {
  const existing = await db.select().from(countyIndicators);
  if (existing.length > 0) {
    console.log("County indicators already exist, skipping.");
    return;
  }
  console.log("Seeding county indicators...");

  const counties = [
    { county: "Montserrado", population: 1520000, activePopulation: 1040000, totalEmployed: 1000000, totalUnemployed: 40000, totalUnderemployed: 128000, unemploymentRate: 3.8, employmentRate: 96.2, underemploymentRate: 12.3, labourForceParticipation: 68.5, maleUnemploymentRate: 3.2, femaleUnemploymentRate: 4.5, urbanUnemploymentRate: 3.5, ruralUnemploymentRate: 5.2, youthUnemploymentRate: 8.5, agriculturePct: 18, servicesPct: 58, industryPct: 24, totalJobSeekers: 850, totalVacancies: 420 },
    { county: "Margibi", population: 260000, activePopulation: 162000, totalEmployed: 153500, totalUnemployed: 8500, totalUnderemployed: 27200, unemploymentRate: 5.2, employmentRate: 94.8, underemploymentRate: 16.8, labourForceParticipation: 62.3, maleUnemploymentRate: 4.5, femaleUnemploymentRate: 6.1, urbanUnemploymentRate: 4.8, ruralUnemploymentRate: 6.8, youthUnemploymentRate: 11.2, agriculturePct: 35, servicesPct: 42, industryPct: 23, totalJobSeekers: 320, totalVacancies: 85 },
    { county: "Nimba", population: 560000, activePopulation: 329000, totalEmployed: 307700, totalUnemployed: 21300, totalUnderemployed: 60000, unemploymentRate: 6.5, employmentRate: 93.5, underemploymentRate: 19.5, labourForceParticipation: 58.7, maleUnemploymentRate: 5.8, femaleUnemploymentRate: 7.4, urbanUnemploymentRate: 5.9, ruralUnemploymentRate: 8.3, youthUnemploymentRate: 13.8, agriculturePct: 42, servicesPct: 38, industryPct: 20, totalJobSeekers: 480, totalVacancies: 150 },
    { county: "Bong", population: 410000, activePopulation: 227000, totalEmployed: 209300, totalUnemployed: 17700, totalUnderemployed: 46200, unemploymentRate: 7.8, employmentRate: 92.2, underemploymentRate: 22.1, labourForceParticipation: 55.4, maleUnemploymentRate: 6.9, femaleUnemploymentRate: 8.9, urbanUnemploymentRate: 7.1, ruralUnemploymentRate: 9.7, youthUnemploymentRate: 16.1, agriculturePct: 48, servicesPct: 33, industryPct: 19, totalJobSeekers: 380, totalVacancies: 95 },
    { county: "Lofa", population: 380000, activePopulation: 202000, totalEmployed: 185000, totalUnemployed: 17000, totalUnderemployed: 45700, unemploymentRate: 8.4, employmentRate: 91.6, underemploymentRate: 24.7, labourForceParticipation: 53.1, maleUnemploymentRate: 7.5, femaleUnemploymentRate: 9.6, urbanUnemploymentRate: 7.8, ruralUnemploymentRate: 10.5, youthUnemploymentRate: 17.9, agriculturePct: 55, servicesPct: 28, industryPct: 17, totalJobSeekers: 290, totalVacancies: 65 },
    { county: "Grand Bassa", population: 280000, activePopulation: 145000, totalEmployed: 131800, totalUnemployed: 13200, totalUnderemployed: 34600, unemploymentRate: 9.1, employmentRate: 90.9, underemploymentRate: 26.3, labourForceParticipation: 51.8, maleUnemploymentRate: 8.2, femaleUnemploymentRate: 10.3, urbanUnemploymentRate: 8.4, ruralUnemploymentRate: 11.4, youthUnemploymentRate: 19.4, agriculturePct: 50, servicesPct: 32, industryPct: 18, totalJobSeekers: 250, totalVacancies: 55 },
    { county: "Bomi", population: 95000, activePopulation: 46200, totalEmployed: 41400, totalUnemployed: 4800, totalUnderemployed: 12000, unemploymentRate: 10.3, employmentRate: 89.7, underemploymentRate: 28.9, labourForceParticipation: 48.6, maleUnemploymentRate: 9.4, femaleUnemploymentRate: 11.5, urbanUnemploymentRate: 9.7, ruralUnemploymentRate: 12.8, youthUnemploymentRate: 21.7, agriculturePct: 52, servicesPct: 30, industryPct: 18, totalJobSeekers: 110, totalVacancies: 22 },
    { county: "Grand Cape Mount", population: 140000, activePopulation: 64700, totalEmployed: 57100, totalUnemployed: 7600, totalUnderemployed: 18000, unemploymentRate: 11.7, employmentRate: 88.3, underemploymentRate: 31.5, labourForceParticipation: 46.2, maleUnemploymentRate: 10.6, femaleUnemploymentRate: 13.2, urbanUnemploymentRate: 10.9, ruralUnemploymentRate: 14.3, youthUnemploymentRate: 24.3, agriculturePct: 56, servicesPct: 27, industryPct: 17, totalJobSeekers: 160, totalVacancies: 30 },
    { county: "Maryland", population: 165000, activePopulation: 74100, totalEmployed: 64800, totalUnemployed: 9300, totalUnderemployed: 21500, unemploymentRate: 12.5, employmentRate: 87.5, underemploymentRate: 33.2, labourForceParticipation: 44.9, maleUnemploymentRate: 11.2, femaleUnemploymentRate: 14.1, urbanUnemploymentRate: 11.6, ruralUnemploymentRate: 15.2, youthUnemploymentRate: 26.1, agriculturePct: 54, servicesPct: 28, industryPct: 18, totalJobSeekers: 180, totalVacancies: 35 },
    { county: "Grand Gedeh", population: 155000, activePopulation: 65600, totalEmployed: 56300, totalUnemployed: 9300, totalUnderemployed: 20100, unemploymentRate: 14.2, employmentRate: 85.8, underemploymentRate: 35.8, labourForceParticipation: 42.3, maleUnemploymentRate: 12.8, femaleUnemploymentRate: 15.9, urbanUnemploymentRate: 13.1, ruralUnemploymentRate: 16.9, youthUnemploymentRate: 28.8, agriculturePct: 58, servicesPct: 25, industryPct: 17, totalJobSeekers: 140, totalVacancies: 25 },
    { county: "Sinoe", population: 120000, activePopulation: 48800, totalEmployed: 41100, totalUnemployed: 7700, totalUnderemployed: 15800, unemploymentRate: 15.8, employmentRate: 84.2, underemploymentRate: 38.4, labourForceParticipation: 40.7, maleUnemploymentRate: 14.1, femaleUnemploymentRate: 17.8, urbanUnemploymentRate: 14.5, ruralUnemploymentRate: 18.6, youthUnemploymentRate: 31.5, agriculturePct: 60, servicesPct: 24, industryPct: 16, totalJobSeekers: 120, totalVacancies: 18 },
    { county: "Gbarpolu", population: 98000, activePopulation: 37700, totalEmployed: 31300, totalUnemployed: 6400, totalUnderemployed: 12900, unemploymentRate: 17.1, employmentRate: 82.9, underemploymentRate: 41.2, labourForceParticipation: 38.5, maleUnemploymentRate: 15.4, femaleUnemploymentRate: 19.2, urbanUnemploymentRate: 15.8, ruralUnemploymentRate: 20.3, youthUnemploymentRate: 34.2, agriculturePct: 65, servicesPct: 21, industryPct: 14, totalJobSeekers: 90, totalVacancies: 12 },
    { county: "River Cess", population: 85000, activePopulation: 31300, totalEmployed: 25500, totalUnemployed: 5800, totalUnderemployed: 11100, unemploymentRate: 18.6, employmentRate: 81.4, underemploymentRate: 43.7, labourForceParticipation: 36.8, maleUnemploymentRate: 16.9, femaleUnemploymentRate: 20.8, urbanUnemploymentRate: 17.2, ruralUnemploymentRate: 22.1, youthUnemploymentRate: 36.9, agriculturePct: 68, servicesPct: 19, industryPct: 13, totalJobSeekers: 75, totalVacancies: 10 },
    { county: "River Gee", population: 75000, activePopulation: 25700, totalEmployed: 20500, totalUnemployed: 5200, totalUnderemployed: 9500, unemploymentRate: 20.3, employmentRate: 79.7, underemploymentRate: 46.5, labourForceParticipation: 34.2, maleUnemploymentRate: 18.5, femaleUnemploymentRate: 22.6, urbanUnemploymentRate: 18.9, ruralUnemploymentRate: 24.2, youthUnemploymentRate: 39.7, agriculturePct: 70, servicesPct: 18, industryPct: 12, totalJobSeekers: 65, totalVacancies: 8 },
    { county: "Grand Kru", population: 68000, activePopulation: 21700, totalEmployed: 16800, totalUnemployed: 4900, totalUnderemployed: 8200, unemploymentRate: 22.4, employmentRate: 77.6, underemploymentRate: 49.1, labourForceParticipation: 31.9, maleUnemploymentRate: 20.1, femaleUnemploymentRate: 25.1, urbanUnemploymentRate: 20.7, ruralUnemploymentRate: 26.5, youthUnemploymentRate: 42.8, agriculturePct: 72, servicesPct: 17, industryPct: 11, totalJobSeekers: 55, totalVacancies: 6 },
  ];

  const periods = [
    { year: 2023, quarter: null as number | null, rateMultiplier: 1.08 },
    { year: 2024, quarter: 1, rateMultiplier: 1.04 },
    { year: 2024, quarter: 2, rateMultiplier: 1.0 },
  ];

  for (const period of periods) {
    for (const c of counties) {
      const m = period.rateMultiplier;
      const popAdj = period.year === 2023 ? -20000 : period.quarter === 1 ? -10000 : 0;
      await db.insert(countyIndicators).values({
        county: c.county,
        year: period.year,
        quarter: period.quarter,
        population: Math.max(c.population + popAdj, 50000),
        activePopulation: c.activePopulation,
        totalEmployed: c.totalEmployed,
        totalUnemployed: c.totalUnemployed,
        totalUnderemployed: c.totalUnderemployed,
        unemploymentRate: Math.round(c.unemploymentRate * m * 10) / 10,
        employmentRate: Math.round((100 - c.unemploymentRate * m) * 10) / 10,
        underemploymentRate: Math.round(c.underemploymentRate * m * 10) / 10,
        labourForceParticipation: Math.round((c.labourForceParticipation / m) * 10) / 10,
        maleUnemploymentRate: Math.round(c.maleUnemploymentRate * m * 10) / 10,
        femaleUnemploymentRate: Math.round(c.femaleUnemploymentRate * m * 10) / 10,
        urbanUnemploymentRate: Math.round(c.urbanUnemploymentRate * m * 10) / 10,
        ruralUnemploymentRate: Math.round(c.ruralUnemploymentRate * m * 10) / 10,
        youthUnemploymentRate: Math.round(c.youthUnemploymentRate * m * 10) / 10,
        agriculturePct: c.agriculturePct,
        servicesPct: c.servicesPct,
        industryPct: c.industryPct,
        totalJobSeekers: c.totalJobSeekers,
        totalVacancies: c.totalVacancies,
      } as any);
    }
  }
  console.log("County indicators seeded (3 periods x 15 counties = 45 records).");
}

async function seedPriceData() {
  const existing = await db.select().from(priceEntries).limit(1);
  if (existing.length > 0) {
    console.log("Price data already exists, skipping.");
    return;
  }
  console.log("Seeding baseline price data...");

  const counties = [
    "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
    "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
    "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
  ];

  const baselinePrices: Record<string, number> = {
    RICE_25KG: 3500, RICE_CUP: 75, CASSAVA_25KG: 2000, EDDOS: 150, FUFU: 100,
    PEPPER: 200, PALM_OIL: 1800, IMPORTED_OIL: 2500, SUGAR: 350, SALT: 200,
    FISH_DRIED: 500, CHICKEN: 2500, CHARCOAL: 800, FUEL_GASOLINE: 850,
    FUEL_DIESEL: 900, TRANSPORT_TAXI: 100, TRANSPORT_BUS: 50, HOUSING_RENT: 8000,
    WATER: 75, PHONE_CREDIT: 200,
  };

  const itemLookup: Record<string, { name: string; unit: string; category: string }> = {
    RICE_25KG: { name: "25kg Bag of Rice", unit: "bag", category: "Food - Staples" },
    RICE_CUP: { name: "Cup of Rice", unit: "cup", category: "Food - Staples" },
    CASSAVA_25KG: { name: "25kg Bag of Cassava", unit: "bag", category: "Food - Staples" },
    EDDOS: { name: "Eddos (1 lb)", unit: "lb", category: "Food - Staples" },
    FUFU: { name: "Better-ball / Fufu (1 lb)", unit: "lb", category: "Food - Staples" },
    PEPPER: { name: "Pepper (cup)", unit: "cup", category: "Food - Condiments" },
    PALM_OIL: { name: "Gallon of Palm Oil", unit: "gallon", category: "Food - Oils" },
    IMPORTED_OIL: { name: "Gallon of Imported Oil", unit: "gallon", category: "Food - Oils" },
    SUGAR: { name: "Sugar (1 kg)", unit: "kg", category: "Food - Condiments" },
    SALT: { name: "Salt (1 kg)", unit: "kg", category: "Food - Condiments" },
    FISH_DRIED: { name: "Dried Fish (1 lb)", unit: "lb", category: "Food - Protein" },
    CHICKEN: { name: "Whole Chicken", unit: "each", category: "Food - Protein" },
    CHARCOAL: { name: "Bag of Charcoal", unit: "bag", category: "Energy" },
    FUEL_GASOLINE: { name: "Gasoline (1 gallon)", unit: "gallon", category: "Energy" },
    FUEL_DIESEL: { name: "Diesel (1 gallon)", unit: "gallon", category: "Energy" },
    TRANSPORT_TAXI: { name: "Taxi Ride (in-city)", unit: "trip", category: "Transport" },
    TRANSPORT_BUS: { name: "Bus Fare (in-city)", unit: "trip", category: "Transport" },
    HOUSING_RENT: { name: "Monthly Rent (1-bedroom)", unit: "month", category: "Housing" },
    WATER: { name: "Water (20L jerry can)", unit: "can", category: "Utilities" },
    PHONE_CREDIT: { name: "Mobile Phone Credit", unit: "card", category: "Communication" },
  };

  const countyMultipliers: Record<string, number> = {
    Montserrado: 1.15, Nimba: 0.85, Bong: 0.82, Lofa: 0.88,
    Margibi: 1.0, "Grand Bassa": 0.90, "Grand Cape Mount": 0.87, Bomi: 0.83,
    Gbarpolu: 0.80, "Grand Gedeh": 0.84, "Grand Kru": 0.79, Maryland: 0.86,
    "River Cess": 0.78, "River Gee": 0.77, Sinoe: 0.81,
  };

  const allEntries: any[] = [];
  const months2025 = [1, 2];
  const months2024 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const county of counties) {
    const mult = countyMultipliers[county] || 1.0;

    for (const m of months2024) {
      const inflation = 1 + (m - 1) * 0.005;
      for (const [code, basePrice] of Object.entries(baselinePrices)) {
        const variation = 0.95 + Math.random() * 0.10;
        const price = Math.round(basePrice * mult * inflation * variation);
        const item = itemLookup[code];
        allEntries.push({
          county, itemCode: code, itemName: item.name, price, currency: "LRD",
          unit: item.unit, category: item.category, month: m, year: 2024,
        });
      }
    }

    for (const m of months2025) {
      const inflation = 1.06 + (m - 1) * 0.004;
      for (const [code, basePrice] of Object.entries(baselinePrices)) {
        const variation = 0.95 + Math.random() * 0.10;
        const price = Math.round(basePrice * mult * inflation * variation);
        const item = itemLookup[code];
        allEntries.push({
          county, itemCode: code, itemName: item.name, price, currency: "LRD",
          unit: item.unit, category: item.category, month: m, year: 2025,
        });
      }
    }
  }

  const batchSize = 100;
  for (let i = 0; i < allEntries.length; i += batchSize) {
    const batch = allEntries.slice(i, i + batchSize);
    await db.insert(priceEntries).values(batch);
  }
  console.log(`Price data seeded: ${allEntries.length} entries across ${counties.length} counties.`);
}

export async function seedOccupationalEconomicsData() {
  const existingSpells = await db.select({ count: sql<number>`count(*)` }).from(employmentSpells);
  const existingPersonsCheck = await db.select({ count: sql<number>`count(*)` }).from(persons);
  const existingVacanciesCheck = await db.select({ count: sql<number>`count(*)` }).from(vacancies);
  const existingIncidentsCheck = await db.select({ count: sql<number>`count(*)` }).from(workplaceIncidents);
  const allSeeded = Number(existingSpells[0].count) > 50 && Number(existingPersonsCheck[0].count) > 50 && Number(existingVacanciesCheck[0].count) > 10 && Number(existingIncidentsCheck[0].count) > 10;
  if (allSeeded) {
    console.log("Occupational economics data already seeded, skipping...");
    return;
  }

  console.log("Seeding occupational economics data...");

  const counties = [
    "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
    "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
    "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
  ];

  const occupations = [
    { code: "23", title: "Teaching Professionals", sector: "public", salaryRange: [18000, 35000] },
    { code: "22", title: "Health Professionals", sector: "public", salaryRange: [22000, 45000] },
    { code: "93", title: "Labourers in Mining, Construction, Manufacturing and Transport", sector: "private", salaryRange: [8000, 18000] },
    { code: "61", title: "Market-oriented Skilled Agricultural Workers", sector: "private", salaryRange: [5000, 15000] },
    { code: "52", title: "Sales Workers", sector: "private", salaryRange: [10000, 22000] },
    { code: "51", title: "Personal Service Workers", sector: "private", salaryRange: [8000, 16000] },
    { code: "71", title: "Building and Related Trades Workers", sector: "private", salaryRange: [12000, 28000] },
    { code: "41", title: "General and Keyboard Clerks", sector: "public", salaryRange: [15000, 25000] },
    { code: "0", title: "Armed Forces Occupations", sector: "public", salaryRange: [14000, 30000] },
    { code: "12", title: "Administrative and Commercial Managers", sector: "private", salaryRange: [35000, 75000] },
    { code: "25", title: "Information and Communications Technology Professionals", sector: "private", salaryRange: [30000, 60000] },
    { code: "32", title: "Health Associate Professionals", sector: "public", salaryRange: [12000, 25000] },
    { code: "72", title: "Metal, Machinery and Related Trades Workers", sector: "private", salaryRange: [10000, 25000] },
    { code: "92", title: "Agricultural, Forestry and Fishery Labourers", sector: "private", salaryRange: [4000, 12000] },
    { code: "42", title: "Customer Services Clerks", sector: "private", salaryRange: [10000, 20000] },
    { code: "81", title: "Stationary Plant and Machine Operators", sector: "private", salaryRange: [12000, 30000] },
    { code: "91", title: "Cleaners and Helpers", sector: "private", salaryRange: [5000, 10000] },
    { code: "13", title: "Production and Specialized Services Managers", sector: "private", salaryRange: [30000, 65000] },
    { code: "24", title: "Business and Administration Professionals", sector: "ngo", salaryRange: [25000, 50000] },
    { code: "33", title: "Business and Administration Associate Professionals", sector: "ngo", salaryRange: [18000, 35000] },
    { code: "52", title: "Market Vendor", sector: "informal", salaryRange: [3000, 15000] },
    { code: "51", title: "Street Food Seller", sector: "informal", salaryRange: [2000, 10000] },
    { code: "73", title: "Artisan Craftworker", sector: "informal", salaryRange: [4000, 12000] },
    { code: "83", title: "Motorbike Taxi Driver", sector: "informal", salaryRange: [5000, 18000] },
    { code: "91", title: "Domestic Worker", sector: "informal", salaryRange: [2000, 8000] },
    { code: "52", title: "Petty Trader", sector: "informal", salaryRange: [2000, 10000] },
    { code: "61", title: "Subsistence Farmer", sector: "informal", salaryRange: [1500, 7000] },
    { code: "92", title: "Rubber Tapper", sector: "seasonal", salaryRange: [3000, 10000] },
    { code: "92", title: "Cocoa Harvester", sector: "seasonal", salaryRange: [3000, 9000] },
    { code: "92", title: "Rice Paddy Worker", sector: "seasonal", salaryRange: [2500, 8000] },
    { code: "61", title: "Agricultural Labourer", sector: "seasonal", salaryRange: [2000, 8000] },
  ];

  const employerNames: Record<string, string[]> = {
    public: ["Ministry of Education", "Ministry of Health", "Ministry of Finance", "Ministry of Agriculture", "Liberian National Police", "National Port Authority", "Legislature of Liberia", "Judiciary of Liberia"],
    private: ["Firestone Liberia", "ArcelorMittal Liberia", "Liberia Coca-Cola", "Lonestar Cell MTN", "Orange Liberia", "CEMENCO", "Bea Mountain Mining", "Sime Darby Plantation", "Golden Veroleum", "Liberia Trading Co."],
    ngo: ["USAID Liberia", "UNDP Liberia", "World Bank Liberia", "UNICEF Liberia", "WHO Liberia", "WFP Liberia", "IRC Liberia", "Mercy Corps"],
    informal: ["Waterside Market", "Duala Market", "Red Light Market", "Rally Town Market", "Gobachop Market", "ELWA Junction Market", "Broad Street Vendors", "Old Road Market"],
    seasonal: ["Firestone Plantation", "Cavalla Rubber Corp", "Cocopa Farm Cooperative", "Ganta Farm Cooperative", "Lofa Cocoa Collective", "Maryland Palm Oil Co.", "Sinoe Timber Works", "Bong Rice Cooperative"],
  };

  const genders = ["male", "female"];
  const contractTypes = ["permanent", "temporary", "contract", "apprentice"];

  const spellEntries: any[] = [];
  const reporterId = "demo-admin-id";

  const growthOccupations = ["25", "22", "71", "12", "81"];
  const decliningOccupations = ["92", "91", "61"];

  for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
    const year = 2024 + yearOffset;
    const baseMultiplier = yearOffset === 2 ? 0.3 : 1;

    for (const occ of occupations) {
      const countySubset = yearOffset === 2
        ? counties.slice(0, 5)
        : counties;

      for (const county of countySubset) {
        let spellCount = Math.floor(Math.random() * 6) + 2;
        if (county === "Montserrado") spellCount = Math.floor(spellCount * 2.5);
        else if (county === "Nimba" || county === "Bong") spellCount = Math.floor(spellCount * 1.5);

        if (growthOccupations.includes(occ.code)) spellCount = Math.floor(spellCount * (1 + yearOffset * 0.3));
        if (decliningOccupations.includes(occ.code)) spellCount = Math.max(1, Math.floor(spellCount * (1 - yearOffset * 0.2)));
        spellCount = Math.floor(spellCount * baseMultiplier) || (yearOffset === 2 ? 1 : spellCount);

        for (let i = 0; i < spellCount; i++) {
          const salary = Math.round(occ.salaryRange[0] + Math.random() * (occ.salaryRange[1] - occ.salaryRange[0]));
          const countyMultiplier = county === "Montserrado" ? 1.2 : county === "Margibi" ? 1.1 : county === "Nimba" ? 1.05 : 0.85 + Math.random() * 0.15;
          const adjustedSalary = Math.round(salary * countyMultiplier);

          const month = Math.floor(Math.random() * 12) + 1;
          const day = Math.floor(Math.random() * 28) + 1;
          const startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isActive = year === 2025 && Math.random() > 0.3;
          const endDate = isActive ? null : `${year}-${String(Math.min(month + Math.floor(Math.random() * 6) + 1, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const employers = employerNames[occ.sector] || employerNames.private;
          const gender = genders[Math.floor(Math.random() * genders.length)];

          spellEntries.push({
            id: crypto.randomUUID(),
            reportedBy: reporterId,
            employerName: employers[Math.floor(Math.random() * employers.length)],
            employerType: occ.sector === "ngo" ? "ngo" : occ.sector === "public" ? "government" : occ.sector === "informal" ? "informal" : occ.sector === "seasonal" ? "cooperative" : "private_company",
            sector: occ.sector,
            county,
            district: `${county} District ${Math.floor(Math.random() * 3) + 1}`,
            jobTitle: occ.title,
            iscoCode: occ.code,
            isicCode: null,
            employeeName: `${gender === "male" ? ["John", "James", "Peter", "David", "Samuel", "Abraham", "Moses", "Joseph"][Math.floor(Math.random() * 8)] : ["Mary", "Sarah", "Grace", "Ruth", "Martha", "Hannah", "Esther", "Comfort"][Math.floor(Math.random() * 8)]} ${["Johnson", "Williams", "Brown", "Davis", "Taylor", "Harris", "Miller", "Wilson", "Cooper", "Dennis"][Math.floor(Math.random() * 10)]}`,
            employeeGender: gender,
            employeeAge: Math.floor(Math.random() * 35) + 20,
            contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
            startDate,
            endDate,
            isActive,
            monthlySalary: adjustedSalary,
            currency: "LRD",
            verificationStatus: ["pending", "employer_verified", "enumerator_verified", "fully_verified"][Math.floor(Math.random() * 4)],
          } as any);
          const lastEntry = spellEntries[spellEntries.length - 1] as any;
          const statusScores: Record<string, string> = { pending: "0.300", employer_verified: "0.500", enumerator_verified: "0.700", fully_verified: "1.000" };
          lastEntry.trustScore = statusScores[lastEntry.verificationStatus] || "0.300";
        }
      }
    }
  }

  const batchSize = 100;
  for (let i = 0; i < spellEntries.length; i += batchSize) {
    await db.insert(employmentSpells).values(spellEntries.slice(i, i + batchSize));
  }
  console.log(`Seeded ${spellEntries.length} employment spells`);

  const skillsList = [
    { name: "Microsoft Office", category: "technical" },
    { name: "Data Entry", category: "technical" },
    { name: "Accounting", category: "technical" },
    { name: "Nursing", category: "technical" },
    { name: "Teaching", category: "technical" },
    { name: "Welding", category: "technical" },
    { name: "Carpentry", category: "technical" },
    { name: "Plumbing", category: "technical" },
    { name: "Electrical Wiring", category: "technical" },
    { name: "Heavy Equipment Operation", category: "technical" },
    { name: "Auto Mechanics", category: "technical" },
    { name: "Agriculture", category: "technical" },
    { name: "Customer Service", category: "soft" },
    { name: "Leadership", category: "soft" },
    { name: "Communication", category: "soft" },
    { name: "Project Management", category: "technical" },
    { name: "Web Development", category: "technical" },
    { name: "Mobile App Development", category: "technical" },
    { name: "Cybersecurity", category: "technical" },
    { name: "Tailoring", category: "technical" },
    { name: "Food Processing", category: "technical" },
    { name: "Mining Operations", category: "technical" },
    { name: "Public Health", category: "technical" },
    { name: "First Aid", category: "technical" },
    { name: "Driving", category: "technical" },
    { name: "French Language", category: "language" },
    { name: "English Language", category: "language" },
    { name: "Social Media Marketing", category: "technical" },
    { name: "Graphic Design", category: "technical" },
    { name: "Financial Analysis", category: "technical" },
  ];

  const existingSkills = await db.select({ count: sql<number>`count(*)` }).from(skills);
  if (Number(existingSkills[0].count) === 0) {
    await db.insert(skills).values(skillsList);
    console.log(`Seeded ${skillsList.length} skills`);
  }

  const allSkills = await db.select().from(skills);

  const seekerSkills = ["Microsoft Office", "Customer Service", "Communication", "Data Entry", "Agriculture", "Driving", "English Language", "Teaching", "Tailoring", "Food Processing", "First Aid", "Carpentry"];
  const employerDemandSkills = ["Web Development", "Cybersecurity", "Project Management", "Financial Analysis", "Heavy Equipment Operation", "Nursing", "Welding", "Electrical Wiring", "Mobile App Development", "Accounting", "Data Entry", "Microsoft Office"];

  const personEntries: any[] = [];
  const seekerProfileEntries: any[] = [];
  const personSkillEntries: any[] = [];

  for (let i = 0; i < 200; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const county = counties[Math.floor(Math.random() * counties.length)];
    const personId = crypto.randomUUID();

    personEntries.push({
      id: personId,
      personUid: `LBR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      sex: gender,
      birthYear: 1975 + Math.floor(Math.random() * 30),
      county,
      isYouth: Math.random() > 0.5,
    });

    seekerProfileEntries.push({
      personId,
      highestEducation: ["none", "primary", "secondary", "vocational", "tertiary", "postgraduate"][Math.floor(Math.random() * 6)],
      yearsExperience: Math.floor(Math.random() * 15).toFixed(1),
      preferredSectors: [["public", "private", "ngo"][Math.floor(Math.random() * 3)]],
      preferredCounties: [county],
      isOpenToWork: true,
    });

    const numSkills = Math.floor(Math.random() * 4) + 1;
    const selectedSkills = new Set<string>();
    for (let s = 0; s < numSkills; s++) {
      selectedSkills.add(seekerSkills[Math.floor(Math.random() * seekerSkills.length)]);
    }
    for (const skillName of selectedSkills) {
      const skill = allSkills.find(s => s.name === skillName);
      if (skill) {
        personSkillEntries.push({
          personId,
          skillId: skill.id,
          level: Math.floor(Math.random() * 5) + 1,
          yearsUsed: (Math.floor(Math.random() * 10) + 1).toFixed(1),
        });
      }
    }
  }

  const existingPersons = await db.select({ count: sql<number>`count(*)` }).from(persons);
  if (Number(existingPersons[0].count) < 50) {
    for (let i = 0; i < personEntries.length; i += batchSize) {
      await db.insert(persons).values(personEntries.slice(i, i + batchSize));
    }
    for (let i = 0; i < seekerProfileEntries.length; i += batchSize) {
      await db.insert(jobSeekerProfiles).values(seekerProfileEntries.slice(i, i + batchSize));
    }
    for (let i = 0; i < personSkillEntries.length; i += batchSize) {
      await db.insert(personSkills).values(personSkillEntries.slice(i, i + batchSize));
    }
    console.log(`Seeded ${personEntries.length} persons/seekers with ${personSkillEntries.length} skill entries`);
  }

  const vacancyEntries: any[] = [];
  for (let i = 0; i < 80; i++) {
    const occ = occupations[Math.floor(Math.random() * occupations.length)];
    const county = counties[Math.floor(Math.random() * counties.length)];
    const employers = employerNames[occ.sector] || employerNames.private;
    const reqSkillCount = Math.floor(Math.random() * 3) + 1;
    const reqSkills: string[] = [];
    for (let s = 0; s < reqSkillCount; s++) {
      reqSkills.push(employerDemandSkills[Math.floor(Math.random() * employerDemandSkills.length)]);
    }

    vacancyEntries.push({
      id: crypto.randomUUID(),
      employerId: "demo-employer-id",
      title: occ.title,
      description: `Seeking qualified ${occ.title} for position in ${county}`,
      iscoCode: occ.code,
      county,
      contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
      minSalary: occ.salaryRange[0],
      maxSalary: occ.salaryRange[1],
      openings: Math.floor(Math.random() * 5) + 1,
      requiredSkills: reqSkills,
      status: ["open", "closed"][Math.floor(Math.random() * 2)],
    });
  }

  const existingVacancies = await db.select({ count: sql<number>`count(*)` }).from(vacancies);
  if (Number(existingVacancies[0].count) < 10) {
    for (let i = 0; i < vacancyEntries.length; i += batchSize) {
      await db.insert(vacancies).values(vacancyEntries.slice(i, i + batchSize));
    }
    console.log(`Seeded ${vacancyEntries.length} vacancies`);
  }

  const incidentTypes = ["fall", "machinery", "chemical", "fire", "electrical", "vehicle", "assault", "other"];
  const severities = ["minor", "moderate", "severe", "fatal"];
  const incidentEntries: any[] = [];

  const riskySectors: Record<string, number> = {
    "93": 5, "71": 4, "72": 4, "81": 4, "92": 3, "61": 2, "0": 2,
  };

  for (const [iscoCode, riskLevel] of Object.entries(riskySectors)) {
    const occ = occupations.find(o => o.code === iscoCode);
    if (!occ) continue;

    const incidentCount = riskLevel * 3 + Math.floor(Math.random() * riskLevel * 2);
    for (let i = 0; i < incidentCount; i++) {
      const county = counties[Math.floor(Math.random() * counties.length)];
      const year = 2024 + Math.floor(Math.random() * 2);
      const month = Math.floor(Math.random() * 12) + 1;
      const severity = severities[Math.min(Math.floor(Math.random() * riskLevel), 3)];

      incidentEntries.push({
        reporterName: `Reporter ${i + 1}`,
        reporterEmail: `reporter${i}@example.com`,
        sector: occ.sector,
        incidentType: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        severity,
        county,
        incidentDate: `${year}-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        description: `Workplace ${incidentTypes[Math.floor(Math.random() * incidentTypes.length)]} incident involving ${occ.title} at ${county}`,
        fatalities: severity === "fatal" ? Math.floor(Math.random() * 2) + 1 : 0,
        injuries: severity !== "minor" ? Math.floor(Math.random() * 3) + 1 : 0,
        status: "reported",
        employerName: (employerNames[occ.sector] || employerNames.private)[Math.floor(Math.random() * 3)],
      });
    }
  }

  const existingIncidents = await db.select({ count: sql<number>`count(*)` }).from(workplaceIncidents);
  if (Number(existingIncidents[0].count) < 10) {
    for (let i = 0; i < incidentEntries.length; i += batchSize) {
      await db.insert(workplaceIncidents).values(incidentEntries.slice(i, i + batchSize));
    }
    console.log(`Seeded ${incidentEntries.length} workplace incidents`);
  }

  console.log("Occupational economics data seeding complete!");
}

export async function seedInformalSeasonalData() {
  const informalCount = await db.select({ count: sql<number>`count(*)` }).from(employmentSpells).where(sql`sector = 'informal'`);
  const seasonalCount = await db.select({ count: sql<number>`count(*)` }).from(employmentSpells).where(sql`sector = 'seasonal'`);

  if (Number(informalCount[0].count) > 100 && Number(seasonalCount[0].count) > 50) {
    console.log("Informal/seasonal employment data already exists, skipping...");
    return;
  }

  console.log("Seeding informal and seasonal employment spells...");

  const counties = [
    "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
    "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
    "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
  ];

  const informalOccupations = [
    { title: "Market Vendor", code: "52", salaryRange: [3000, 15000] },
    { title: "Street Food Seller", code: "51", salaryRange: [2000, 10000] },
    { title: "Artisan Craftworker", code: "73", salaryRange: [4000, 12000] },
    { title: "Motorbike Taxi Driver", code: "83", salaryRange: [5000, 18000] },
    { title: "Domestic Worker", code: "91", salaryRange: [2000, 8000] },
    { title: "Petty Trader", code: "52", salaryRange: [2000, 10000] },
    { title: "Subsistence Farmer", code: "61", salaryRange: [1500, 7000] },
  ];

  const seasonalOccupations = [
    { title: "Rubber Tapper", code: "92", salaryRange: [3000, 10000] },
    { title: "Cocoa Harvester", code: "92", salaryRange: [3000, 9000] },
    { title: "Rice Paddy Worker", code: "92", salaryRange: [2500, 8000] },
    { title: "Agricultural Labourer", code: "61", salaryRange: [2000, 8000] },
  ];

  const informalEmployers = ["Waterside Market", "Duala Market", "Red Light Market", "Rally Town Market", "Gobachop Market", "ELWA Junction Market", "Broad Street Vendors", "Old Road Market"];
  const seasonalEmployers = ["Firestone Plantation", "Cavalla Rubber Corp", "Cocopa Farm Cooperative", "Ganta Farm Cooperative", "Lofa Cocoa Collective", "Maryland Palm Oil Co.", "Sinoe Timber Works", "Bong Rice Cooperative"];
  const genders = ["male", "female"];
  const maleNames = ["John", "James", "Peter", "David", "Samuel", "Abraham", "Moses", "Joseph", "Emmanuel", "Patrick"];
  const femaleNames = ["Mary", "Sarah", "Grace", "Ruth", "Martha", "Hannah", "Esther", "Comfort", "Blessing", "Patience"];
  const lastNames = ["Johnson", "Williams", "Brown", "Davis", "Taylor", "Harris", "Miller", "Wilson", "Cooper", "Dennis"];

  const spellEntries: any[] = [];

  for (const county of counties) {
    const countyMultiplier = county === "Montserrado" ? 3 : county === "Nimba" || county === "Bong" ? 1.8 : 1;

    for (const occ of informalOccupations) {
      const count = Math.floor((Math.random() * 12 + 8) * countyMultiplier);
      for (let i = 0; i < count; i++) {
        const gender = genders[Math.floor(Math.random() * 2)];
        const salary = Math.round(occ.salaryRange[0] + Math.random() * (occ.salaryRange[1] - occ.salaryRange[0]));
        const year = 2023 + Math.floor(Math.random() * 2);
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;

        spellEntries.push({
          id: crypto.randomUUID(),
          reportedBy: "demo-admin-id",
          employerName: informalEmployers[Math.floor(Math.random() * informalEmployers.length)],
          employerType: "informal",
          sector: "informal",
          county,
          district: `${county} District ${Math.floor(Math.random() * 3) + 1}`,
          jobTitle: occ.title,
          iscoCode: occ.code,
          isicCode: null,
          employeeName: `${gender === "male" ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          employeeGender: gender,
          employeeAge: Math.floor(Math.random() * 35) + 18,
          contractType: "informal",
          startDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          endDate: Math.random() > 0.6 ? null : `${year + 1}-${String(Math.min(month + Math.floor(Math.random() * 6), 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          isActive: Math.random() > 0.4,
          monthlySalary: salary,
          currency: "LRD",
          verificationStatus: ["pending", "employer_verified", "enumerator_verified", "fully_verified"][Math.floor(Math.random() * 4)],
        } as any);
        const lastInf = spellEntries[spellEntries.length - 1] as any;
        const infScores: Record<string, string> = { pending: "0.300", employer_verified: "0.500", enumerator_verified: "0.700", fully_verified: "1.000" };
        lastInf.trustScore = infScores[lastInf.verificationStatus] || "0.300";
      }
    }

    for (const occ of seasonalOccupations) {
      const count = Math.floor((Math.random() * 5 + 3) * countyMultiplier);
      for (let i = 0; i < count; i++) {
        const gender = genders[Math.floor(Math.random() * 2)];
        const salary = Math.round(occ.salaryRange[0] + Math.random() * (occ.salaryRange[1] - occ.salaryRange[0]));
        const year = 2023 + Math.floor(Math.random() * 2);
        const startMonth = [3, 4, 5, 6, 9, 10][Math.floor(Math.random() * 6)];
        const day = Math.floor(Math.random() * 28) + 1;

        spellEntries.push({
          id: crypto.randomUUID(),
          reportedBy: "demo-admin-id",
          employerName: seasonalEmployers[Math.floor(Math.random() * seasonalEmployers.length)],
          employerType: "cooperative",
          sector: "seasonal",
          county,
          district: `${county} District ${Math.floor(Math.random() * 3) + 1}`,
          jobTitle: occ.title,
          iscoCode: occ.code,
          isicCode: null,
          employeeName: `${gender === "male" ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          employeeGender: gender,
          employeeAge: Math.floor(Math.random() * 30) + 18,
          contractType: "seasonal",
          startDate: `${year}-${String(startMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          endDate: `${year}-${String(Math.min(startMonth + Math.floor(Math.random() * 4) + 2, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          isActive: false,
          monthlySalary: salary,
          currency: "LRD",
          verificationStatus: ["pending", "employer_verified", "enumerator_verified"][Math.floor(Math.random() * 3)],
        } as any);
        const lastSeas = spellEntries[spellEntries.length - 1] as any;
        const seasScores: Record<string, string> = { pending: "0.300", employer_verified: "0.500", enumerator_verified: "0.700", fully_verified: "1.000" };
        lastSeas.trustScore = seasScores[lastSeas.verificationStatus] || "0.300";
      }
    }
  }

  const batchSize = 100;
  for (let i = 0; i < spellEntries.length; i += batchSize) {
    await db.insert(employmentSpells).values(spellEntries.slice(i, i + batchSize));
  }
  console.log(`Seeded ${spellEntries.length} informal/seasonal employment spells`);
}

// Standalone seed function for CLI
async function seed() {
  await initializeDemoData();
  console.log("\n=== DEMO ACCOUNTS ===");
  console.log("Password for all accounts: Demo@2025\n");
  console.log("| Role              | Email                        | Sector    |");
  console.log("|-------------------|------------------------------|-----------|");
  console.log("| Admin             | demo_admin@test.com          | All       |");
  console.log("| Ministry Verifier | demo_ministry@test.com       | All       |");
  console.log("| Private Employer  | demo_private@test.com        | Private   |");
  console.log("| Public Employer   | demo_public@test.com         | Public    |");
  console.log("| NGO Employer      | demo_ngo@test.com            | NGO       |");
  console.log("| Enumerator (Mont) | demo_enumerator@test.com     | Informal  |");
  console.log("| Enumerator (Nimba)| demo_enumerator2@test.com    | Informal  |");
  console.log("| Individual Worker | demo_individual@test.com     | Self      |");
  console.log("");
  process.exit(0);
}

// Only run if executed directly via CLI (npx tsx server/seed.ts)
const isMainModule = process.argv[1]?.endsWith("seed.ts");
if (isMainModule) {
  seed().catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  });
}
