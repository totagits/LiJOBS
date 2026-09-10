import { 
  type User, 
  type InsertUser, 
  type DashboardData, 
  type NationalStat, 
  type CountyData, 
  type MonthlyData, 
  type SectorData, 
  type ContractData,
  type EmploymentSpell,
  type InsertEmploymentSpell,
  type TrainingVideo,
  type InsertTrainingVideo,
  type CustomAvatar,
  type InsertCustomAvatar,
  type BaselineData,
  type InsertBaselineData,
  type IscoOccupation,
  type IsicIndustry,
  type District,
  type Employer,
  type InsertEmployer,
  type Vacancy,
  type InsertVacancy,
  type JobCreationEvent,
  type InsertJobCreationEvent,
  type AuditLog,
  type InsertAuditLog,
  type Person,
  type InsertPerson,
  type JobSeekerProfile,
  type InsertJobSeekerProfile,
  type Skill,
  type InsertSkill,
  type PersonSkill,
  type InsertPersonSkill,
  type Application,
  type InsertApplication,
  type PersonIdentity,
  type InsertPersonIdentity,
  type TrainingProvider,
  type InsertTrainingProvider,
  type Course,
  type InsertCourse,
  type PublicEmploymentCentre,
  type InsertPEC,
  type CourseLesson,
  type InsertCourseLesson,
  type CourseQuizQuestion,
  type InsertCourseQuizQuestion,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  type CourseQuizAttempt,
  type InsertCourseQuizAttempt,
  type CourseCertificate,
  type InsertCourseCertificate,
  users,
  employmentSpells,
  trainingVideos,
  customAvatars,
  baselineData,
  iscoOccupations,
  isicIndustries,
  districts,
  employers,
  vacancies,
  jobCreationEvents,
  auditLogs,
  persons,
  jobSeekerProfiles,
  skills,
  personSkills,
  applications,
  personIdentities,
  trainingProviders,
  courses,
  publicEmploymentCentres,
  courseLessons,
  courseQuizQuestions,
  courseEnrollments,
  courseQuizAttempts,
  courseCertificates,
  type LabourMarketIndicator,
  type InsertLabourMarketIndicator,
  type GrievanceCase,
  type InsertGrievanceCase,
  type KnowledgeBaseItem,
  type InsertKnowledgeBaseItem,
  type WorkplaceIncident,
  type InsertWorkplaceIncident,
  labourMarketIndicators,
  grievanceCases,
  knowledgeBaseItems,
  workplaceIncidents,
  tenders,
  tenderSubmissions,
  type Tender,
  type InsertTender,
  type TenderSubmission,
  type InsertTenderSubmission,
  type PriceEntry,
  type InsertPriceEntry,
  priceEntries,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, count, countDistinct, like, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getDashboardData(): Promise<DashboardData>;
  getNationalStats(): Promise<NationalStat[]>;
  getCounties(): Promise<CountyData[]>;
  getMonthlyData(): Promise<MonthlyData[]>;
  getSectorData(): Promise<SectorData[]>;
  getCountySectorData(county: string): Promise<SectorData[]>;
  createEmploymentSpell(spell: InsertEmploymentSpell): Promise<EmploymentSpell>;
  getEmploymentSpells(filters?: { reportedBy?: string; sector?: string; county?: string; verificationStatus?: string }): Promise<EmploymentSpell[]>;
  getEmploymentSpellById(id: string): Promise<EmploymentSpell | undefined>;
  updateEmploymentSpell(id: string, updates: Partial<EmploymentSpell>): Promise<EmploymentSpell | undefined>;
  getSpellsForVerification(role: string, userId?: string, filters?: { status?: string; county?: string; sector?: string; employer?: string }): Promise<EmploymentSpell[]>;
  getEmployerVerificationStats(employerId: string): Promise<{ reported: number; verified: number; flagged: number }>;
  getVerificationSummary(): Promise<{ pending: number; employerVerified: number; enumeratorVerified: number; fullyVerified: number; flagged: number; rejected: number }>;
  createTrainingVideo(video: InsertTrainingVideo): Promise<TrainingVideo>;
  getTrainingVideos(filters?: { targetAudience?: string; status?: string }): Promise<TrainingVideo[]>;
  getTrainingVideoById(id: string): Promise<TrainingVideo | undefined>;
  getTrainingVideoByScriptId(scriptId: string): Promise<TrainingVideo | undefined>;
  updateTrainingVideo(id: string, updates: Partial<TrainingVideo>): Promise<TrainingVideo | undefined>;
  deleteTrainingVideo(id: string): Promise<void>;
  getTrainingVideosByCourseId(courseId: string): Promise<TrainingVideo[]>;
  createCustomAvatar(avatar: InsertCustomAvatar): Promise<CustomAvatar>;
  getCustomAvatars(): Promise<CustomAvatar[]>;
  getCustomAvatarById(id: string): Promise<CustomAvatar | undefined>;
  updateCustomAvatar(id: string, updates: Partial<CustomAvatar>): Promise<CustomAvatar | undefined>;
  deleteCustomAvatar(id: string): Promise<void>;
  getBaselineData(category?: string): Promise<BaselineData[]>;
  getBaselineDataById(id: string): Promise<BaselineData | undefined>;
  createBaselineData(data: InsertBaselineData): Promise<BaselineData>;
  updateBaselineData(id: string, updates: Partial<BaselineData>): Promise<BaselineData | undefined>;
  deleteBaselineData(id: string): Promise<boolean>;
  // Reference data
  getIscoOccupations(search?: string): Promise<IscoOccupation[]>;
  getIsicIndustries(search?: string): Promise<IsicIndustry[]>;
  getDistricts(county?: string): Promise<District[]>;
  // Employers
  getEmployers(): Promise<Employer[]>;
  getEmployerById(id: string): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  updateEmployer(id: string, updates: Partial<Employer>): Promise<Employer | undefined>;
  // Vacancies
  getVacancies(filters?: { employerId?: string; county?: string; status?: string }): Promise<Vacancy[]>;
  getVacancyById(id: string): Promise<Vacancy | undefined>;
  createVacancy(vacancy: InsertVacancy): Promise<Vacancy>;
  updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy | undefined>;
  // Job Creation Events (Observatory)
  createJobCreationEvent(event: InsertJobCreationEvent): Promise<JobCreationEvent>;
  getJobCreationEvents(spellId?: string): Promise<JobCreationEvent[]>;
  updateJobCreationEvent(id: string, updates: Partial<JobCreationEvent>): Promise<JobCreationEvent | undefined>;
  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { entityType?: string; entityId?: string; actorUserId?: string }): Promise<AuditLog[]>;
  // National statistics page data (comprehensive)
  getNationalStatisticsData(): Promise<{
    keyIndicators: { label: string; value: string; description: string }[];
    sectorBreakdown: { sector: string; count: number; color: string }[];
    countyBreakdown: { county: string; count: number }[];
    contractTypes: { type: string; count: number }[];
    genderDistribution: { gender: string; count: number }[];
    verificationBreakdown: { status: string; count: number }[];
    formalityBreakdown: { type: string; count: number }[];
  }>;
  // Observatory statistics
  getObservatoryStats(): Promise<{
    totalSpells: number;
    activeSpells: number;
    verifiedSpells: number;
    selfReportedSpells: number;
    formalJobs: number;
    informalJobs: number;
    avgTrustScore: number;
    youthEmployment: number;
    femaleEmployment: number;
    pendingSpells: number;
    employerVerifiedSpells: number;
    enumeratorVerifiedSpells: number;
    flaggedSpells: number;
    rejectedSpells: number;
  }>;
  // Persons (Labour Exchange)
  createPerson(person: InsertPerson): Promise<Person>;
  getPersonById(id: string): Promise<Person | undefined>;
  getPersonByUserId(userId: string): Promise<Person | undefined>;
  updatePerson(id: string, updates: Partial<Person>): Promise<Person | undefined>;
  // Person Identities (PII Vault)
  createPersonIdentity(identity: InsertPersonIdentity): Promise<PersonIdentity>;
  getPersonIdentity(personId: string): Promise<PersonIdentity | undefined>;
  updatePersonIdentity(personId: string, updates: Partial<PersonIdentity>): Promise<PersonIdentity | undefined>;
  deletePersonIdentity(personId: string): Promise<boolean>;
  // Job Seeker Profiles
  createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile>;
  getJobSeekerProfile(personId: string): Promise<JobSeekerProfile | undefined>;
  updateJobSeekerProfile(personId: string, updates: Partial<JobSeekerProfile>): Promise<JobSeekerProfile | undefined>;
  getJobSeekers(filters?: { county?: string; isOpenToWork?: boolean }): Promise<(JobSeekerProfile & { person: Person })[]>;
  // Skills
  getSkills(category?: string): Promise<Skill[]>;
  getSkillByName(name: string): Promise<Skill | null>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  addPersonSkill(personSkill: InsertPersonSkill): Promise<PersonSkill>;
  getPersonSkills(personId: string): Promise<(PersonSkill & { skill: Skill })[]>;
  removePersonSkill(id: number): Promise<boolean>;
  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationById(id: string): Promise<Application | undefined>;
  getApplicationsByPerson(personId: string): Promise<Application[]>;
  getApplicationsByVacancy(vacancyId: string): Promise<Application[]>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;
  // Data Portal
  getDataPortalPostings(): Promise<{
    id: string;
    title: string;
    employerName: string;
    sector: string;
    county: string;
    contractType: string;
    openings: number;
    minSalary: number | null;
    maxSalary: number | null;
    currency: string;
    status: string;
    createdAt: string;
  }[]>;
  getDataPortalPostingsStats(): Promise<{
    total: number;
    bySector: Record<string, number>;
    byCounty: Record<string, number>;
  }>;
  getDataPortalSeekers(): Promise<{
    id: string;
    personUid: string;
    county: string;
    sex: string;
    isYouth: boolean;
    headline: string;
    highestEducation: string;
    yearsExperience: string;
    isOpenToWork: boolean;
    preferredSectors: string[];
    preferredCounties: string[];
    willingToRelocate: boolean;
    skillCount: number;
  }[]>;
  getDataPortalSeekersStats(): Promise<{
    total: number;
    openToWork: number;
    bySector: Record<string, number>;
    byCounty: Record<string, number>;
    byEducation: Record<string, number>;
  }>;
  // Training Providers
  getTrainingProviders(): Promise<TrainingProvider[]>;
  getTrainingProviderById(id: string): Promise<TrainingProvider | undefined>;
  createTrainingProvider(provider: InsertTrainingProvider): Promise<TrainingProvider>;
  updateTrainingProvider(id: string, updates: Partial<TrainingProvider>): Promise<TrainingProvider | undefined>;
  deleteTrainingProvider(id: string): Promise<boolean>;
  // Courses
  getCourses(providerId?: string): Promise<(Course & { providerName?: string })[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  // Public Employment Centres
  getPECs(): Promise<PublicEmploymentCentre[]>;
  getPECById(id: string): Promise<PublicEmploymentCentre | undefined>;
  createPEC(pec: InsertPEC): Promise<PublicEmploymentCentre>;
  updatePEC(id: string, updates: Partial<PublicEmploymentCentre>): Promise<PublicEmploymentCentre | undefined>;
  deletePEC(id: string): Promise<boolean>;
  // Course Lessons
  getCourseLessons(courseId: string): Promise<CourseLesson[]>;
  // Course Quiz Questions
  getCourseQuizQuestions(courseId: string): Promise<CourseQuizQuestion[]>;
  // Course Enrollments
  getEnrollment(id: string): Promise<CourseEnrollment | undefined>;
  getEnrollmentByCourseAndEmail(courseId: string, email: string): Promise<CourseEnrollment | undefined>;
  createEnrollment(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateEnrollment(id: string, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment | undefined>;
  // Quiz Attempts
  createQuizAttempt(attempt: InsertCourseQuizAttempt): Promise<CourseQuizAttempt>;
  getQuizAttempts(enrollmentId: string): Promise<CourseQuizAttempt[]>;
  // Certificates
  createCertificate(cert: InsertCourseCertificate): Promise<CourseCertificate>;
  getCertificate(enrollmentId: string): Promise<CourseCertificate | undefined>;
  getCertificateByNumber(certNumber: string): Promise<CourseCertificate | undefined>;
  // Labour Market Indicators
  getLabourMarketIndicators(): Promise<LabourMarketIndicator[]>;
  getLabourMarketIndicatorById(id: number): Promise<LabourMarketIndicator | undefined>;
  createLabourMarketIndicator(data: InsertLabourMarketIndicator): Promise<LabourMarketIndicator>;
  updateLabourMarketIndicator(id: number, updates: Partial<LabourMarketIndicator>): Promise<LabourMarketIndicator | undefined>;
  deleteLabourMarketIndicator(id: number): Promise<boolean>;
  // Grievance Cases
  getGrievanceCases(filters?: { status?: string; county?: string }): Promise<GrievanceCase[]>;
  getGrievanceCaseById(id: string): Promise<GrievanceCase | undefined>;
  getGrievanceCaseByTracking(trackingNumber: string): Promise<GrievanceCase | undefined>;
  createGrievanceCase(data: InsertGrievanceCase): Promise<GrievanceCase>;
  updateGrievanceCase(id: string, updates: Partial<GrievanceCase>): Promise<GrievanceCase | undefined>;
  // Knowledge Base Items
  getKnowledgeBaseItems(filters?: { category?: string; isPublished?: boolean }): Promise<KnowledgeBaseItem[]>;
  getKnowledgeBaseItemById(id: number): Promise<KnowledgeBaseItem | undefined>;
  createKnowledgeBaseItem(data: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem>;
  updateKnowledgeBaseItem(id: number, updates: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem | undefined>;
  deleteKnowledgeBaseItem(id: number): Promise<boolean>;
  // Workplace Incidents
  getWorkplaceIncidents(filters?: { status?: string; county?: string; severity?: string }): Promise<WorkplaceIncident[]>;
  getWorkplaceIncidentById(id: number): Promise<WorkplaceIncident | undefined>;
  createWorkplaceIncident(data: InsertWorkplaceIncident): Promise<WorkplaceIncident>;
  updateWorkplaceIncident(id: number, updates: Partial<WorkplaceIncident>): Promise<WorkplaceIncident | undefined>;
  // Tenders & Bidding
  getTenders(filters?: { employerId?: string; type?: string; status?: string; county?: string }): Promise<Tender[]>;
  getTenderById(id: string): Promise<Tender | undefined>;
  createTender(data: InsertTender): Promise<Tender>;
  updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined>;
  deleteTender(id: string): Promise<boolean>;
  getTenderSubmissions(tenderId: string): Promise<TenderSubmission[]>;
  getTenderSubmissionById(id: string): Promise<TenderSubmission | undefined>;
  getTenderSubmissionsByBidder(bidderId: string): Promise<TenderSubmission[]>;
  createTenderSubmission(data: InsertTenderSubmission): Promise<TenderSubmission>;
  updateTenderSubmission(id: string, updates: Partial<TenderSubmission>): Promise<TenderSubmission | undefined>;

  // Price Entries / Economic Indicators
  getPriceEntries(filters?: { county?: string; month?: number; year?: number; category?: string }): Promise<PriceEntry[]>;
  createPriceEntry(data: InsertPriceEntry): Promise<PriceEntry>;
  createPriceEntriesBulk(data: InsertPriceEntry[]): Promise<PriceEntry[]>;
  updatePriceEntry(id: number, updates: Partial<PriceEntry>): Promise<PriceEntry | undefined>;
  deletePriceEntry(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createEmploymentSpell(spell: InsertEmploymentSpell): Promise<EmploymentSpell> {
    const result = await db.insert(employmentSpells).values(spell).returning();
    return result[0];
  }

  async getEmploymentSpells(filters?: { reportedBy?: string; sector?: string; county?: string; verificationStatus?: string }): Promise<EmploymentSpell[]> {
    const conditions = [];
    if (filters?.reportedBy) {
      conditions.push(eq(employmentSpells.reportedBy, filters.reportedBy));
    }
    if (filters?.verificationStatus) {
      conditions.push(eq(employmentSpells.verificationStatus, filters.verificationStatus));
    }
    if (filters?.sector) {
      conditions.push(eq(employmentSpells.sector, filters.sector));
    }
    if (filters?.county) {
      conditions.push(eq(employmentSpells.county, filters.county));
    }
    if (conditions.length > 0) {
      return await db.select().from(employmentSpells).where(and(...conditions));
    }
    return await db.select().from(employmentSpells);
  }

  async getEmploymentSpellById(id: string): Promise<EmploymentSpell | undefined> {
    const result = await db.select().from(employmentSpells).where(eq(employmentSpells.id, id)).limit(1);
    return result[0];
  }

  async updateEmploymentSpell(id: string, updates: Partial<EmploymentSpell>): Promise<EmploymentSpell | undefined> {
    const result = await db.update(employmentSpells).set({ ...updates, updatedAt: new Date() }).where(eq(employmentSpells.id, id)).returning();
    return result[0];
  }

  async getSpellsForVerification(role: string, userId?: string, filters?: { status?: string; county?: string; sector?: string; employer?: string }): Promise<EmploymentSpell[]> {
    const conditions: any[] = [];

    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(employmentSpells.verificationStatus, filters.status));
    } else {
      if (role === "employer") {
        conditions.push(eq(employmentSpells.verificationStatus, "pending"));
      } else if (role === "enumerator") {
        // no default status filter — enumerators see all statuses
      } else if (role === "ministry" || role === "admin" || role === "director") {
        conditions.push(eq(employmentSpells.verificationStatus, "enumerator_verified"));
      } else {
        return [];
      }
    }

    if (filters?.county) {
      conditions.push(eq(employmentSpells.county, filters.county));
    }
    if (filters?.sector) {
      conditions.push(eq(employmentSpells.sector, filters.sector));
    }
    if (filters?.employer) {
      conditions.push(like(employmentSpells.employerName, `%${filters.employer}%`));
    }

    const query = db.select().from(employmentSpells);
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(employmentSpells.createdAt)).limit(200);
    }
    return await query.orderBy(desc(employmentSpells.createdAt)).limit(200);
  }

  async getEmployerVerificationStats(employerId: string): Promise<{ reported: number; verified: number; flagged: number }> {
    const allSpells = await db.select().from(employmentSpells).where(eq(employmentSpells.employerId, employerId));
    const reported = allSpells.length;
    const verified = allSpells.filter(s => s.verificationStatus === "fully_verified").length;
    const flagged = allSpells.filter(s => s.discrepancyFlag).length;
    return { reported, verified, flagged };
  }

  async getVerificationSummary(): Promise<{ pending: number; employerVerified: number; enumeratorVerified: number; fullyVerified: number; flagged: number; rejected: number }> {
    const rows = await db
      .select({ status: employmentSpells.verificationStatus, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.verificationStatus);
    const statusMap: Record<string, number> = {};
    rows.forEach(r => { statusMap[r.status] = r.count; });
    return {
      pending: statusMap["pending"] || 0,
      employerVerified: statusMap["employer_verified"] || 0,
      enumeratorVerified: statusMap["enumerator_verified"] || 0,
      fullyVerified: statusMap["fully_verified"] || 0,
      flagged: statusMap["flagged"] || 0,
      rejected: statusMap["rejected"] || 0,
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async createTrainingVideo(video: InsertTrainingVideo): Promise<TrainingVideo> {
    const result = await db.insert(trainingVideos).values(video).returning();
    return result[0];
  }

  async getTrainingVideos(filters?: { targetAudience?: string; status?: string }): Promise<TrainingVideo[]> {
    const conditions = [];
    
    if (filters?.targetAudience) {
      conditions.push(eq(trainingVideos.targetAudience, filters.targetAudience));
    }
    if (filters?.status) {
      conditions.push(eq(trainingVideos.status, filters.status));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(trainingVideos);
    }
    
    if (conditions.length === 1) {
      return await db.select().from(trainingVideos).where(conditions[0]);
    }
    
    return await db.select().from(trainingVideos).where(and(...conditions));
  }

  async getTrainingVideoById(id: string): Promise<TrainingVideo | undefined> {
    const result = await db.select().from(trainingVideos).where(eq(trainingVideos.id, id)).limit(1);
    return result[0];
  }

  async getTrainingVideoByScriptId(scriptId: string): Promise<TrainingVideo | undefined> {
    const result = await db.select().from(trainingVideos).where(eq(trainingVideos.scriptId, scriptId)).limit(1);
    return result[0];
  }

  async updateTrainingVideo(id: string, updates: Partial<TrainingVideo>): Promise<TrainingVideo | undefined> {
    const result = await db.update(trainingVideos).set({ ...updates, updatedAt: new Date() }).where(eq(trainingVideos.id, id)).returning();
    return result[0];
  }

  async deleteTrainingVideo(id: string): Promise<void> {
    await db.delete(trainingVideos).where(eq(trainingVideos.id, id));
  }

  async getTrainingVideosByCourseId(courseId: string): Promise<TrainingVideo[]> {
    return await db.select().from(trainingVideos)
      .where(and(eq(trainingVideos.courseId, courseId), eq(trainingVideos.status, "completed")));
  }

  async getNationalStats(): Promise<NationalStat[]> {
    // Get real stats from employment_spells table
    const [totalJobsResult] = await db.select({ count: count() }).from(employmentSpells);
    const totalJobs = totalJobsResult?.count || 0;

    // Count unique employers
    const [employersResult] = await db.select({ count: countDistinct(employmentSpells.employerName) }).from(employmentSpells);
    const totalEmployers = employersResult?.count || 0;

    // Count verified positions
    const [verifiedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "fully_verified"));
    const verifiedCount = verifiedResult?.count || 0;
    const verificationRate = totalJobs > 0 ? Math.round((verifiedCount / totalJobs) * 100) : 0;

    // Count unique counties covered
    const [countiesResult] = await db.select({ count: countDistinct(employmentSpells.county) }).from(employmentSpells);
    const countiesCovered = countiesResult?.count || 0;

    // Count workers with names (unique employees)
    const [workersResult] = await db.select({ count: countDistinct(employmentSpells.employeeName) }).from(employmentSpells);
    const totalWorkers = workersResult?.count || 0;

    // Count unique sectors
    const [sectorsResult] = await db.select({ count: countDistinct(employmentSpells.sector) }).from(employmentSpells);
    const sectorsCovered = sectorsResult?.count || 0;

    // Count registered employers from users table
    const [registeredEmployersResult] = await db.select({ count: count() }).from(users).where(eq(users.role, "employer"));
    const registeredEmployers = registeredEmployersResult?.count || 0;

    // Count total job postings (vacancies)
    const [vacanciesResult] = await db.select({ count: count() }).from(vacancies);
    const totalVacancies = vacanciesResult?.count || 0;

    // Count job seekers (people with job seeker profiles who are open to work)
    const [jobSeekersResult] = await db.select({ count: count() }).from(jobSeekerProfiles).where(eq(jobSeekerProfiles.isOpenToWork, true));
    const totalJobSeekers = jobSeekersResult?.count || 0;

    return [
      {
        id: "total-jobs",
        label: "Total Jobs Tracked",
        value: totalJobs,
        change: 0,
        changeLabel: "employment spells",
        icon: "Briefcase",
        color: "text-blue-500",
      },
      {
        id: "employers",
        label: "Registered Employers",
        value: registeredEmployers,
        change: 0,
        changeLabel: "in system",
        icon: "Building2",
        color: "text-emerald-500",
      },
      {
        id: "verified",
        label: "Verified Positions",
        value: verificationRate,
        suffix: "%",
        change: 0,
        changeLabel: `${verifiedCount} verified`,
        icon: "BadgeCheck",
        color: "text-violet-500",
      },
      {
        id: "counties",
        label: "Counties Covered",
        value: countiesCovered,
        suffix: "/15",
        change: 0,
        changeLabel: countiesCovered === 15 ? "full coverage" : "partial coverage",
        icon: "MapPin",
        color: "text-amber-500",
      },
      {
        id: "workers",
        label: "Workers Registered",
        value: totalWorkers,
        change: 0,
        changeLabel: "unique workers",
        icon: "Users",
        color: "text-rose-500",
      },
      {
        id: "sectors",
        label: "Economic Sectors",
        value: sectorsCovered > 0 ? sectorsCovered : 5,
        change: 0,
        changeLabel: "LiJOBS sectors",
        icon: "Activity",
        color: "text-cyan-500",
      },
      {
        id: "vacancies",
        label: "Job Postings",
        value: totalVacancies,
        change: 0,
        changeLabel: "active vacancies",
        icon: "FileText",
        color: "text-indigo-500",
      },
      {
        id: "job-seekers",
        label: "Job Seekers",
        value: totalJobSeekers,
        change: 0,
        changeLabel: "looking for work",
        icon: "UserSearch",
        color: "text-orange-500",
      },
    ];
  }

  async getCounties(): Promise<CountyData[]> {
    const countyColors: Record<string, string> = {
      "Montserrado": "bg-blue-500",
      "Nimba": "bg-emerald-500",
      "Bong": "bg-amber-500",
      "Lofa": "bg-violet-500",
      "Grand Bassa": "bg-rose-500",
      "Margibi": "bg-cyan-500",
      "Grand Cape Mount": "bg-orange-500",
      "Bomi": "bg-indigo-500",
      "Grand Gedeh": "bg-teal-500",
      "Sinoe": "bg-pink-500",
      "River Cess": "bg-lime-500",
      "Gbarpolu": "bg-sky-500",
      "Maryland": "bg-fuchsia-500",
      "Grand Kru": "bg-yellow-500",
      "River Gee": "bg-red-500",
    };

    // Get job counts by county from employment_spells
    const jobsByCounty = await db
      .select({
        county: employmentSpells.county,
        jobs: count(),
        employers: countDistinct(employmentSpells.employerName),
      })
      .from(employmentSpells)
      .groupBy(employmentSpells.county);

    // Get population data from baseline_data
    const populations = await db
      .select()
      .from(baselineData)
      .where(eq(baselineData.category, "county_population"));

    const populationMap = new Map(populations.map(p => [p.key, p.value]));

    // All 15 Liberian counties
    const allCounties = [
      "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa",
      "Margibi", "Grand Cape Mount", "Bomi", "Grand Gedeh",
      "Sinoe", "River Cess", "Gbarpolu", "Maryland", "Grand Kru", "River Gee"
    ];

    const jobsMap = new Map(jobsByCounty.map(c => [c.county, { jobs: c.jobs, employers: c.employers }]));

    return allCounties.map(name => {
      const data = jobsMap.get(name) || { jobs: 0, employers: 0 };
      const population = populationMap.get(name) || 0;
      
      return {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        jobs: data.jobs,
        employers: data.employers,
        growth: 0, // Would need historical data to calculate
        color: countyColors[name] || "bg-gray-500",
        population: population,
      };
    });
  }

  async getMonthlyData(): Promise<MonthlyData[]> {
    // Return empty placeholder data - monthly trends require historical data collection
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => ({
      month,
      jobs: 0,
      formal: 0,
      informal: 0,
    }));
  }

  async getSectorData(): Promise<SectorData[]> {
    const sectorColors: Record<string, string> = {
      "private": "#3b82f6",
      "public": "#8b5cf6",
      "ngo": "#06b6d4",
      "informal": "#f59e0b",
      "seasonal": "#22c55e",
    };

    const sectorLabels: Record<string, string> = {
      "private": "Private",
      "public": "Public",
      "ngo": "NGO/Projects",
      "informal": "Informal",
      "seasonal": "Seasonal",
    };

    // Get job counts by sector from employment_spells
    const jobsBySector = await db
      .select({
        sector: employmentSpells.sector,
        jobs: count(),
      })
      .from(employmentSpells)
      .groupBy(employmentSpells.sector);

    // Get vacancy (job postings) counts by sector - join vacancies with employers
    const vacanciesBySector = await db
      .select({
        sector: employers.sector,
        postings: count(),
      })
      .from(vacancies)
      .innerJoin(employers, eq(vacancies.employerId, employers.id))
      .groupBy(employers.sector);

    // All 5 LiJOBS sectors
    const allSectors = ["private", "public", "ngo", "informal", "seasonal"];
    const sectorMap = new Map(jobsBySector.map(s => [s.sector, s.jobs]));
    const vacancyMap = new Map(vacanciesBySector.map(s => [s.sector, s.postings]));

    return allSectors.map(sector => ({
      sector: sectorLabels[sector] || sector,
      jobs: sectorMap.get(sector) || 0,
      postings: vacancyMap.get(sector) || 0,
      color: sectorColors[sector] || "#6b7280",
    }));
  }

  async getCountySectorData(county: string): Promise<SectorData[]> {
    const sectorColors: Record<string, string> = {
      "private": "#3b82f6",
      "public": "#8b5cf6",
      "ngo": "#06b6d4",
      "informal": "#f59e0b",
      "seasonal": "#22c55e",
    };

    const sectorLabels: Record<string, string> = {
      "private": "Private",
      "public": "Public",
      "ngo": "NGO/Projects",
      "informal": "Informal",
      "seasonal": "Seasonal",
    };

    // Get job counts by sector for this specific county
    const jobsBySector = await db
      .select({
        sector: employmentSpells.sector,
        jobs: count(),
      })
      .from(employmentSpells)
      .where(eq(employmentSpells.county, county))
      .groupBy(employmentSpells.sector);

    // All 5 LiJOBS sectors
    const allSectors = ["private", "public", "ngo", "informal", "seasonal"];
    const sectorMap = new Map(jobsBySector.map(s => [s.sector, s.jobs]));

    return allSectors.map(sector => ({
      sector: sectorLabels[sector] || sector,
      jobs: sectorMap.get(sector) || 0,
      color: sectorColors[sector] || "#6b7280",
    }));
  }

  async getDashboardData(): Promise<DashboardData> {
    const [stats, counties, monthlyData, sectorData] = await Promise.all([
      this.getNationalStats(),
      this.getCounties(),
      this.getMonthlyData(),
      this.getSectorData(),
    ]);

    // Contract data placeholder - calculated from employment_spells when data available
    const contractData: ContractData[] = [
      { name: "Permanent", value: 0, color: "#22c55e" },
      { name: "Fixed-term", value: 0, color: "#3b82f6" },
      { name: "Seasonal", value: 0, color: "#f59e0b" },
      { name: "Casual", value: 0, color: "#8b5cf6" },
    ];

    return {
      stats,
      counties,
      monthlyData,
      sectorData,
      contractData,
      lastUpdated: new Date().toISOString(),
    };
  }

  async createCustomAvatar(avatar: InsertCustomAvatar): Promise<CustomAvatar> {
    const result = await db.insert(customAvatars).values({
      ...avatar,
      id: randomUUID(),
    }).returning();
    return result[0];
  }

  async getCustomAvatars(): Promise<CustomAvatar[]> {
    return await db.select().from(customAvatars).orderBy(customAvatars.createdAt);
  }

  async getCustomAvatarById(id: string): Promise<CustomAvatar | undefined> {
    const result = await db.select().from(customAvatars).where(eq(customAvatars.id, id)).limit(1);
    return result[0];
  }

  async updateCustomAvatar(id: string, updates: Partial<CustomAvatar>): Promise<CustomAvatar | undefined> {
    const result = await db.update(customAvatars)
      .set(updates)
      .where(eq(customAvatars.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomAvatar(id: string): Promise<void> {
    await db.delete(customAvatars).where(eq(customAvatars.id, id));
  }

  async getBaselineData(category?: string): Promise<BaselineData[]> {
    if (category) {
      return await db.select().from(baselineData).where(eq(baselineData.category, category));
    }
    return await db.select().from(baselineData);
  }

  async getBaselineDataById(id: string): Promise<BaselineData | undefined> {
    const result = await db.select().from(baselineData).where(eq(baselineData.id, id)).limit(1);
    return result[0];
  }

  async createBaselineData(data: InsertBaselineData): Promise<BaselineData> {
    const result = await db.insert(baselineData).values({
      ...data,
      id: randomUUID(),
    }).returning();
    return result[0];
  }

  async updateBaselineData(id: string, updates: Partial<BaselineData>): Promise<BaselineData | undefined> {
    const result = await db.update(baselineData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(baselineData.id, id))
      .returning();
    return result[0];
  }

  async deleteBaselineData(id: string): Promise<boolean> {
    const result = await db.delete(baselineData).where(eq(baselineData.id, id)).returning();
    return result.length > 0;
  }

  // Reference data methods
  async getIscoOccupations(search?: string): Promise<IscoOccupation[]> {
    if (search) {
      return await db.select().from(iscoOccupations)
        .where(like(iscoOccupations.title, `%${search}%`))
        .orderBy(asc(iscoOccupations.code));
    }
    return await db.select().from(iscoOccupations).orderBy(asc(iscoOccupations.code));
  }

  async getIsicIndustries(search?: string): Promise<IsicIndustry[]> {
    if (search) {
      return await db.select().from(isicIndustries)
        .where(like(isicIndustries.title, `%${search}%`))
        .orderBy(asc(isicIndustries.code));
    }
    return await db.select().from(isicIndustries).orderBy(asc(isicIndustries.code));
  }

  async getDistricts(county?: string): Promise<District[]> {
    if (county) {
      return await db.select().from(districts)
        .where(eq(districts.countyName, county))
        .orderBy(asc(districts.name));
    }
    return await db.select().from(districts).orderBy(asc(districts.countyName), asc(districts.name));
  }

  // Employers methods
  async getEmployers(): Promise<Employer[]> {
    return await db.select().from(employers).orderBy(desc(employers.createdAt));
  }

  async getEmployerById(id: string): Promise<Employer | undefined> {
    const result = await db.select().from(employers).where(eq(employers.id, id)).limit(1);
    return result[0];
  }

  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    const result = await db.insert(employers).values(employer).returning();
    return result[0];
  }

  async updateEmployer(id: string, updates: Partial<Employer>): Promise<Employer | undefined> {
    const result = await db.update(employers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    return result[0];
  }

  // Vacancies methods
  async getVacancies(filters?: { employerId?: string; county?: string; status?: string }): Promise<Vacancy[]> {
    const conditions = [];
    if (filters?.employerId) conditions.push(eq(vacancies.employerId, filters.employerId));
    if (filters?.county) conditions.push(eq(vacancies.county, filters.county));
    if (filters?.status) conditions.push(eq(vacancies.status, filters.status));

    if (conditions.length === 0) {
      return await db.select().from(vacancies).orderBy(desc(vacancies.postedAt));
    }
    if (conditions.length === 1) {
      return await db.select().from(vacancies).where(conditions[0]).orderBy(desc(vacancies.postedAt));
    }
    return await db.select().from(vacancies).where(and(...conditions)).orderBy(desc(vacancies.postedAt));
  }

  async getVacancyById(id: string): Promise<Vacancy | undefined> {
    const result = await db.select().from(vacancies).where(eq(vacancies.id, id)).limit(1);
    return result[0];
  }

  async createVacancy(vacancy: InsertVacancy): Promise<Vacancy> {
    const result = await db.insert(vacancies).values(vacancy).returning();
    return result[0];
  }

  async updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy | undefined> {
    const result = await db.update(vacancies)
      .set(updates)
      .where(eq(vacancies.id, id))
      .returning();
    return result[0];
  }

  // Job Creation Events methods
  async createJobCreationEvent(event: InsertJobCreationEvent): Promise<JobCreationEvent> {
    const result = await db.insert(jobCreationEvents).values(event).returning();
    return result[0];
  }

  async getJobCreationEvents(spellId?: string): Promise<JobCreationEvent[]> {
    if (spellId) {
      return await db.select().from(jobCreationEvents)
        .where(eq(jobCreationEvents.spellId, spellId))
        .orderBy(desc(jobCreationEvents.reportedAt));
    }
    return await db.select().from(jobCreationEvents).orderBy(desc(jobCreationEvents.reportedAt));
  }

  async updateJobCreationEvent(id: string, updates: Partial<JobCreationEvent>): Promise<JobCreationEvent | undefined> {
    const result = await db.update(jobCreationEvents)
      .set(updates)
      .where(eq(jobCreationEvents.id, id))
      .returning();
    return result[0];
  }

  // Audit logging methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogs(filters?: { entityType?: string; entityId?: string; actorUserId?: string }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters?.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
    if (filters?.actorUserId) conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));

    if (conditions.length === 0) {
      return await db.select().from(auditLogs).orderBy(desc(auditLogs.occurredAt)).limit(1000);
    }
    if (conditions.length === 1) {
      return await db.select().from(auditLogs).where(conditions[0]).orderBy(desc(auditLogs.occurredAt)).limit(1000);
    }
    return await db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.occurredAt)).limit(1000);
  }

  // National statistics page - comprehensive data from real records
  async getNationalStatisticsData() {
    const sectorLabels: Record<string, string> = {
      "private": "Private", "public": "Public", "ngo": "NGO/Projects",
      "informal": "Informal", "seasonal": "Seasonal",
    };
    const sectorColors: Record<string, string> = {
      "Private": "#3b82f6", "Public": "#8b5cf6", "NGO/Projects": "#06b6d4",
      "Informal": "#f59e0b", "Seasonal": "#22c55e",
    };

    // Key indicator counts
    const [totalSpells] = await db.select({ count: count() }).from(employmentSpells);
    const [activeSpells] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.isActive, true));
    const [verifiedSpells] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "fully_verified"));
    const [formalSpells] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.formalIndicator, "formal"));
    const [informalSpells] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.formalIndicator, "informal"));
    const [totalEmployersCount] = await db.select({ count: count() }).from(employers);
    const [totalVacancies] = await db.select({ count: count() }).from(vacancies);
    const [totalJobSeekers] = await db.select({ count: count() }).from(jobSeekerProfiles);
    const [uniqueWorkers] = await db.select({ count: countDistinct(employmentSpells.employeeName) }).from(employmentSpells);

    const total = totalSpells?.count || 0;
    const active = activeSpells?.count || 0;
    const verified = verifiedSpells?.count || 0;
    const formal = formalSpells?.count || 0;
    const informal = informalSpells?.count || 0;

    const keyIndicators = [
      { label: "Total Employment Spells", value: total.toLocaleString(), description: "Total jobs recorded across all sectors" },
      { label: "Active Positions", value: active.toLocaleString(), description: "Currently active employment records" },
      { label: "Verified Records", value: verified.toLocaleString(), description: `${total > 0 ? Math.round((verified / total) * 100) : 0}% verification rate` },
      { label: "Formal Employment", value: formal.toLocaleString(), description: "Registered formal sector jobs" },
      { label: "Registered Employers", value: (totalEmployersCount?.count || 0).toLocaleString(), description: "Employers in the system" },
      { label: "Job Vacancies", value: (totalVacancies?.count || 0).toLocaleString(), description: "Open positions posted" },
      { label: "Job Seekers", value: (totalJobSeekers?.count || 0).toLocaleString(), description: "Registered job seekers" },
      { label: "Unique Workers", value: (uniqueWorkers?.count || 0).toLocaleString(), description: "Individual workers tracked" },
    ];

    // Sector breakdown
    const sectorRows = await db
      .select({ sector: employmentSpells.sector, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.sector);
    const sectorBreakdown = sectorRows.map(r => ({
      sector: sectorLabels[r.sector] || r.sector,
      count: r.count,
      color: sectorColors[sectorLabels[r.sector] || r.sector] || "#6b7280",
    }));

    // County breakdown
    const countyRows = await db
      .select({ county: employmentSpells.county, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.county)
      .orderBy(desc(count()));
    const countyBreakdown = countyRows.map(r => ({ county: r.county, count: r.count }));

    // Contract types
    const contractRows = await db
      .select({ type: employmentSpells.contractType, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.contractType);
    const contractTypes = contractRows.map(r => ({ type: r.type, count: r.count }));

    // Gender distribution
    const genderRows = await db
      .select({ gender: employmentSpells.employeeGender, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.employeeGender);
    const genderDistribution = genderRows
      .filter(r => r.gender)
      .map(r => ({ gender: r.gender!, count: r.count }));

    // Verification breakdown
    const verificationRows = await db
      .select({ status: employmentSpells.verificationStatus, count: count() })
      .from(employmentSpells)
      .groupBy(employmentSpells.verificationStatus);
    const verificationBreakdown = verificationRows.map(r => ({ status: r.status, count: r.count }));

    // Formality breakdown
    const formalityBreakdown = [
      { type: "Formal", count: formal },
      { type: "Informal", count: informal },
      { type: "Unknown", count: total - formal - informal },
    ].filter(r => r.count > 0);

    return { keyIndicators, sectorBreakdown, countyBreakdown, contractTypes, genderDistribution, verificationBreakdown, formalityBreakdown };
  }

  // Observatory statistics
  async getObservatoryStats(): Promise<{
    totalSpells: number;
    activeSpells: number;
    verifiedSpells: number;
    selfReportedSpells: number;
    formalJobs: number;
    informalJobs: number;
    avgTrustScore: number;
    youthEmployment: number;
    femaleEmployment: number;
    pendingSpells: number;
    employerVerifiedSpells: number;
    enumeratorVerifiedSpells: number;
    flaggedSpells: number;
    rejectedSpells: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(employmentSpells);
    const [activeResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.isActive, true));
    const [verifiedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "fully_verified"));
    const [selfReportedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "pending"));
    const [formalResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.formalIndicator, "formal"));
    const [informalResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.formalIndicator, "informal"));
    const [youthResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.employeeIsYouth, true));
    const [femaleResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.employeeGender, "female"));
    const [employerVerifiedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "employer_verified"));
    const [enumeratorVerifiedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "enumerator_verified"));
    const [flaggedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "flagged"));
    const [rejectedResult] = await db.select({ count: count() }).from(employmentSpells).where(eq(employmentSpells.verificationStatus, "rejected"));

    const trustScores = await db.select({ trustScore: employmentSpells.trustScore }).from(employmentSpells);
    const avgTrustScore = trustScores.length > 0 
      ? trustScores.reduce((sum, s) => sum + (parseFloat(s.trustScore as string) || 0.3), 0) / trustScores.length 
      : 0;

    return {
      totalSpells: totalResult?.count || 0,
      activeSpells: activeResult?.count || 0,
      verifiedSpells: verifiedResult?.count || 0,
      selfReportedSpells: selfReportedResult?.count || 0,
      formalJobs: formalResult?.count || 0,
      informalJobs: informalResult?.count || 0,
      avgTrustScore: Math.round(avgTrustScore * 100) / 100,
      youthEmployment: youthResult?.count || 0,
      femaleEmployment: femaleResult?.count || 0,
      pendingSpells: selfReportedResult?.count || 0,
      employerVerifiedSpells: employerVerifiedResult?.count || 0,
      enumeratorVerifiedSpells: enumeratorVerifiedResult?.count || 0,
      flaggedSpells: flaggedResult?.count || 0,
      rejectedSpells: rejectedResult?.count || 0,
    };
  }

  // Persons (Labour Exchange)
  async createPerson(person: InsertPerson): Promise<Person> {
    const personUid = `LBR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const result = await db.insert(persons).values({ ...person, personUid }).returning();
    return result[0];
  }

  async getPersonById(id: string): Promise<Person | undefined> {
    const result = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
    return result[0];
  }

  async getPersonByUserId(userId: string): Promise<Person | undefined> {
    const result = await db.select().from(persons).where(eq(persons.userId, userId)).limit(1);
    return result[0];
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<Person | undefined> {
    const result = await db.update(persons).set(updates).where(eq(persons.id, id)).returning();
    return result[0];
  }

  // Person Identities (PII Vault)
  async createPersonIdentity(identity: InsertPersonIdentity): Promise<PersonIdentity> {
    const result = await db.insert(personIdentities).values({
      ...identity,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getPersonIdentity(personId: string): Promise<PersonIdentity | undefined> {
    const result = await db.select().from(personIdentities).where(eq(personIdentities.personId, personId)).limit(1);
    return result[0];
  }

  async updatePersonIdentity(personId: string, updates: Partial<PersonIdentity>): Promise<PersonIdentity | undefined> {
    const result = await db.update(personIdentities).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(personIdentities.personId, personId)).returning();
    return result[0];
  }

  async deletePersonIdentity(personId: string): Promise<boolean> {
    const result = await db.delete(personIdentities).where(eq(personIdentities.personId, personId)).returning();
    return result.length > 0;
  }

  // Job Seeker Profiles
  async createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile> {
    const result = await db.insert(jobSeekerProfiles).values({ ...profile, updatedAt: new Date() }).returning();
    return result[0];
  }

  async getJobSeekerProfile(personId: string): Promise<JobSeekerProfile | undefined> {
    const result = await db.select().from(jobSeekerProfiles).where(eq(jobSeekerProfiles.personId, personId)).limit(1);
    return result[0];
  }

  async updateJobSeekerProfile(personId: string, updates: Partial<JobSeekerProfile>): Promise<JobSeekerProfile | undefined> {
    const result = await db.update(jobSeekerProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(jobSeekerProfiles.personId, personId)).returning();
    return result[0];
  }

  async getJobSeekers(filters?: { county?: string; isOpenToWork?: boolean }): Promise<(JobSeekerProfile & { person: Person })[]> {
    const conditions = [];
    if (filters?.isOpenToWork !== undefined) {
      conditions.push(eq(jobSeekerProfiles.isOpenToWork, filters.isOpenToWork));
    }
    
    const result = await db
      .select()
      .from(jobSeekerProfiles)
      .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return result
      .filter(r => !filters?.county || r.persons.county === filters.county)
      .map(r => ({ ...r.job_seeker_profiles, person: r.persons }));
  }

  // Skills
  async getSkills(category?: string): Promise<Skill[]> {
    if (category) {
      return await db.select().from(skills).where(eq(skills.category, category));
    }
    return await db.select().from(skills);
  }

  async getSkillByName(name: string): Promise<Skill | null> {
    const result = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
    return result[0] || null;
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const result = await db.insert(skills).values(skill).returning();
    return result[0];
  }

  async addPersonSkill(personSkill: InsertPersonSkill): Promise<PersonSkill> {
    const result = await db.insert(personSkills).values(personSkill).returning();
    return result[0];
  }

  async getPersonSkills(personId: string): Promise<(PersonSkill & { skill: Skill })[]> {
    const result = await db
      .select()
      .from(personSkills)
      .innerJoin(skills, eq(personSkills.skillId, skills.id))
      .where(eq(personSkills.personId, personId));
    
    return result.map(r => ({ ...r.person_skills, skill: r.skills }));
  }

  async removePersonSkill(id: number): Promise<boolean> {
    const result = await db.delete(personSkills).where(eq(personSkills.id, id)).returning();
    return result.length > 0;
  }

  // Applications
  async createApplication(application: InsertApplication): Promise<Application> {
    const result = await db.insert(applications).values(application).returning();
    return result[0];
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return result[0];
  }

  async getApplicationsByPerson(personId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.personId, personId)).orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByVacancy(vacancyId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.vacancyId, vacancyId)).orderBy(desc(applications.appliedAt));
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
    const result = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return result[0];
  }

  // Data Portal - Job Postings
  async getDataPortalPostings(): Promise<{
    id: string;
    title: string;
    employerName: string;
    sector: string;
    county: string;
    contractType: string;
    openings: number;
    minSalary: number | null;
    maxSalary: number | null;
    currency: string;
    status: string;
    createdAt: string;
  }[]> {
    const result = await db
      .select({
        id: vacancies.id,
        title: vacancies.title,
        employerName: employers.legalName,
        sector: employers.sector,
        county: vacancies.county,
        contractType: vacancies.contractType,
        openings: vacancies.openings,
        minSalary: vacancies.minSalary,
        maxSalary: vacancies.maxSalary,
        currency: vacancies.currency,
        status: vacancies.status,
        postedAt: vacancies.postedAt,
      })
      .from(vacancies)
      .innerJoin(employers, eq(vacancies.employerId, employers.id))
      .orderBy(desc(vacancies.postedAt));
    
    return result.map(r => ({
      ...r,
      county: r.county || "",
      currency: r.currency || "LRD",
      createdAt: r.postedAt.toISOString(),
    }));
  }

  async getDataPortalPostingsStats(): Promise<{
    total: number;
    bySector: Record<string, number>;
    byCounty: Record<string, number>;
  }> {
    const allPostings = await db
      .select({
        sector: employers.sector,
        county: vacancies.county,
      })
      .from(vacancies)
      .innerJoin(employers, eq(vacancies.employerId, employers.id));
    
    const bySector: Record<string, number> = {};
    const byCounty: Record<string, number> = {};
    
    for (const posting of allPostings) {
      const sector = posting.sector || "unknown";
      bySector[sector] = (bySector[sector] || 0) + 1;
      
      if (posting.county) {
        byCounty[posting.county] = (byCounty[posting.county] || 0) + 1;
      }
    }
    
    return {
      total: allPostings.length,
      bySector,
      byCounty,
    };
  }

  // Data Portal - Job Seekers
  async getDataPortalSeekers(): Promise<{
    id: string;
    personUid: string;
    county: string;
    sex: string;
    isYouth: boolean;
    headline: string;
    highestEducation: string;
    yearsExperience: string;
    isOpenToWork: boolean;
    preferredSectors: string[];
    preferredCounties: string[];
    willingToRelocate: boolean;
    skillCount: number;
  }[]> {
    const result = await db
      .select({
        id: persons.id,
        personUid: persons.personUid,
        county: persons.county,
        sex: persons.sex,
        isYouth: persons.isYouth,
        headline: jobSeekerProfiles.headline,
        highestEducation: jobSeekerProfiles.highestEducation,
        yearsExperience: jobSeekerProfiles.yearsExperience,
        isOpenToWork: jobSeekerProfiles.isOpenToWork,
        preferredSectors: jobSeekerProfiles.preferredSectors,
        preferredCounties: jobSeekerProfiles.preferredCounties,
        willingToRelocate: jobSeekerProfiles.willingToRelocate,
      })
      .from(jobSeekerProfiles)
      .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id));
    
    // Get skill counts for each person
    const skillCounts = await db
      .select({
        personId: personSkills.personId,
        count: count(),
      })
      .from(personSkills)
      .groupBy(personSkills.personId);
    
    const skillCountMap = new Map(skillCounts.map(s => [s.personId, Number(s.count)]));
    
    return result.map(r => ({
      id: r.id,
      personUid: r.personUid,
      county: r.county || "",
      sex: r.sex || "",
      isYouth: r.isYouth || false,
      headline: r.headline || "",
      highestEducation: r.highestEducation || "",
      yearsExperience: r.yearsExperience || "0",
      isOpenToWork: r.isOpenToWork || false,
      preferredSectors: r.preferredSectors || [],
      preferredCounties: r.preferredCounties || [],
      willingToRelocate: r.willingToRelocate || false,
      skillCount: skillCountMap.get(r.id) || 0,
    }));
  }

  async getDataPortalSeekersStats(): Promise<{
    total: number;
    openToWork: number;
    bySector: Record<string, number>;
    byCounty: Record<string, number>;
    byEducation: Record<string, number>;
  }> {
    const allSeekers = await db
      .select({
        county: persons.county,
        isOpenToWork: jobSeekerProfiles.isOpenToWork,
        preferredSectors: jobSeekerProfiles.preferredSectors,
        highestEducation: jobSeekerProfiles.highestEducation,
      })
      .from(jobSeekerProfiles)
      .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id));
    
    const bySector: Record<string, number> = {};
    const byCounty: Record<string, number> = {};
    const byEducation: Record<string, number> = {};
    let openToWork = 0;
    
    for (const seeker of allSeekers) {
      if (seeker.isOpenToWork) openToWork++;
      
      if (seeker.preferredSectors) {
        for (const sector of seeker.preferredSectors) {
          bySector[sector] = (bySector[sector] || 0) + 1;
        }
      }
      
      if (seeker.county) {
        byCounty[seeker.county] = (byCounty[seeker.county] || 0) + 1;
      }
      
      if (seeker.highestEducation) {
        byEducation[seeker.highestEducation] = (byEducation[seeker.highestEducation] || 0) + 1;
      }
    }
    
    return {
      total: allSeekers.length,
      openToWork,
      bySector,
      byCounty,
      byEducation,
    };
  }

  // Training Providers
  async getTrainingProviders(): Promise<TrainingProvider[]> {
    return await db.select().from(trainingProviders).orderBy(desc(trainingProviders.createdAt));
  }

  async getTrainingProviderById(id: string): Promise<TrainingProvider | undefined> {
    const result = await db.select().from(trainingProviders).where(eq(trainingProviders.id, id)).limit(1);
    return result[0];
  }

  async createTrainingProvider(provider: InsertTrainingProvider): Promise<TrainingProvider> {
    const result = await db.insert(trainingProviders).values(provider).returning();
    return result[0];
  }

  async updateTrainingProvider(id: string, updates: Partial<TrainingProvider>): Promise<TrainingProvider | undefined> {
    const result = await db.update(trainingProviders).set(updates).where(eq(trainingProviders.id, id)).returning();
    return result[0];
  }

  async deleteTrainingProvider(id: string): Promise<boolean> {
    const result = await db.delete(trainingProviders).where(eq(trainingProviders.id, id)).returning();
    return result.length > 0;
  }

  // Courses
  async getCourses(providerId?: string): Promise<(Course & { providerName?: string })[]> {
    if (providerId) {
      const result = await db
        .select({
          course: courses,
          providerName: trainingProviders.name
        })
        .from(courses)
        .leftJoin(trainingProviders, eq(courses.providerId, trainingProviders.id))
        .where(eq(courses.providerId, providerId))
        .orderBy(desc(courses.createdAt));
      return result.map(r => ({ ...r.course, providerName: r.providerName || undefined }));
    }
    const result = await db
      .select({
        course: courses,
        providerName: trainingProviders.name
      })
      .from(courses)
      .leftJoin(trainingProviders, eq(courses.providerId, trainingProviders.id))
      .orderBy(desc(courses.createdAt));
    return result.map(r => ({ ...r.course, providerName: r.providerName || undefined }));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0];
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const result = await db.update(courses).set(updates).where(eq(courses.id, id)).returning();
    return result[0];
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();
    return result.length > 0;
  }

  // Public Employment Centres
  async getPECs(): Promise<PublicEmploymentCentre[]> {
    return await db.select().from(publicEmploymentCentres).orderBy(desc(publicEmploymentCentres.createdAt));
  }

  async getPECById(id: string): Promise<PublicEmploymentCentre | undefined> {
    const result = await db.select().from(publicEmploymentCentres).where(eq(publicEmploymentCentres.id, id)).limit(1);
    return result[0];
  }

  async createPEC(pec: InsertPEC): Promise<PublicEmploymentCentre> {
    const result = await db.insert(publicEmploymentCentres).values(pec).returning();
    return result[0];
  }

  async updatePEC(id: string, updates: Partial<PublicEmploymentCentre>): Promise<PublicEmploymentCentre | undefined> {
    const result = await db.update(publicEmploymentCentres).set(updates).where(eq(publicEmploymentCentres.id, id)).returning();
    return result[0];
  }

  async deletePEC(id: string): Promise<boolean> {
    const result = await db.delete(publicEmploymentCentres).where(eq(publicEmploymentCentres.id, id)).returning();
    return result.length > 0;
  }

  // Course Lessons
  async getCourseLessons(courseId: string): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(asc(courseLessons.orderIndex));
  }

  // Course Quiz Questions
  async getCourseQuizQuestions(courseId: string): Promise<CourseQuizQuestion[]> {
    return await db.select().from(courseQuizQuestions)
      .where(eq(courseQuizQuestions.courseId, courseId))
      .orderBy(asc(courseQuizQuestions.orderIndex));
  }

  // Course Enrollments
  async getEnrollment(id: string): Promise<CourseEnrollment | undefined> {
    const result = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id)).limit(1);
    return result[0];
  }

  async getEnrollmentByCourseAndEmail(courseId: string, email: string): Promise<CourseEnrollment | undefined> {
    const result = await db.select().from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), eq(courseEnrollments.enrolleeEmail, email)))
      .limit(1);
    return result[0];
  }

  async createEnrollment(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const result = await db.insert(courseEnrollments).values(enrollment).returning();
    return result[0];
  }

  async updateEnrollment(id: string, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment | undefined> {
    const result = await db.update(courseEnrollments).set(updates).where(eq(courseEnrollments.id, id)).returning();
    return result[0];
  }

  // Quiz Attempts
  async createQuizAttempt(attempt: InsertCourseQuizAttempt): Promise<CourseQuizAttempt> {
    const result = await db.insert(courseQuizAttempts).values(attempt).returning();
    return result[0];
  }

  async getQuizAttempts(enrollmentId: string): Promise<CourseQuizAttempt[]> {
    return await db.select().from(courseQuizAttempts)
      .where(eq(courseQuizAttempts.enrollmentId, enrollmentId))
      .orderBy(desc(courseQuizAttempts.completedAt));
  }

  // Certificates
  async createCertificate(cert: InsertCourseCertificate): Promise<CourseCertificate> {
    const result = await db.insert(courseCertificates).values(cert).returning();
    return result[0];
  }

  async getCertificate(enrollmentId: string): Promise<CourseCertificate | undefined> {
    const result = await db.select().from(courseCertificates)
      .where(eq(courseCertificates.enrollmentId, enrollmentId)).limit(1);
    return result[0];
  }

  async getCertificateByNumber(certNumber: string): Promise<CourseCertificate | undefined> {
    const result = await db.select().from(courseCertificates)
      .where(eq(courseCertificates.certificateNumber, certNumber)).limit(1);
    return result[0];
  }

  // Labour Market Indicators
  async getLabourMarketIndicators(): Promise<LabourMarketIndicator[]> {
    return await db.select().from(labourMarketIndicators).orderBy(desc(labourMarketIndicators.year));
  }

  async getLabourMarketIndicatorById(id: number): Promise<LabourMarketIndicator | undefined> {
    const result = await db.select().from(labourMarketIndicators).where(eq(labourMarketIndicators.id, id)).limit(1);
    return result[0];
  }

  async createLabourMarketIndicator(data: InsertLabourMarketIndicator): Promise<LabourMarketIndicator> {
    const result = await db.insert(labourMarketIndicators).values(data).returning();
    return result[0];
  }

  async updateLabourMarketIndicator(id: number, updates: Partial<LabourMarketIndicator>): Promise<LabourMarketIndicator | undefined> {
    const result = await db.update(labourMarketIndicators).set({ ...updates, updatedAt: new Date() }).where(eq(labourMarketIndicators.id, id)).returning();
    return result[0];
  }

  async deleteLabourMarketIndicator(id: number): Promise<boolean> {
    const result = await db.delete(labourMarketIndicators).where(eq(labourMarketIndicators.id, id)).returning();
    return result.length > 0;
  }

  // Grievance Cases
  async getGrievanceCases(filters?: { status?: string; county?: string }): Promise<GrievanceCase[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(grievanceCases.status, filters.status));
    }
    if (filters?.county) {
      conditions.push(eq(grievanceCases.county, filters.county));
    }
    if (conditions.length === 0) {
      return await db.select().from(grievanceCases).orderBy(desc(grievanceCases.submittedAt));
    }
    if (conditions.length === 1) {
      return await db.select().from(grievanceCases).where(conditions[0]).orderBy(desc(grievanceCases.submittedAt));
    }
    return await db.select().from(grievanceCases).where(and(...conditions)).orderBy(desc(grievanceCases.submittedAt));
  }

  async getGrievanceCaseById(id: string): Promise<GrievanceCase | undefined> {
    const result = await db.select().from(grievanceCases).where(eq(grievanceCases.id, id)).limit(1);
    return result[0];
  }

  async getGrievanceCaseByTracking(trackingNumber: string): Promise<GrievanceCase | undefined> {
    const result = await db.select().from(grievanceCases).where(eq(grievanceCases.trackingNumber, trackingNumber)).limit(1);
    return result[0];
  }

  async createGrievanceCase(data: InsertGrievanceCase): Promise<GrievanceCase> {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const trackingNumber = `GRV-${year}-${randomDigits}`;
    const result = await db.insert(grievanceCases).values({ ...data, trackingNumber }).returning();
    return result[0];
  }

  async updateGrievanceCase(id: string, updates: Partial<GrievanceCase>): Promise<GrievanceCase | undefined> {
    const result = await db.update(grievanceCases).set({ ...updates, updatedAt: new Date() }).where(eq(grievanceCases.id, id)).returning();
    return result[0];
  }

  // Knowledge Base Items
  async getKnowledgeBaseItems(filters?: { category?: string; isPublished?: boolean }): Promise<KnowledgeBaseItem[]> {
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(knowledgeBaseItems.category, filters.category));
    }
    if (filters?.isPublished !== undefined) {
      conditions.push(eq(knowledgeBaseItems.isPublished, filters.isPublished));
    }
    if (conditions.length === 0) {
      return await db.select().from(knowledgeBaseItems).orderBy(desc(knowledgeBaseItems.createdAt));
    }
    if (conditions.length === 1) {
      return await db.select().from(knowledgeBaseItems).where(conditions[0]).orderBy(desc(knowledgeBaseItems.createdAt));
    }
    return await db.select().from(knowledgeBaseItems).where(and(...conditions)).orderBy(desc(knowledgeBaseItems.createdAt));
  }

  async getKnowledgeBaseItemById(id: number): Promise<KnowledgeBaseItem | undefined> {
    const result = await db.select().from(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id)).limit(1);
    return result[0];
  }

  async createKnowledgeBaseItem(data: InsertKnowledgeBaseItem): Promise<KnowledgeBaseItem> {
    const result = await db.insert(knowledgeBaseItems).values(data).returning();
    return result[0];
  }

  async updateKnowledgeBaseItem(id: number, updates: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem | undefined> {
    const result = await db.update(knowledgeBaseItems).set({ ...updates, updatedAt: new Date() }).where(eq(knowledgeBaseItems.id, id)).returning();
    return result[0];
  }

  async deleteKnowledgeBaseItem(id: number): Promise<boolean> {
    const result = await db.delete(knowledgeBaseItems).where(eq(knowledgeBaseItems.id, id)).returning();
    return result.length > 0;
  }

  // Workplace Incidents
  async getWorkplaceIncidents(filters?: { status?: string; county?: string; severity?: string }): Promise<WorkplaceIncident[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(workplaceIncidents.status, filters.status));
    }
    if (filters?.county) {
      conditions.push(eq(workplaceIncidents.county, filters.county));
    }
    if (filters?.severity) {
      conditions.push(eq(workplaceIncidents.severity, filters.severity));
    }
    if (conditions.length === 0) {
      return await db.select().from(workplaceIncidents).orderBy(desc(workplaceIncidents.createdAt));
    }
    if (conditions.length === 1) {
      return await db.select().from(workplaceIncidents).where(conditions[0]).orderBy(desc(workplaceIncidents.createdAt));
    }
    return await db.select().from(workplaceIncidents).where(and(...conditions)).orderBy(desc(workplaceIncidents.createdAt));
  }

  async getWorkplaceIncidentById(id: number): Promise<WorkplaceIncident | undefined> {
    const result = await db.select().from(workplaceIncidents).where(eq(workplaceIncidents.id, id)).limit(1);
    return result[0];
  }

  async createWorkplaceIncident(data: InsertWorkplaceIncident): Promise<WorkplaceIncident> {
    const result = await db.insert(workplaceIncidents).values(data).returning();
    return result[0];
  }

  async updateWorkplaceIncident(id: number, updates: Partial<WorkplaceIncident>): Promise<WorkplaceIncident | undefined> {
    const result = await db.update(workplaceIncidents).set({ ...updates, updatedAt: new Date() }).where(eq(workplaceIncidents.id, id)).returning();
    return result[0];
  }

  async getTenders(filters?: { employerId?: string; type?: string; status?: string; county?: string }): Promise<Tender[]> {
    let query = db.select().from(tenders);
    const conditions = [];
    if (filters?.employerId) conditions.push(eq(tenders.employerId, filters.employerId));
    if (filters?.type) conditions.push(eq(tenders.type, filters.type));
    if (filters?.status) conditions.push(eq(tenders.status, filters.status));
    if (filters?.county) conditions.push(eq(tenders.county, filters.county));
    if (conditions.length > 0) {
      return db.select().from(tenders).where(and(...conditions)).orderBy(desc(tenders.createdAt));
    }
    return db.select().from(tenders).orderBy(desc(tenders.createdAt));
  }

  async getTenderById(id: string): Promise<Tender | undefined> {
    const result = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
    return result[0];
  }

  async createTender(data: InsertTender): Promise<Tender> {
    const result = await db.insert(tenders).values(data).returning();
    return result[0];
  }

  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender | undefined> {
    const result = await db.update(tenders).set({ ...updates, updatedAt: new Date() }).where(eq(tenders.id, id)).returning();
    return result[0];
  }

  async deleteTender(id: string): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, id)).returning();
    return result.length > 0;
  }

  async getTenderSubmissions(tenderId: string): Promise<TenderSubmission[]> {
    return db.select().from(tenderSubmissions).where(eq(tenderSubmissions.tenderId, tenderId)).orderBy(desc(tenderSubmissions.submittedAt));
  }

  async getTenderSubmissionById(id: string): Promise<TenderSubmission | undefined> {
    const result = await db.select().from(tenderSubmissions).where(eq(tenderSubmissions.id, id)).limit(1);
    return result[0];
  }

  async getTenderSubmissionsByBidder(bidderId: string): Promise<TenderSubmission[]> {
    return db.select().from(tenderSubmissions).where(eq(tenderSubmissions.bidderId, bidderId)).orderBy(desc(tenderSubmissions.submittedAt));
  }

  async createTenderSubmission(data: InsertTenderSubmission): Promise<TenderSubmission> {
    const result = await db.insert(tenderSubmissions).values(data).returning();
    return result[0];
  }

  async updateTenderSubmission(id: string, updates: Partial<TenderSubmission>): Promise<TenderSubmission | undefined> {
    const result = await db.update(tenderSubmissions).set(updates).where(eq(tenderSubmissions.id, id)).returning();
    return result[0];
  }

  // Price Entries / Economic Indicators
  async getPriceEntries(filters?: { county?: string; month?: number; year?: number; category?: string }): Promise<PriceEntry[]> {
    const conditions = [];
    if (filters?.county) conditions.push(eq(priceEntries.county, filters.county));
    if (filters?.month) conditions.push(eq(priceEntries.month, filters.month));
    if (filters?.year) conditions.push(eq(priceEntries.year, filters.year));
    if (filters?.category) conditions.push(eq(priceEntries.category, filters.category));

    if (conditions.length > 0) {
      return db.select().from(priceEntries).where(and(...conditions)).orderBy(desc(priceEntries.year), desc(priceEntries.month), asc(priceEntries.county));
    }
    return db.select().from(priceEntries).orderBy(desc(priceEntries.year), desc(priceEntries.month), asc(priceEntries.county));
  }

  async createPriceEntry(data: InsertPriceEntry): Promise<PriceEntry> {
    const result = await db.insert(priceEntries).values(data).returning();
    return result[0];
  }

  async createPriceEntriesBulk(data: InsertPriceEntry[]): Promise<PriceEntry[]> {
    if (data.length === 0) return [];
    const result = await db.insert(priceEntries).values(data).returning();
    return result;
  }

  async updatePriceEntry(id: number, updates: Partial<PriceEntry>): Promise<PriceEntry | undefined> {
    const result = await db.update(priceEntries).set({ ...updates, updatedAt: new Date() }).where(eq(priceEntries.id, id)).returning();
    return result[0];
  }

  async deletePriceEntry(id: number): Promise<boolean> {
    const result = await db.delete(priceEntries).where(eq(priceEntries.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
