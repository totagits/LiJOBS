import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, date, decimal, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================
// REFERENCE DATA TABLES (ref.*)
// =============================================

// Districts within counties
export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  countyName: text("county_name").notNull(),
  name: text("name").notNull(),
  population: integer("population"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDistrictSchema = createInsertSchema(districts).omit({ id: true, createdAt: true });
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type District = typeof districts.$inferSelect;

// ISCO-08 Occupation Codes (International Standard Classification of Occupations)
export const iscoOccupations = pgTable("isco_occupations", {
  code: varchar("code", { length: 10 }).primaryKey(), // e.g., "2411"
  title: text("title").notNull(),
  majorGroup: varchar("major_group", { length: 1 }), // 1-9
  subMajorGroup: varchar("sub_major_group", { length: 2 }),
  minorGroup: varchar("minor_group", { length: 3 }),
  description: text("description"),
});

export const insertIscoOccupationSchema = createInsertSchema(iscoOccupations);
export type InsertIscoOccupation = z.infer<typeof insertIscoOccupationSchema>;
export type IscoOccupation = typeof iscoOccupations.$inferSelect;

// ISIC Rev.4 Industry Codes (International Standard Industrial Classification)
export const isicIndustries = pgTable("isic_industries", {
  code: varchar("code", { length: 10 }).primaryKey(), // e.g., "6201"
  title: text("title").notNull(),
  section: varchar("section", { length: 1 }), // A-U
  division: varchar("division", { length: 2 }),
  group: varchar("group", { length: 3 }),
  description: text("description"),
});

export const insertIsicIndustrySchema = createInsertSchema(isicIndustries);
export type InsertIsicIndustry = z.infer<typeof insertIsicIndustrySchema>;
export type IsicIndustry = typeof isicIndustries.$inferSelect;

// =============================================
// ORGANIZATION TABLES (org.*)
// =============================================

// Employers (companies, organizations, government entities)
export const employers = pgTable("employers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }), // Link to user account if registered
  legalName: text("legal_name").notNull(),
  tradingName: text("trading_name"),
  sector: text("sector").notNull(), // public, private, ngo, informal
  isPublicSector: boolean("is_public_sector").notNull().default(false),
  taxIdHash: text("tax_id_hash"), // Hashed for privacy
  registrationIdHash: text("registration_id_hash"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  trustScore: decimal("trust_score", { precision: 4, scale: 3 }).default("0.300"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Employer = typeof employers.$inferSelect;

// Establishments (physical locations/branches of employers)
export const establishments = pgTable("establishments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  county: text("county").notNull(),
  district: text("district"),
  address: text("address"),
  geoLat: decimal("geo_lat", { precision: 9, scale: 6 }),
  geoLng: decimal("geo_lng", { precision: 9, scale: 6 }),
  isicCode: varchar("isic_code", { length: 10 }),
  employeeSizeBand: text("employee_size_band"), // 1-4, 5-9, 10-49, 50-249, 250+
  isHeadquarters: boolean("is_headquarters").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEstablishmentSchema = createInsertSchema(establishments).omit({ id: true, createdAt: true });
export type InsertEstablishment = z.infer<typeof insertEstablishmentSchema>;
export type Establishment = typeof establishments.$inferSelect;

// Public Employment Centres (PECs)
export const publicEmploymentCentres = pgTable("public_employment_centres", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  county: text("county").notNull(),
  district: text("district"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  managerId: varchar("manager_id", { length: 36 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPECSchema = createInsertSchema(publicEmploymentCentres).omit({ id: true, createdAt: true });
export type InsertPEC = z.infer<typeof insertPECSchema>;
export type PublicEmploymentCentre = typeof publicEmploymentCentres.$inferSelect;

// Private Employment Agencies
export const privateEmploymentAgencies = pgTable("private_employment_agencies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id", { length: 36 }).notNull(),
  licenseNumber: text("license_number"),
  licenseStatus: text("license_status").notNull().default("pending"), // pending, active, suspended, expired
  licenseValidFrom: date("license_valid_from"),
  licenseValidTo: date("license_valid_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPEASchema = createInsertSchema(privateEmploymentAgencies).omit({ id: true, createdAt: true });
export type InsertPEA = z.infer<typeof insertPEASchema>;
export type PrivateEmploymentAgency = typeof privateEmploymentAgencies.$inferSelect;

// =============================================
// LABOUR TABLES (labour.*)
// =============================================

// Persons (privacy-safe, no PII)
export const persons = pgTable("persons", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  personUid: text("person_uid").notNull().unique(), // Random public identifier
  userId: varchar("user_id", { length: 36 }), // Link to user account if registered
  county: text("county"),
  district: text("district"),
  sex: text("sex"), // male, female, other
  birthYear: integer("birth_year"),
  nationalityCode: varchar("nationality_code", { length: 3 }).default("LBR"),
  hasDisability: boolean("has_disability").default(false),
  isYouth: boolean("is_youth").default(false), // Age 15-35
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPersonSchema = createInsertSchema(persons).omit({ id: true, createdAt: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

// =============================================
// PII VAULT (pii.*) - Privacy-safe encrypted storage
// =============================================

// Person Identity - Encrypted PII stored separately for GDPR/privacy compliance
// All sensitive fields are encrypted at application layer before storage
export const personIdentities = pgTable("person_identities", {
  personId: varchar("person_id", { length: 36 }).primaryKey(), // FK to persons
  fullNameEnc: text("full_name_enc"), // Encrypted at app layer / KMS envelope
  phoneEnc: text("phone_enc"), // Encrypted
  emailEnc: text("email_enc"), // Encrypted
  addressEnc: text("address_enc"), // Encrypted
  nationalIdHash: text("national_id_hash"), // Hashed for dedupe (not encrypted, one-way hash)
  passportNumberHash: text("passport_number_hash"), // Hashed
  consentVersion: text("consent_version"), // e.g., "v1.0", "v2.0"
  consentAt: timestamp("consent_at"), // When consent was given
  consentWithdrawnAt: timestamp("consent_withdrawn_at"), // If consent was withdrawn
  dataRetentionUntil: date("data_retention_until"), // When data should be deleted
  encryptionKeyId: text("encryption_key_id"), // Reference to KMS key used
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPersonIdentitySchema = createInsertSchema(personIdentities).omit({ 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPersonIdentity = z.infer<typeof insertPersonIdentitySchema>;
export type PersonIdentity = typeof personIdentities.$inferSelect;

// Job Seeker Profiles
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  personId: varchar("person_id", { length: 36 }).primaryKey(),
  headline: text("headline"),
  summary: text("summary"),
  highestEducation: text("highest_education"), // none, primary, secondary, vocational, tertiary, postgraduate
  yearsExperience: decimal("years_experience", { precision: 4, scale: 1 }).default("0"),
  isOpenToWork: boolean("is_open_to_work").default(true),
  preferredSectors: text("preferred_sectors").array(),
  preferredCounties: text("preferred_counties").array(),
  minSalaryExpectation: integer("min_salary_expectation"),
  salaryCurrency: text("salary_currency").default("LRD"),
  willingToRelocate: boolean("willing_to_relocate").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles);
export type InsertJobSeekerProfile = z.infer<typeof insertJobSeekerProfileSchema>;
export type JobSeekerProfile = typeof jobSeekerProfiles.$inferSelect;

// Skills catalog
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category"), // technical, soft, language, etc.
  iscoCode: varchar("isco_code", { length: 10 }), // Related occupation
});

export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

// Person skills (junction table)
export const personSkills = pgTable("person_skills", {
  id: serial("id").primaryKey(),
  personId: varchar("person_id", { length: 36 }).notNull(),
  skillId: integer("skill_id").notNull(),
  level: integer("level"), // 1-5
  yearsUsed: decimal("years_used", { precision: 4, scale: 1 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPersonSkillSchema = createInsertSchema(personSkills).omit({ id: true, createdAt: true });
export type InsertPersonSkill = z.infer<typeof insertPersonSkillSchema>;
export type PersonSkill = typeof personSkills.$inferSelect;

// Training Providers
export const trainingProviders = pgTable("training_providers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  county: text("county"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  accreditationStatus: text("accreditation_status").default("pending"), // pending, accredited, suspended
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingProviderSchema = createInsertSchema(trainingProviders).omit({ id: true, createdAt: true });
export type InsertTrainingProvider = z.infer<typeof insertTrainingProviderSchema>;
export type TrainingProvider = typeof trainingProviders.$inferSelect;

// Courses
export const courses = pgTable("courses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id", { length: 36 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks"),
  cost: integer("cost"),
  currency: text("currency").default("LRD"),
  skillsCovered: text("skills_covered").array(),
  iscoCode: varchar("isco_code", { length: 10 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Course Lessons (learning content for each course)
export const courseLessons = pgTable("course_lessons", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  durationMinutes: integer("duration_minutes"),
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true });
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;

// Course Quiz Questions (multiple choice)
export const courseQuizQuestions = pgTable("course_quiz_questions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertCourseQuizQuestionSchema = createInsertSchema(courseQuizQuestions).omit({ id: true });
export type InsertCourseQuizQuestion = z.infer<typeof insertCourseQuizQuestionSchema>;
export type CourseQuizQuestion = typeof courseQuizQuestions.$inferSelect;

// Course Enrollments (open to anyone - name + email, no account required)
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  enrolleeName: text("enrollee_name").notNull(),
  enrolleeEmail: text("enrollee_email").notNull(),
  status: text("status").notNull().default("enrolled"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true });
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;

// Course Quiz Attempts
export const courseQuizAttempts = pgTable("course_quiz_attempts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertCourseQuizAttemptSchema = createInsertSchema(courseQuizAttempts).omit({ id: true, completedAt: true });
export type InsertCourseQuizAttempt = z.infer<typeof insertCourseQuizAttemptSchema>;
export type CourseQuizAttempt = typeof courseQuizAttempts.$inferSelect;

// Course Certificates
export const courseCertificates = pgTable("course_certificates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id", { length: 36 }).notNull(),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  certificateNumber: text("certificate_number").notNull(),
  recipientName: text("recipient_name").notNull(),
  courseName: text("course_name").notNull(),
  providerName: text("provider_name"),
  score: integer("score").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const insertCourseCertificateSchema = createInsertSchema(courseCertificates).omit({ id: true, issuedAt: true });
export type InsertCourseCertificate = z.infer<typeof insertCourseCertificateSchema>;
export type CourseCertificate = typeof courseCertificates.$inferSelect;

// =============================================
// JOBS TABLES (jobs.*)
// =============================================

// Vacancies
export const vacancies = pgTable("vacancies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id", { length: 36 }).notNull(),
  establishmentId: varchar("establishment_id", { length: 36 }),
  title: text("title").notNull(),
  description: text("description"),
  iscoCode: varchar("isco_code", { length: 10 }),
  isicCode: varchar("isic_code", { length: 10 }),
  county: text("county"),
  district: text("district"),
  contractType: text("contract_type").notNull(), // permanent, temporary, contract, apprentice, intern, gig
  workMode: text("work_mode").default("onsite"), // onsite, hybrid, remote
  minSalary: integer("min_salary"),
  maxSalary: integer("max_salary"),
  currency: text("currency").default("LRD"),
  openings: integer("openings").notNull().default(1),
  requiredEducation: text("required_education"),
  requiredExperience: integer("required_experience"), // years
  requiredSkills: text("required_skills").array(),
  status: text("status").notNull().default("open"), // open, closed, paused, filled
  applicationDeadline: date("application_deadline"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const insertVacancySchema = createInsertSchema(vacancies).omit({ id: true, postedAt: true });
export type InsertVacancy = z.infer<typeof insertVacancySchema>;
export type Vacancy = typeof vacancies.$inferSelect;

// Applications
export const applications = pgTable("applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  vacancyId: varchar("vacancy_id", { length: 36 }).notNull(),
  personId: varchar("person_id", { length: 36 }).notNull(),
  status: text("status").notNull().default("submitted"), // submitted, reviewed, shortlisted, interview, offered, hired, rejected, withdrawn
  // Applicant biodata
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"), // male, female, other, prefer_not_to_say
  nationality: text("nationality").default("Liberian"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  county: text("county"),
  district: text("district"),
  physicalAddress: text("physical_address"),
  // Education & experience
  educationLevel: text("education_level"), // none, primary, junior_high, senior_high, vocational, associate, bachelor, master, doctorate
  educationInstitution: text("education_institution"),
  fieldOfStudy: text("field_of_study"),
  yearsOfExperience: integer("years_of_experience"),
  currentEmployer: text("current_employer"),
  currentJobTitle: text("current_job_title"),
  relevantSkills: text("relevant_skills"),
  languagesSpoken: text("languages_spoken"),
  // Job-specific
  coverLetter: text("cover_letter"),
  expectedSalary: integer("expected_salary"),
  salaryCurrency: text("salary_currency").default("LRD"),
  availableStartDate: text("available_start_date"),
  howHeardAboutJob: text("how_heard_about_job"), // lijobs, newspaper, radio, referral, social_media, other
  willingToRelocate: boolean("willing_to_relocate").default(false),
  hasDisability: text("has_disability").default("prefer_not_to_say"), // yes, no, prefer_not_to_say
  // Documents
  resumeUrl: text("resume_url"),
  supportingDocUrls: text("supporting_doc_urls").array(),
  // References
  referenceName1: text("reference_name_1"),
  referencePhone1: text("reference_phone_1"),
  referenceRelation1: text("reference_relation_1"),
  referenceName2: text("reference_name_2"),
  referencePhone2: text("reference_phone_2"),
  referenceRelation2: text("reference_relation_2"),
  // Admin fields
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  notes: text("notes"),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, appliedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// =============================================
// OBSERVATORY TABLES (obs.*) - THE DIFFERENTIATOR!
// =============================================

// Job creation sources
export const jobSources = pgTable("job_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // EMPLOYER_SELF_REPORT, PAYROLL_SIGNAL, PROJECT_REPORT, SURVEY, AGENCY_REPORT
  description: text("description"),
});

export const insertJobSourceSchema = createInsertSchema(jobSources).omit({ id: true });
export type InsertJobSource = z.infer<typeof insertJobSourceSchema>;
export type JobSource = typeof jobSources.$inferSelect;

// Verification statuses (three-layer system)
export const verificationStatuses = ["pending", "employer_verified", "enumerator_verified", "fully_verified", "flagged", "rejected"] as const;
export type VerificationStatus = typeof verificationStatuses[number];

// Evidence types
export const evidenceTypes = ["contract", "payslip", "payroll_file", "field_visit", "survey", "photo", "other"] as const;
export type EvidenceType = typeof evidenceTypes[number];

// Formal/Informal indicators
export const formalityIndicators = ["formal", "informal", "unknown"] as const;
export type FormalityIndicator = typeof formalityIndicators[number];

// Job Creation Events (links employment spells to sources and verification)
export const jobCreationEvents = pgTable("job_creation_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  spellId: varchar("spell_id", { length: 36 }).notNull(),
  sourceId: integer("source_id").notNull(),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  reportedBy: varchar("reported_by", { length: 36 }),
  evidenceType: text("evidence_type"), // contract, payslip, payroll_file, field_visit, survey
  evidenceUrl: text("evidence_url"), // Object storage link
  evidenceNotes: text("evidence_notes"),
  verificationStatus: text("verification_status").notNull().default("self_reported"),
  verifiedBy: varchar("verified_by", { length: 36 }),
  verifiedAt: timestamp("verified_at"),
  trustScore: decimal("trust_score", { precision: 4, scale: 3 }).notNull().default("0.300"),
  verificationNotes: text("verification_notes"),
});

export const insertJobCreationEventSchema = createInsertSchema(jobCreationEvents).omit({ id: true, reportedAt: true });
export type InsertJobCreationEvent = z.infer<typeof insertJobCreationEventSchema>;
export type JobCreationEvent = typeof jobCreationEvents.$inferSelect;

// Employer Trust Snapshots (aggregated trust scores for dashboards)
export const employerTrustSnapshots = pgTable("employer_trust_snapshots", {
  employerId: varchar("employer_id", { length: 36 }).primaryKey(),
  asOfDate: date("as_of_date").notNull(),
  trustScore: decimal("trust_score", { precision: 4, scale: 3 }).notNull(),
  verifiedShare: decimal("verified_share", { precision: 5, scale: 2 }).notNull(), // % of verified records
  totalSpells: integer("total_spells").default(0),
  verifiedSpells: integer("verified_spells").default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmployerTrustSnapshotSchema = createInsertSchema(employerTrustSnapshots);
export type InsertEmployerTrustSnapshot = z.infer<typeof insertEmployerTrustSnapshotSchema>;
export type EmployerTrustSnapshot = typeof employerTrustSnapshots.$inferSelect;

// =============================================
// AUDIT TABLES (audit.*)
// =============================================

// Audit Event Log (immutable)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  actorUserId: varchar("actor_user_id", { length: 36 }),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VERIFY, REJECT, etc.
  entityType: text("entity_type").notNull(), // user, employment_spell, vacancy, etc.
  entityId: text("entity_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  details: jsonb("details"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, occurredAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// User roles enum
export const userRoles = ["admin", "director", "ministry", "employer", "enumerator", "individual"] as const;
export type UserRole = typeof userRoles[number];

// Sectors enum
export const sectors = ["public", "private", "ngo", "informal", "seasonal"] as const;
export type Sector = typeof sectors[number];

// Counties in Liberia
export const liberianCounties = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
] as const;
export type LiberianCounty = typeof liberianCounties[number];

// Approval status enum
export const approvalStatuses = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = typeof approvalStatuses[number];

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("individual"),
  sector: text("sector"),
  county: text("county"),
  organizationName: text("organization_name"),
  organizationType: text("organization_type"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  // Registration approval fields
  approvalStatus: text("approval_status").notNull().default("pending"),
  approvalNotes: text("approval_notes"),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: timestamp("approved_at"),
  // Business document fields
  businessRegistrationNumber: text("business_registration_number"),
  businessCertificateUrl: text("business_certificate_url"),
  taxClearanceUrl: text("tax_clearance_url"),
  // Individual document fields
  idNumber: text("id_number"),
  idCardUrl: text("id_card_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employment spells - the core data model (enhanced for observatory)
export const employmentSpells = pgTable("employment_spells", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reportedBy: varchar("reported_by", { length: 36 }).notNull(),
  employerId: varchar("employer_id", { length: 36 }),
  establishmentId: varchar("establishment_id", { length: 36 }),
  employerName: text("employer_name").notNull(),
  employerType: text("employer_type").notNull(),
  sector: text("sector").notNull(),
  county: text("county").notNull(),
  district: text("district"),
  jobTitle: text("job_title").notNull(),
  iscoCode: varchar("isco_code", { length: 10 }),
  isicCode: varchar("isic_code", { length: 10 }),
  personId: varchar("person_id", { length: 36 }),
  employeeName: text("employee_name"),
  employeeGender: text("employee_gender"),
  employeeAge: integer("employee_age"),
  employeeAddress: text("employee_address"),
  employeeDistrict: text("employee_district"),
  employeeCounty: text("employee_county"),
  employeeIsYouth: boolean("employee_is_youth").default(false),
  employeeHasDisability: boolean("employee_has_disability").default(false),
  contractType: text("contract_type").notNull(),
  workMode: text("work_mode").default("onsite"),
  hoursPerWeek: decimal("hours_per_week", { precision: 4, scale: 1 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  monthlySalary: real("monthly_salary"),
  currency: text("currency").default("LRD"),
  wageBand: text("wage_band"),
  formalIndicator: text("formal_indicator").default("unknown"),
  hasWrittenContract: boolean("has_written_contract").default(false),
  hasSocialSecurity: boolean("has_social_security").default(false),
  // Three-Layer Verification System
  // Overall status: pending → employer_verified → enumerator_verified → fully_verified | flagged | rejected
  verificationStatus: text("verification_status").notNull().default("pending"),
  trustScore: decimal("trust_score", { precision: 4, scale: 3 }).default("0.300"),
  // Layer 1: Employer signs (submits and confirms data)
  employerVerifiedBy: varchar("employer_verified_by", { length: 36 }),
  employerVerifiedAt: timestamp("employer_verified_at"),
  employerVerificationNotes: text("employer_verification_notes"),
  // Layer 2: Enumerator (field agent) physically verifies
  enumeratorVerifiedBy: varchar("enumerator_verified_by", { length: 36 }),
  enumeratorVerifiedAt: timestamp("enumerator_verified_at"),
  enumeratorVerificationNotes: text("enumerator_verification_notes"),
  enumeratorFieldVisitDate: date("enumerator_field_visit_date"),
  enumeratorEmployeeConfirmed: boolean("enumerator_employee_confirmed"),
  // Layer 3: Ministry staff gives final approval
  ministryVerifiedBy: varchar("ministry_verified_by", { length: 36 }),
  ministryVerifiedAt: timestamp("ministry_verified_at"),
  ministryVerificationNotes: text("ministry_verification_notes"),
  // Legacy single-layer fields (kept for backward compatibility)
  verifiedBy: varchar("verified_by", { length: 36 }),
  verifiedAt: timestamp("verified_at"),
  // Cross-reference flags
  discrepancyFlag: boolean("discrepancy_flag").default(false),
  discrepancyNotes: text("discrepancy_notes"),
  // Project/Donor tracking
  projectName: text("project_name"),
  projectCode: text("project_code"),
  fundingSource: text("funding_source"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmploymentSpellSchema = createInsertSchema(employmentSpells).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  employerVerifiedAt: true,
  enumeratorVerifiedAt: true,
  ministryVerifiedAt: true,
});

export type InsertEmploymentSpell = z.infer<typeof insertEmploymentSpellSchema>;
export type EmploymentSpell = typeof employmentSpells.$inferSelect;

// Login schema for authentication
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.enum(userRoles),
  sector: z.string().optional(),
  county: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  phone: z.string().optional(),
  // Business document fields
  businessRegistrationNumber: z.string().optional(),
  businessCertificateUrl: z.string().optional(),
  taxClearanceUrl: z.string().optional(),
  // Individual document fields
  idNumber: z.string().optional(),
  idCardUrl: z.string().optional(),
  // Individual comprehensive profile fields
  gender: z.string().optional(),
  nationality: z.string().optional(),
  district: z.string().optional(),
  physicalAddress: z.string().optional(),
  dateOfBirth: z.string().optional(),
  educationLevel: z.string().optional(),
  educationInstitution: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  currentEmployer: z.string().optional(),
  currentJobTitle: z.string().optional(),
  relevantSkills: z.string().optional(),
  languagesSpoken: z.string().optional(),
  expectedSalary: z.string().optional(),
  availableStartDate: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  hasDisability: z.boolean().optional(),
  preferredSectors: z.array(z.string()).optional(),
  preferredCounties: z.array(z.string()).optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  resumeUrl: z.string().optional(),
  supportingDocUrls: z.array(z.string()).optional(),
  referenceName1: z.string().optional(),
  referencePhone1: z.string().optional(),
  referenceRelation1: z.string().optional(),
  referenceName2: z.string().optional(),
  referencePhone2: z.string().optional(),
  referenceRelation2: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;

// Employment spell form schema
export const employmentSpellFormSchema = z.object({
  employerName: z.string().min(2, "Employer name is required"),
  employerType: z.string().min(1, "Employer type is required"),
  sector: z.enum(sectors),
  county: z.string().min(1, "County is required"),
  district: z.string().optional(),
  jobTitle: z.string().min(2, "Job title is required"),
  employeeName: z.string().min(2, "Employee full name is required"),
  employeeGender: z.enum(["male", "female", "other"]),
  employeeAge: z.number().min(15).max(100),
  employeeAddress: z.string().optional(),
  employeeDistrict: z.string().optional(),
  employeeCounty: z.string().min(1, "Employee county is required"),
  contractType: z.enum(["full_time", "part_time", "contract", "seasonal", "informal"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  monthlySalary: z.number().optional(),
  wageAmount: z.number().optional(),
  wagePeriod: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
  currency: z.enum(["LRD", "USD", "LRD_USD"]).default("LRD"),
  notes: z.string().optional(),
});

export type EmploymentSpellFormData = z.infer<typeof employmentSpellFormSchema>;

// Dashboard statistics interfaces (kept from original)
export interface NationalStat {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
}

export interface CountyData {
  id: string;
  name: string;
  jobs: number;
  employers: number;
  growth: number;
  color: string;
  population?: number;
}

export interface SectorStat {
  id: string;
  name: string;
  jobs: number;
  description: string;
  imagePath: string;
}

export interface MonthlyData {
  month: string;
  jobs: number;
  formal: number;
  informal: number;
}

export interface SectorData {
  sector: string;
  jobs: number;
  postings?: number;
  color: string;
}

export interface ContractData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  stats: NationalStat[];
  counties: CountyData[];
  monthlyData: MonthlyData[];
  sectorData: SectorData[];
  contractData: ContractData[];
  lastUpdated: string;
}

// Session user type (without password)
export type SessionUser = Omit<User, "password">;

// Training videos table
export const trainingVideos = pgTable("training_videos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  scriptId: text("script_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetAudience: text("target_audience").notNull(),
  courseId: varchar("course_id", { length: 36 }),
  heygenVideoId: text("heygen_video_id"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("pending"),
  duration: text("duration"),
  errorMessage: text("error_message"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTrainingVideoSchema = createInsertSchema(trainingVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrainingVideo = z.infer<typeof insertTrainingVideoSchema>;
export type TrainingVideo = typeof trainingVideos.$inferSelect;

// Custom avatars table for user-uploaded photo avatars
export const customAvatars = pgTable("custom_avatars", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  heygenAvatarId: text("heygen_avatar_id"),
  heygenGroupId: text("heygen_group_id"),
  photoUrl: text("photo_url"),
  previewImageUrl: text("preview_image_url"),
  status: text("status").notNull().default("pending"),
  gender: text("gender"),
  ethnicity: text("ethnicity"),
  errorMessage: text("error_message"),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomAvatarSchema = createInsertSchema(customAvatars).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomAvatar = z.infer<typeof insertCustomAvatarSchema>;
export type CustomAvatar = typeof customAvatars.$inferSelect;

// Baseline data table for admin-configurable statistics
export const baselineData = pgTable("baseline_data", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // 'county_population', 'national', 'sector', etc.
  key: text("key").notNull(), // e.g., 'Montserrado', 'total_population', 'target_jobs'
  value: real("value").notNull(),
  label: text("label"), // Display label
  description: text("description"),
  year: integer("year"), // Reference year for the data
  source: text("source"), // Data source
  updatedBy: varchar("updated_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBaselineDataSchema = createInsertSchema(baselineData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBaselineData = z.infer<typeof insertBaselineDataSchema>;
export type BaselineData = typeof baselineData.$inferSelect;

// =============================================
// LABOUR MARKET INDICATORS (Public Dashboard)
// =============================================
export const labourMarketIndicators = pgTable("labour_market_indicators", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  quarter: integer("quarter"),
  unemploymentRate: real("unemployment_rate"),
  employmentToPopRatio: real("employment_to_pop_ratio"),
  labourForceParticipation: real("labour_force_participation"),
  youthUnemploymentRate: real("youth_unemployment_rate"),
  femaleLabourParticipation: real("female_labour_participation"),
  informalEmploymentRate: real("informal_employment_rate"),
  minimumDailyWage: real("minimum_daily_wage"),
  wageCurrency: text("wage_currency").notNull().default("LRD"),
  totalLabourForce: integer("total_labour_force"),
  totalEmployed: integer("total_employed"),
  totalUnemployed: integer("total_unemployed"),
  source: text("source"),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLabourMarketIndicatorSchema = createInsertSchema(labourMarketIndicators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLabourMarketIndicator = z.infer<typeof insertLabourMarketIndicatorSchema>;
export type LabourMarketIndicator = typeof labourMarketIndicators.$inferSelect;

export const countyIndicators = pgTable("county_indicators", {
  id: serial("id").primaryKey(),
  county: text("county").notNull(),
  year: integer("year").notNull(),
  quarter: integer("quarter"),
  population: integer("population"),
  activePopulation: integer("active_population"),
  totalEmployed: integer("total_employed"),
  totalUnemployed: integer("total_unemployed"),
  totalUnderemployed: integer("total_underemployed"),
  unemploymentRate: real("unemployment_rate"),
  employmentRate: real("employment_rate"),
  underemploymentRate: real("underemployment_rate"),
  labourForceParticipation: real("labour_force_participation"),
  maleUnemploymentRate: real("male_unemployment_rate"),
  femaleUnemploymentRate: real("female_unemployment_rate"),
  urbanUnemploymentRate: real("urban_unemployment_rate"),
  ruralUnemploymentRate: real("rural_unemployment_rate"),
  youthUnemploymentRate: real("youth_unemployment_rate"),
  agriculturePct: real("agriculture_pct"),
  servicesPct: real("services_pct"),
  industryPct: real("industry_pct"),
  totalJobSeekers: integer("total_job_seekers"),
  totalVacancies: integer("total_vacancies"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCountyIndicatorSchema = createInsertSchema(countyIndicators).omit({
  id: true,
  createdAt: true,
});
export type InsertCountyIndicator = z.infer<typeof insertCountyIndicatorSchema>;
export type CountyIndicator = typeof countyIndicators.$inferSelect;

// =============================================
// GRIEVANCE / COMPLAINT SYSTEM
// =============================================
export const grievanceCases = pgTable("grievance_cases", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  trackingNumber: text("tracking_number").notNull().unique(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  county: text("county").notNull(),
  employerName: text("employer_name"),
  status: text("status").notNull().default("submitted"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  resolutionNotes: text("resolution_notes"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertGrievanceCaseSchema = createInsertSchema(grievanceCases).omit({
  id: true,
  trackingNumber: true,
  submittedAt: true,
  updatedAt: true,
  resolvedAt: true,
  assignedTo: true,
  resolutionNotes: true,
});
export type InsertGrievanceCase = z.infer<typeof insertGrievanceCaseSchema>;
export type GrievanceCase = typeof grievanceCases.$inferSelect;

// =============================================
// KNOWLEDGE BASE / RESEARCH LIBRARY
// =============================================
export const knowledgeBaseItems = pgTable("knowledge_base_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  author: text("author"),
  publishDate: date("publish_date"),
  url: text("url"),
  fileKey: text("file_key"),
  tags: text("tags").array(),
  isPublished: boolean("is_published").notNull().default(true),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeBaseItemSchema = createInsertSchema(knowledgeBaseItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledgeBaseItem = z.infer<typeof insertKnowledgeBaseItemSchema>;
export type KnowledgeBaseItem = typeof knowledgeBaseItems.$inferSelect;

// =============================================
// WORKPLACE SAFETY & ACCIDENT REPORTING
// =============================================
export const workplaceIncidents = pgTable("workplace_incidents", {
  id: serial("id").primaryKey(),
  reporterName: text("reporter_name").notNull(),
  reporterEmail: text("reporter_email"),
  reporterPhone: text("reporter_phone"),
  employerName: text("employer_name"),
  employerId: varchar("employer_id", { length: 36 }),
  sector: text("sector").notNull(),
  incidentType: text("incident_type").notNull(),
  severity: text("severity").notNull(),
  county: text("county").notNull(),
  location: text("location"),
  incidentDate: date("incident_date").notNull(),
  description: text("description").notNull(),
  fatalities: integer("fatalities").notNull().default(0),
  injuries: integer("injuries").notNull().default(0),
  compensationStatus: text("compensation_status").default("not_filed"),
  compensationAmount: real("compensation_amount"),
  status: text("status").notNull().default("reported"),
  investigationNotes: text("investigation_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const insertWorkplaceIncidentSchema = createInsertSchema(workplaceIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkplaceIncident = z.infer<typeof insertWorkplaceIncidentSchema>;
export type WorkplaceIncident = typeof workplaceIncidents.$inferSelect;

// =============================================
// BIDDING & TENDERING TABLES
// =============================================

export const tenders = pgTable("tenders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id", { length: 36 }).notNull(),
  type: text("type").notNull(), // procurement, service
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // construction, consulting, supply, IT, transportation, catering, maintenance, other
  sector: text("sector"), // public, private, ngo
  county: text("county"),
  district: text("district"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  currency: text("currency").default("LRD"),
  deadline: date("deadline").notNull(),
  requirements: text("requirements"),
  deliverables: text("deliverables"),
  eligibility: text("eligibility"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status").notNull().default("open"), // open, closed, awarded, cancelled
  awardedTo: varchar("awarded_to", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type Tender = typeof tenders.$inferSelect;

export const tenderSubmissions = pgTable("tender_submissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenderId: varchar("tender_id", { length: 36 }).notNull(),
  bidderId: varchar("bidder_id", { length: 36 }).notNull(),
  bidderName: text("bidder_name").notNull(),
  bidderEmail: text("bidder_email").notNull(),
  bidderPhone: text("bidder_phone"),
  companyName: text("company_name"),
  proposalText: text("proposal_text").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").default("LRD"),
  deliveryTimeline: text("delivery_timeline"),
  experience: text("experience"),
  documents: text("documents"), // JSON string of uploaded document URLs [{name, url, type}]
  status: text("status").notNull().default("submitted"), // submitted, reviewed, shortlisted, awarded, rejected
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertTenderSubmissionSchema = createInsertSchema(tenderSubmissions).omit({
  id: true,
  submittedAt: true,
});
export type InsertTenderSubmission = z.infer<typeof insertTenderSubmissionSchema>;
export type TenderSubmission = typeof tenderSubmissions.$inferSelect;

// =============================================
// ECONOMIC INDICATORS - PRICE DATA COLLECTION
// =============================================

export const BASKET_ITEMS = [
  { code: "RICE_25KG", name: "25kg Bag of Rice", unit: "bag", category: "Food - Staples" },
  { code: "RICE_CUP", name: "Cup of Rice", unit: "cup", category: "Food - Staples" },
  { code: "CASSAVA_25KG", name: "25kg Bag of Cassava", unit: "bag", category: "Food - Staples" },
  { code: "EDDOS", name: "Eddos (1 lb)", unit: "lb", category: "Food - Staples" },
  { code: "FUFU", name: "Better-ball / Fufu (1 lb)", unit: "lb", category: "Food - Staples" },
  { code: "PEPPER", name: "Pepper (cup)", unit: "cup", category: "Food - Condiments" },
  { code: "PALM_OIL", name: "Gallon of Palm Oil", unit: "gallon", category: "Food - Oils" },
  { code: "IMPORTED_OIL", name: "Gallon of Imported Oil", unit: "gallon", category: "Food - Oils" },
  { code: "SUGAR", name: "Sugar (1 kg)", unit: "kg", category: "Food - Condiments" },
  { code: "SALT", name: "Salt (1 kg)", unit: "kg", category: "Food - Condiments" },
  { code: "FISH_DRIED", name: "Dried Fish (1 lb)", unit: "lb", category: "Food - Protein" },
  { code: "CHICKEN", name: "Whole Chicken", unit: "each", category: "Food - Protein" },
  { code: "CHARCOAL", name: "Bag of Charcoal", unit: "bag", category: "Energy" },
  { code: "FUEL_GASOLINE", name: "Gasoline (1 gallon)", unit: "gallon", category: "Energy" },
  { code: "FUEL_DIESEL", name: "Diesel (1 gallon)", unit: "gallon", category: "Energy" },
  { code: "TRANSPORT_TAXI", name: "Taxi Ride (in-city)", unit: "trip", category: "Transport" },
  { code: "TRANSPORT_BUS", name: "Bus Fare (in-city)", unit: "trip", category: "Transport" },
  { code: "HOUSING_RENT", name: "Monthly Rent (1-bedroom)", unit: "month", category: "Housing" },
  { code: "WATER", name: "Water (20L jerry can)", unit: "can", category: "Utilities" },
  { code: "PHONE_CREDIT", name: "Mobile Phone Credit", unit: "card", category: "Communication" },
] as const;

export type BasketItemCode = typeof BASKET_ITEMS[number]["code"];

export const priceEntries = pgTable("price_entries", {
  id: serial("id").primaryKey(),
  county: text("county").notNull(),
  district: text("district"),
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("LRD"),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  collectedBy: varchar("collected_by", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPriceEntrySchema = createInsertSchema(priceEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPriceEntry = z.infer<typeof insertPriceEntrySchema>;
export type PriceEntry = typeof priceEntries.$inferSelect;

// =============================================
// AI ASSISTANT CONVERSATIONS
// =============================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
