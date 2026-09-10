import expressModule, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { textToSpeech, speechToText } from "./elevenlabs";
import { 
  loginSchema, 
  registerSchema, 
  type SessionUser, 
  type InsertEmploymentSpell, 
  employmentSpellFormSchema, 
  insertBaselineDataSchema, 
  insertUserSchema,
  insertEmployerSchema,
  insertVacancySchema,
  insertJobCreationEventSchema,
  insertPersonSchema,
  insertJobSeekerProfileSchema,
  insertSkillSchema,
  insertPersonSkillSchema,
  insertApplicationSchema,
  insertLabourMarketIndicatorSchema,
  insertGrievanceCaseSchema,
  insertKnowledgeBaseItemSchema,
  insertWorkplaceIncidentSchema,
  insertTenderSchema,
  insertTenderSubmissionSchema,
  insertPriceEntrySchema,
  BASKET_ITEMS,
  persons,
  personSkills,
  employmentSpells,
  employers,
  vacancies,
  jobSeekerProfiles,
} from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { z } from "zod";

// Validation schemas for three-layer verification workflow
const employerVerifySchema = z.object({
  notes: z.string().optional(),
});

const enumeratorVerifySchema = z.object({
  employeeConfirmed: z.boolean(),
  fieldVisitDate: z.string(),
  notes: z.string().optional(),
});

const ministryVerifySchema = z.object({
  action: z.enum(["approve", "reject", "flag"]),
  notes: z.string().optional(),
});

const verifySpellSchema = z.object({
  verificationStatus: z.enum(["pending", "employer_verified", "enumerator_verified", "fully_verified", "flagged", "rejected"]),
  trustScore: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

// Validation for employer creation
const createEmployerValidation = insertEmployerSchema.extend({
  legalName: z.string().min(2, "Legal name must be at least 2 characters"),
  sector: z.enum(["public", "private", "ngo", "informal"]),
});

// Validation for updating person profile
const updatePersonSchema = z.object({
  county: z.string().optional(),
  district: z.string().optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  hasDisability: z.boolean().optional(),
  isYouth: z.boolean().optional(),
}).partial();

// Validation for updating job seeker profile
const updateJobSeekerProfileSchema = z.object({
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  highestEducation: z.enum(["none", "primary", "secondary", "vocational", "tertiary", "postgraduate"]).optional(),
  yearsExperience: z.string().optional(),
  isOpenToWork: z.boolean().optional(),
  preferredSectors: z.array(z.string()).optional(),
  preferredCounties: z.array(z.string()).optional(),
  minSalaryExpectation: z.number().min(0).optional(),
  salaryCurrency: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
}).partial();

// Validation for updating application status
const updateApplicationSchema = z.object({
  status: z.enum(["submitted", "reviewed", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"]),
  notes: z.string().max(2000).optional(),
});
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { heygenService } from "./heygen";
import { videoScripts } from "./video-scripts";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { initializeDemoData, seedOccupationalEconomicsData, seedInformalSeasonalData } from "./seed";
import { matchJobSeekerToVacancies, matchVacancyToSeekers, getTopMatchesForAllSeekers } from "./matching";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `avatar-${uniqueId}${ext}`);
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  }
});

const excelStorage = multer.memoryStorage();
const uploadExcel = multer({
  storage: excelStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith(".xlsx") || file.originalname.endsWith(".xls") || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) and CSV files are allowed"));
    }
  }
});

const { Pool } = pg;

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    user: SessionUser;
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup session with PostgreSQL store
  const PgSession = connectPgSimple(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Test database connection on startup
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
  } catch (err) {
    console.error("Database connection failed:", err);
    // Continue anyway - some routes may still work
  }

  // Trust proxy for production (needed for secure cookies behind Replit's proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
        errorLog: console.error.bind(console, "Session store error:"),
      }),
      secret: process.env.SESSION_SECRET || "lijobs-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      proxy: process.env.NODE_ENV === "production",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // Register object storage routes for screenshot hosting
  registerObjectStorageRoutes(app);

  // Initialize demo data (ensures demo accounts exist in both dev and production)
  initializeDemoData().then(() => {
    seedOccupationalEconomicsData().then(() => {
      seedInformalSeasonalData().catch(err => {
        console.error("Failed to seed informal/seasonal data:", err);
      });
    }).catch(err => {
      console.error("Failed to seed occupational economics data:", err);
    });
  }).catch(err => {
    console.error("Failed to initialize demo data:", err);
  });

  // ==================== SITE ACCESS CODE GATE ====================

  app.post("/api/access-code/verify", (req: Request, res: Response) => {
    const { code } = req.body;
    const siteAccessCode = process.env.SITE_ACCESS_CODE;
    if (!siteAccessCode) {
      return res.json({ success: true });
    }
    if (code === siteAccessCode) {
      (req.session as any).siteAccessGranted = true;
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: "Invalid access code" });
  });

  app.get("/api/access-code/status", (req: Request, res: Response) => {
    const siteAccessCode = process.env.SITE_ACCESS_CODE;
    if (!siteAccessCode) {
      return res.json({ granted: true });
    }
    return res.json({ granted: !!(req.session as any).siteAccessGranted });
  });

  // ==================== SETUP ROUTES ====================

  // One-time setup endpoint for production - initializes demo accounts
  // Call this once after publishing: POST /api/setup/init with { "setupKey": "lijobs-setup-2025" }
  app.post("/api/setup/init", async (req, res) => {
    try {
      const { setupKey } = req.body;
      
      // Simple protection - require a setup key
      if (setupKey !== "lijobs-setup-2025") {
        return res.status(403).json({ error: "Invalid setup key" });
      }

      console.log("Running production setup...");
      await initializeDemoData();
      
      res.json({ 
        success: true, 
        message: "Demo accounts initialized successfully",
        accounts: [
          { email: "demo_admin@test.com", role: "admin" },
          { email: "demo_director@test.com", role: "director" },
          { email: "demo_ministry@test.com", role: "ministry" },
          { email: "demo_private@test.com", role: "employer" },
          { email: "demo_public@test.com", role: "employer" },
          { email: "demo_ngo@test.com", role: "employer" },
          { email: "demo_enumerator@test.com", role: "enumerator" },
          { email: "demo_enumerator2@test.com", role: "enumerator" },
          { email: "demo_individual@test.com", role: "individual" },
        ],
        password: "Demo@2025"
      });
    } catch (error: any) {
      console.error("Setup failed:", error);
      res.status(500).json({ error: "Setup failed", details: error.message });
    }
  });

  // ==================== HEALTH CHECK ROUTES ====================

  // Public health check to verify services are configured
  app.get("/api/health", async (_req, res) => {
    // Also try to fetch HeyGen data to test the API
    let heygenTest = { avatars: 0, voices: 0, error: null as string | null };
    if (heygenService.isConfigured()) {
      try {
        const avatars = await heygenService.listAvatars();
        const voices = await heygenService.listVoices();
        heygenTest.avatars = avatars.length;
        heygenTest.voices = voices.length;
      } catch (err: any) {
        heygenTest.error = err.message;
      }
    }
    
    // Count custom avatars from database
    const customAvatars = await storage.getCustomAvatars();
    
    res.json({
      status: "ok",
      services: {
        heygen: heygenService.isConfigured(),
        heygenTest,
        customAvatars: customAvatars.length,
        database: !!process.env.DATABASE_URL,
        objectStorage: !!process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID,
      }
    });
  });

  // ==================== AUTH ROUTES ====================

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid credentials format", details: result.error.errors });
      }

      const { email, password } = result.data;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }

      // Check approval status (demo accounts and approved accounts bypass this)
      if (!user.isDemo && user.approvalStatus === "pending") {
        return res.status(403).json({ error: "Your registration is pending approval. Please wait for verification." });
      }
      
      if (!user.isDemo && user.approvalStatus === "rejected") {
        return res.status(403).json({ error: "Your registration was rejected. Please contact support for more information." });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session user (without password)
      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sector: user.sector,
        county: user.county,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        phone: user.phone,
        isActive: user.isActive,
        isDemo: user.isDemo,
        approvalStatus: user.approvalStatus,
        approvalNotes: user.approvalNotes,
        approvedBy: user.approvedBy,
        approvedAt: user.approvedAt,
        businessRegistrationNumber: user.businessRegistrationNumber,
        businessCertificateUrl: user.businessCertificateUrl,
        taxClearanceUrl: user.taxClearanceUrl,
        idNumber: user.idNumber,
        idCardUrl: user.idCardUrl,
        createdAt: user.createdAt,
        lastLogin: new Date(),
      };

      req.session.user = sessionUser;
      
      res.json({ user: sessionUser, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid registration data", details: result.error.errors });
      }

      const { 
        email, password, firstName, lastName, role, sector, county, 
        organizationName, organizationType, phone,
        businessRegistrationNumber, businessCertificateUrl, taxClearanceUrl,
        idNumber, idCardUrl,
        gender, nationality, district, physicalAddress, dateOfBirth,
        educationLevel, educationInstitution, fieldOfStudy,
        yearsOfExperience, currentEmployer, currentJobTitle,
        relevantSkills, languagesSpoken,
        expectedSalary, availableStartDate, willingToRelocate, hasDisability,
        preferredSectors, preferredCounties, headline, summary,
        resumeUrl, supportingDocUrls,
        referenceName1, referencePhone1, referenceRelation1,
        referenceName2, referencePhone2, referenceRelation2,
      } = result.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with pending approval status
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        sector: sector || null,
        county: county || null,
        organizationName: organizationName || null,
        organizationType: organizationType || null,
        phone: phone || null,
        isActive: true,
        isDemo: false,
        approvalStatus: "pending",
        businessRegistrationNumber: businessRegistrationNumber || null,
        businessCertificateUrl: businessCertificateUrl || null,
        taxClearanceUrl: taxClearanceUrl || null,
        idNumber: idNumber || null,
        idCardUrl: idCardUrl || null,
      });

      // For individual registrations, auto-create person + job seeker profile
      if (role === "individual") {
        try {
          const { randomUUID } = await import("crypto");
          const personUid = `LBR-${randomUUID().slice(0, 8).toUpperCase()}`;
          
          const birthYear = dateOfBirth ? new Date(dateOfBirth).getFullYear() : undefined;
          const person = await storage.createPerson({
            personUid,
            userId: newUser.id,
            county: county || null,
            district: district || null,
            sex: gender || null,
            birthYear: birthYear || null,
            nationalityCode: nationality || "LBR",
            hasDisability: hasDisability || false,
            isYouth: birthYear ? (new Date().getFullYear() - birthYear >= 15 && new Date().getFullYear() - birthYear <= 35) : false,
          });

          const educationMap: Record<string, string> = {
            none: "none", primary: "primary", junior_high: "secondary", senior_high: "secondary",
            vocational: "vocational", associate: "tertiary", bachelor: "tertiary",
            master: "postgraduate", doctorate: "postgraduate"
          };

          await storage.createJobSeekerProfile({
            personId: person.id,
            headline: headline || `${firstName} ${lastName} - Job Seeker`,
            summary: summary || null,
            highestEducation: educationLevel ? (educationMap[educationLevel] || educationLevel) : null,
            yearsExperience: yearsOfExperience || "0",
            isOpenToWork: true,
            preferredSectors: preferredSectors || [],
            preferredCounties: preferredCounties || (county ? [county] : []),
            minSalaryExpectation: expectedSalary ? parseInt(expectedSalary) || null : null,
            salaryCurrency: "LRD",
            willingToRelocate: willingToRelocate || false,
          });

          if (relevantSkills) {
            const skillsList = relevantSkills.split(",").map(s => s.trim()).filter(Boolean);
            for (const skillName of skillsList) {
              try {
                let skill = await storage.getSkillByName(skillName);
                if (!skill) {
                  skill = await storage.createSkill({ name: skillName, category: "general" });
                }
                await storage.addPersonSkill({
                  personId: person.id,
                  skillId: skill.id,
                  level: 3,
                });
              } catch (skillErr) {
                console.log("Skipping duplicate skill:", skillName);
              }
            }
          }

          await storage.createPersonIdentity({
            personId: person.id,
            fullNameEnc: `${firstName} ${lastName}`,
            phoneEnc: phone || null,
            emailEnc: email,
            addressEnc: physicalAddress || null,
            nationalIdHash: idNumber || null,
          });
        } catch (profileErr) {
          console.error("Error creating individual profile during registration:", profileErr);
        }
      }

      // Create session
      const sessionUser: SessionUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        sector: newUser.sector,
        county: newUser.county,
        organizationName: newUser.organizationName,
        organizationType: newUser.organizationType,
        phone: newUser.phone,
        isActive: newUser.isActive,
        isDemo: newUser.isDemo,
        approvalStatus: newUser.approvalStatus,
        approvalNotes: newUser.approvalNotes,
        approvedBy: newUser.approvedBy,
        approvedAt: newUser.approvedAt,
        businessRegistrationNumber: newUser.businessRegistrationNumber,
        businessCertificateUrl: newUser.businessCertificateUrl,
        taxClearanceUrl: newUser.taxClearanceUrl,
        idNumber: newUser.idNumber,
        idCardUrl: newUser.idCardUrl,
        createdAt: newUser.createdAt,
        lastLogin: null,
      };

      req.session.user = sessionUser;

      res.status(201).json({ user: sessionUser, message: "Registration submitted for approval" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  // ==================== EMPLOYMENT SPELLS ROUTES ====================

  // Create employment spell
  app.post("/api/employment-spells", requireAuth, async (req, res) => {
    try {
      const result = employmentSpellFormSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid data", details: result.error.errors });
      }

      // Convert wage amount and period to monthly salary
      let monthlySalary: number | null = null;
      const wageAmount = result.data.wageAmount;
      const wagePeriod = result.data.wagePeriod || "monthly";
      
      if (wageAmount) {
        if (wagePeriod === "daily") {
          monthlySalary = wageAmount * 22; // ~22 working days per month
        } else if (wagePeriod === "weekly") {
          monthlySalary = wageAmount * 4; // ~4 weeks per month
        } else {
          monthlySalary = wageAmount;
        }
      } else if (result.data.monthlySalary) {
        monthlySalary = result.data.monthlySalary;
      }

      const user = req.session.user!;
      const isEmployer = user.role === "employer";

      const cleanedData = {
        ...result.data,
        endDate: result.data.endDate || null,
        district: result.data.district || null,
        employeeName: result.data.employeeName || null,
        employeeGender: result.data.employeeGender || null,
        employeeAge: result.data.employeeAge || null,
        employeeAddress: result.data.employeeAddress || null,
        employeeDistrict: result.data.employeeDistrict || null,
        employeeCounty: result.data.employeeCounty || null,
        monthlySalary,
        notes: result.data.notes || null,
      };

      const spellData: InsertEmploymentSpell = {
        ...cleanedData,
        reportedBy: user.id,
        verificationStatus: isEmployer ? "employer_verified" : "pending",
        employerVerifiedBy: isEmployer ? user.id : undefined,
        employerVerificationNotes: isEmployer ? "Auto-verified: submitted by employer" : undefined,
      };

      const spell = await storage.createEmploymentSpell(spellData);

      await storage.createAuditLog({
        actorUserId: user.id,
        action: "CREATE",
        entityType: "employment_spell",
        entityId: spell.id,
        newValues: { employerName: spell.employerName, employeeName: spell.employeeName, verificationStatus: spell.verificationStatus },
      });

      res.status(201).json(spell);
    } catch (error) {
      console.error("Error creating employment spell:", error);
      res.status(500).json({ error: "Failed to create employment record" });
    }
  });

  // Get employment spells (with optional filters)
  app.get("/api/employment-spells", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      let filters: { reportedBy?: string; sector?: string; county?: string } = {};

      // Non-admin users can only see their own records
      if (user.role !== "admin" && user.role !== "ministry") {
        filters.reportedBy = user.id;
      }

      const spells = await storage.getEmploymentSpells(filters);
      res.json(spells);
    } catch (error) {
      console.error("Error fetching employment spells:", error);
      res.status(500).json({ error: "Failed to fetch employment records" });
    }
  });

  // ==================== THREE-LAYER VERIFICATION SYSTEM ====================

  // Layer 1: Employer confirms/signs the employment record
  app.patch("/api/employment-spells/:id/employer-verify", requireRole("employer", "admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const validation = employerVerifySchema.safeParse(req.body);
      const spell = await storage.getEmploymentSpellById(id);
      if (!spell) return res.status(404).json({ error: "Record not found" });
      if (spell.verificationStatus !== "pending") {
        return res.status(400).json({ error: "Record is not in pending status" });
      }

      const updated = await storage.updateEmploymentSpell(id, {
        verificationStatus: "employer_verified",
        employerVerifiedBy: req.session.user!.id,
        employerVerifiedAt: new Date(),
        employerVerificationNotes: validation.success ? validation.data.notes || null : null,
        trustScore: "0.500",
      });

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "EMPLOYER_VERIFY",
        entityType: "employment_spell",
        entityId: id,
        oldValues: { verificationStatus: "pending" },
        newValues: { verificationStatus: "employer_verified" },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error in employer verification:", error);
      res.status(500).json({ error: "Failed to verify employment record" });
    }
  });

  // Layer 2: Enumerator (field agent) physically verifies the record
  app.patch("/api/employment-spells/:id/enumerator-verify", requireRole("enumerator", "admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const validation = enumeratorVerifySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const spell = await storage.getEmploymentSpellById(id);
      if (!spell) return res.status(404).json({ error: "Record not found" });
      if (spell.verificationStatus !== "employer_verified") {
        return res.status(400).json({ error: "Record must be employer-verified before enumerator verification" });
      }

      const { employeeConfirmed, fieldVisitDate, notes } = validation.data;

      let newStatus = "enumerator_verified";
      let newTrustScore = "0.700";
      let discrepancyFlag = false;
      let discrepancyNotes: string | null = null;

      if (!employeeConfirmed) {
        newStatus = "flagged";
        newTrustScore = "0.200";
        discrepancyFlag = true;
        discrepancyNotes = "Enumerator could not confirm employee at workplace";
      }

      const updated = await storage.updateEmploymentSpell(id, {
        verificationStatus: newStatus,
        enumeratorVerifiedBy: req.session.user!.id,
        enumeratorVerifiedAt: new Date(),
        enumeratorVerificationNotes: notes || null,
        enumeratorFieldVisitDate: fieldVisitDate,
        enumeratorEmployeeConfirmed: employeeConfirmed,
        trustScore: newTrustScore,
        discrepancyFlag,
        discrepancyNotes,
      });

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "ENUMERATOR_VERIFY",
        entityType: "employment_spell",
        entityId: id,
        oldValues: { verificationStatus: "employer_verified" },
        newValues: { verificationStatus: newStatus, employeeConfirmed, fieldVisitDate },
      });

      // Cross-reference check: if employer has many unverified vs verified records, flag them
      if (spell.employerId) {
        const stats = await storage.getEmployerVerificationStats(spell.employerId);
        if (stats.reported > 10 && stats.flagged / stats.reported > 0.3) {
          // More than 30% flagged — flag remaining pending spells
          const employerSpells = await storage.getEmploymentSpells({ reportedBy: spell.reportedBy });
          for (const s of employerSpells) {
            if (s.verificationStatus === "pending" || s.verificationStatus === "employer_verified") {
              await storage.updateEmploymentSpell(s.id, {
                discrepancyFlag: true,
                discrepancyNotes: `Cross-reference: Employer has ${stats.flagged}/${stats.reported} flagged records`,
              });
            }
          }
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error in enumerator verification:", error);
      res.status(500).json({ error: "Failed to verify employment record" });
    }
  });

  // Layer 3: Ministry staff gives final approval
  app.patch("/api/employment-spells/:id/ministry-verify", requireRole("ministry", "admin", "director"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const validation = ministryVerifySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
      }

      const spell = await storage.getEmploymentSpellById(id);
      if (!spell) return res.status(404).json({ error: "Record not found" });
      if (spell.verificationStatus !== "enumerator_verified" && spell.verificationStatus !== "flagged") {
        return res.status(400).json({ error: "Record must be enumerator-verified or flagged for ministry review" });
      }

      const { action, notes } = validation.data;
      let newStatus: string;
      let newTrustScore: string;

      switch (action) {
        case "approve":
          newStatus = "fully_verified";
          newTrustScore = "1.000";
          break;
        case "reject":
          newStatus = "rejected";
          newTrustScore = "0.000";
          break;
        case "flag":
          newStatus = "flagged";
          newTrustScore = "0.200";
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      const updated = await storage.updateEmploymentSpell(id, {
        verificationStatus: newStatus,
        ministryVerifiedBy: req.session.user!.id,
        ministryVerifiedAt: new Date(),
        ministryVerificationNotes: notes || null,
        trustScore: newTrustScore,
        verifiedBy: req.session.user!.id,
        verifiedAt: new Date(),
      });

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "MINISTRY_VERIFY",
        entityType: "employment_spell",
        entityId: id,
        oldValues: { verificationStatus: spell.verificationStatus },
        newValues: { verificationStatus: newStatus, action },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error in ministry verification:", error);
      res.status(500).json({ error: "Failed to verify employment record" });
    }
  });

  // Get spells awaiting verification for current user's role
  app.get("/api/verification/queue", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      const filters = {
        status: req.query.status as string | undefined,
        county: req.query.county as string | undefined,
        sector: req.query.sector as string | undefined,
        employer: req.query.employer as string | undefined,
      };
      const spells = await storage.getSpellsForVerification(user.role, user.id, filters);
      res.json(spells);
    } catch (error) {
      console.error("Error fetching verification queue:", error);
      res.status(500).json({ error: "Failed to fetch verification queue" });
    }
  });

  // Get verification summary (counts by status)
  app.get("/api/verification/summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getVerificationSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching verification summary:", error);
      res.status(500).json({ error: "Failed to fetch verification summary" });
    }
  });

  // Get audit trail for a specific employment spell
  app.get("/api/employment-spells/:id/audit-trail", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const logs = await storage.getAuditLogs({ entityType: "employment_spell", entityId: id });
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  });

  // ==================== DIRECTOR OF STATISTICS ROUTES ====================

  app.get("/api/director/overview", requireRole("director", "admin"), async (_req, res) => {
    try {
      const [observatoryStats, verificationSummary] = await Promise.all([
        storage.getObservatoryStats(),
        storage.getVerificationSummary(),
      ]);

      const allSpells = await storage.getEmploymentSpells();
      const allUsers = await storage.getAllUsers();
      const allVacancies = await storage.getVacancies();
      const allJobSeekers = await storage.getJobSeekers();
      const allGrievances = await storage.getGrievanceCases();
      const allIncidents = await storage.getWorkplaceIncidents();
      const allKnowledgeBase = await storage.getKnowledgeBaseItems();
      const allTrainingProviders = await storage.getTrainingProviders();
      const allCourses = await storage.getCourses();
      const allTenders = await storage.getTenders();

      const countyBreakdown: Record<string, { 
        employment: number; vacancies: number; jobSeekers: number; 
        grievances: number; incidents: number; employers: number;
        verified: number; pending: number; flagged: number;
        officers: { id: string; name: string; email: string; role: string }[];
      }> = {};

      const liberianCounties = [
        "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
        "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
        "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
      ];

      for (const county of liberianCounties) {
        countyBreakdown[county] = {
          employment: 0, vacancies: 0, jobSeekers: 0,
          grievances: 0, incidents: 0, employers: 0,
          verified: 0, pending: 0, flagged: 0, officers: []
        };
      }

      for (const spell of allSpells) {
        const c = spell.county;
        if (c && countyBreakdown[c]) {
          countyBreakdown[c].employment++;
          if (spell.verificationStatus === "fully_verified") countyBreakdown[c].verified++;
          if (spell.verificationStatus === "pending" || spell.verificationStatus === "employer_verified") countyBreakdown[c].pending++;
          if (spell.verificationStatus === "flagged") countyBreakdown[c].flagged++;
        }
      }

      for (const v of allVacancies) {
        const c = v.county;
        if (c && countyBreakdown[c]) countyBreakdown[c].vacancies++;
      }

      for (const u of allUsers) {
        if (u.county && countyBreakdown[u.county]) {
          if (u.role === "employer") countyBreakdown[u.county].employers++;
          if (u.role === "enumerator" || u.role === "ministry") {
            countyBreakdown[u.county].officers.push({
              id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role
            });
          }
        }
      }

      for (const g of allGrievances) {
        const c = (g as any).county;
        if (c && countyBreakdown[c]) countyBreakdown[c].grievances++;
      }

      for (const i of allIncidents) {
        const c = i.county;
        if (c && countyBreakdown[c]) countyBreakdown[c].incidents++;
      }

      res.json({
        systemOverview: {
          totalEmploymentSpells: observatoryStats.totalSpells,
          activeSpells: observatoryStats.activeSpells,
          totalVacancies: allVacancies.length,
          totalJobSeekers: allJobSeekers.length,
          totalEmployers: allUsers.filter(u => u.role === "employer").length,
          totalGrievances: allGrievances.length,
          totalIncidents: allIncidents.length,
          totalKnowledgeBase: allKnowledgeBase.length,
          totalTrainingProviders: allTrainingProviders.length,
          totalCourses: allCourses.length,
          totalTenders: allTenders.length,
          totalUsers: allUsers.length,
          avgTrustScore: observatoryStats.avgTrustScore,
          formalJobs: observatoryStats.formalJobs,
          informalJobs: observatoryStats.informalJobs,
          youthEmployment: observatoryStats.youthEmployment,
          femaleEmployment: observatoryStats.femaleEmployment,
        },
        verificationPipeline: verificationSummary,
        countyBreakdown,
      });
    } catch (error) {
      console.error("Error fetching director overview:", error);
      res.status(500).json({ error: "Failed to fetch director overview" });
    }
  });

  app.get("/api/director/overdue-alerts", requireRole("director", "admin"), async (_req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const allUsers = await storage.getAllUsers();
      const now = new Date();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

      const overdueRecords = allSpells.filter(spell => {
        if (spell.verificationStatus === "fully_verified" || spell.verificationStatus === "rejected") return false;
        const createdAt = spell.createdAt ? new Date(spell.createdAt) : null;
        if (!createdAt) return false;
        return (now.getTime() - createdAt.getTime()) > threeDaysMs;
      });

      const officerMap: Record<string, { id: string; name: string; email: string; role: string; county: string }> = {};
      for (const u of allUsers) {
        if ((u.role === "enumerator" || u.role === "ministry") && u.county) {
          officerMap[u.county] = officerMap[u.county] || { id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role, county: u.county };
        }
      }

      const alerts = overdueRecords.map(spell => {
        const createdAt = new Date(spell.createdAt!);
        const daysOverdue = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
        const responsibleOfficer = spell.county ? officerMap[spell.county] || null : null;

        return {
          spellId: spell.id,
          employeeName: spell.employeeName,
          employerName: spell.employerName,
          jobTitle: spell.jobTitle,
          county: spell.county,
          district: spell.district,
          verificationStatus: spell.verificationStatus,
          createdAt: spell.createdAt,
          daysOverdue,
          responsibleOfficer,
        };
      });

      alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);

      const countySummary: Record<string, { total: number; overdue: number }> = {};
      for (const alert of alerts) {
        if (alert.county) {
          if (!countySummary[alert.county]) countySummary[alert.county] = { total: 0, overdue: 0 };
          countySummary[alert.county].overdue++;
        }
      }

      res.json({
        totalOverdue: alerts.length,
        alerts,
        countySummary,
      });
    } catch (error) {
      console.error("Error fetching overdue alerts:", error);
      res.status(500).json({ error: "Failed to fetch overdue alerts" });
    }
  });

  app.get("/api/director/officer-performance", requireRole("director", "admin"), async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allSpells = await storage.getEmploymentSpells();

      const officers = allUsers.filter(u => u.role === "enumerator" || u.role === "ministry");
      
      const performance = officers.map(officer => {
        const countySpells = allSpells.filter(s => s.county === officer.county);
        const verified = countySpells.filter(s => 
          s.verificationStatus === "fully_verified" || 
          s.verificationStatus === "enumerator_verified"
        ).length;
        const pending = countySpells.filter(s => 
          s.verificationStatus === "pending" || 
          s.verificationStatus === "employer_verified"
        ).length;
        const flagged = countySpells.filter(s => s.verificationStatus === "flagged").length;

        const now = new Date();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const overdue = countySpells.filter(s => {
          if (s.verificationStatus === "fully_verified" || s.verificationStatus === "rejected") return false;
          const createdAt = s.createdAt ? new Date(s.createdAt) : null;
          return createdAt ? (now.getTime() - createdAt.getTime()) > threeDaysMs : false;
        }).length;

        return {
          id: officer.id,
          name: `${officer.firstName} ${officer.lastName}`,
          email: officer.email,
          role: officer.role,
          county: officer.county,
          phone: officer.phone,
          totalRecords: countySpells.length,
          verified,
          pending,
          flagged,
          overdue,
          verificationRate: countySpells.length > 0 ? Math.round((verified / countySpells.length) * 100) : 0,
        };
      });

      res.json(performance);
    } catch (error) {
      console.error("Error fetching officer performance:", error);
      res.status(500).json({ error: "Failed to fetch officer performance" });
    }
  });

  // ==================== ECONOMIC INDICATORS / PRICE DATA ROUTES ====================

  app.get("/api/basket-items", (_req, res) => {
    res.json(BASKET_ITEMS);
  });

  app.get("/api/price-entries", async (req, res) => {
    try {
      const { county, month, year, category } = req.query;
      const filters: any = {};
      if (county) filters.county = county as string;
      if (month) filters.month = parseInt(month as string);
      if (year) filters.year = parseInt(year as string);
      if (category) filters.category = category as string;
      const entries = await storage.getPriceEntries(filters);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching price entries:", error);
      res.status(500).json({ error: "Failed to fetch price entries" });
    }
  });

  app.post("/api/price-entries", requireRole("admin", "ministry", "enumerator", "director"), async (req, res) => {
    try {
      const validated = insertPriceEntrySchema.parse({
        ...req.body,
        collectedBy: req.session.user?.id,
      });
      const entry = await storage.createPriceEntry(validated);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating price entry:", error);
      res.status(500).json({ error: "Failed to create price entry" });
    }
  });

  app.post("/api/price-entries/bulk", requireRole("admin", "ministry", "enumerator", "director"), async (req, res) => {
    try {
      const { entries } = req.body;
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: "entries must be a non-empty array" });
      }
      const validated = entries.map((e: any) =>
        insertPriceEntrySchema.parse({
          ...e,
          collectedBy: req.session.user?.id,
        })
      );
      const created = await storage.createPriceEntriesBulk(validated);
      res.status(201).json({ count: created.length, entries: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error bulk creating price entries:", error);
      res.status(500).json({ error: "Failed to create price entries" });
    }
  });

  app.patch("/api/price-entries/:id", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePriceEntry(id, req.body);
      if (!updated) return res.status(404).json({ error: "Price entry not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating price entry:", error);
      res.status(500).json({ error: "Failed to update price entry" });
    }
  });

  app.delete("/api/price-entries/:id", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePriceEntry(id);
      if (!deleted) return res.status(404).json({ error: "Price entry not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting price entry:", error);
      res.status(500).json({ error: "Failed to delete price entry" });
    }
  });

  // CPI & Economic Indicators calculation endpoint
  app.get("/api/economic-indicators", async (req, res) => {
    try {
      const { year, baseYear, county, compare } = req.query;
      const allPrices = await storage.getPriceEntries();
      const allSpells = await storage.getEmploymentSpells();
      const availableYears = [...new Set(allPrices.map(p => p.year))].sort((a, b) => b - a);
      const latestAvailableYear = availableYears[0] || new Date().getFullYear();
      const targetYear = year ? parseInt(year as string) : latestAvailableYear;
      const baseYearNum = baseYear ? parseInt(baseYear as string) : targetYear - 1;

      const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const liberianCounties = [
        "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
        "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
        "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
      ];

      function percentile(arr: number[], p: number) {
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = (p / 100) * (sorted.length - 1);
        const lo = Math.floor(idx), hi = Math.ceil(idx);
        return lo === hi ? sorted[lo] : Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
      }

      function computeCountyData(countyName: string) {
        const currentPrices = allPrices.filter(p => p.county === countyName && p.year === targetYear);
        const basePrices = allPrices.filter(p => p.county === countyName && p.year === baseYearNum);
        const countySpells = allSpells.filter(s => s.county === countyName && s.monthlySalary && s.monthlySalary > 0);

        let cpi = 100, cpiItems = 0, currentAvg = 0, baseAvg = 0;
        if (currentPrices.length > 0 && basePrices.length > 0) {
          currentAvg = currentPrices.reduce((sum, p) => sum + p.price, 0) / currentPrices.length;
          baseAvg = basePrices.reduce((sum, p) => sum + p.price, 0) / basePrices.length;
          cpi = baseAvg > 0 ? Math.round((currentAvg / baseAvg) * 100 * 100) / 100 : 100;
          cpiItems = currentPrices.length;
        } else if (currentPrices.length > 0) {
          currentAvg = currentPrices.reduce((sum, p) => sum + p.price, 0) / currentPrices.length;
          cpiItems = currentPrices.length;
        }

        let totalBasket = 0;
        const categories: Record<string, number> = {};
        if (currentPrices.length > 0) {
          const latestMonth = Math.max(...currentPrices.map(p => p.month));
          const monthPrices = currentPrices.filter(p => p.month === latestMonth);
          totalBasket = Math.round(monthPrices.reduce((sum, p) => sum + p.price, 0) * 100) / 100;
          for (const p of monthPrices) {
            categories[p.category] = (categories[p.category] || 0) + p.price;
          }
        }

        let avgWage = 0, medianWage = 0, wageCount = 0, minWage = 0, maxWage = 0;
        if (countySpells.length > 0) {
          const wages = countySpells.map(s => s.monthlySalary!).sort((a, b) => a - b);
          avgWage = Math.round(wages.reduce((sum, w) => sum + w, 0) / wages.length);
          medianWage = Math.round(percentile(wages, 50));
          wageCount = wages.length;
          minWage = Math.round(wages[0]);
          maxWage = Math.round(wages[wages.length - 1]);
        }

        const ratio = totalBasket > 0 && avgWage > 0 ? Math.round((avgWage / totalBasket) * 100) / 100 : 0;
        const surplus = avgWage > 0 && totalBasket > 0 ? Math.round(avgWage - totalBasket) : 0;

        const monthlyBasket: { month: string; cost: number; monthNum: number }[] = [];
        const monthlyCPI: { month: string; cpi: number; monthNum: number }[] = [];
        const yearPricesGrouped: Record<number, typeof currentPrices> = {};
        for (const p of allPrices.filter(pp => pp.county === countyName)) {
          if (!yearPricesGrouped[p.year]) yearPricesGrouped[p.year] = [];
          yearPricesGrouped[p.year].push(p);
        }
        const relevantYearPrices = allPrices.filter(pp => pp.county === countyName && (pp.year === targetYear || pp.year === baseYearNum));
        const monthsWithData = [...new Set(relevantYearPrices.filter(p => p.year === targetYear).map(p => p.month))].sort((a, b) => a - b);
        for (const m of monthsWithData) {
          const mp = allPrices.filter(p => p.county === countyName && p.year === targetYear && p.month === m);
          const bp = allPrices.filter(p => p.county === countyName && p.year === baseYearNum && p.month === m);
          const cost = mp.reduce((s, p) => s + p.price, 0);
          monthlyBasket.push({ month: MONTHS_SHORT[m - 1], cost: Math.round(cost * 100) / 100, monthNum: m });
          if (bp.length > 0) {
            const cAvg = mp.reduce((s, p) => s + p.price, 0) / mp.length;
            const bAvg = bp.reduce((s, p) => s + p.price, 0) / bp.length;
            monthlyCPI.push({ month: MONTHS_SHORT[m - 1], cpi: bAvg > 0 ? Math.round((cAvg / bAvg) * 100 * 100) / 100 : 100, monthNum: m });
          }
        }

        const topDrivers = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, val]) => ({
          category: cat, cost: Math.round(val), share: totalBasket > 0 ? Math.round((val / totalBasket) * 100) : 0,
        }));

        return {
          county: countyName,
          cpi, cpiItems,
          basketCost: totalBasket, categories,
          avgWage, medianWage, wageCount, minWage, maxWage,
          ratio, surplus,
          monthlyBasket, monthlyCPI, topDrivers,
        };
      }

      const rankings = liberianCounties.map(c => computeCountyData(c)).filter(d => d.cpiItems > 0 || d.wageCount > 0);

      const cpiValues = rankings.filter(r => r.cpi !== 100 || r.cpiItems > 0).map(r => r.cpi);
      const nationalCPI = cpiValues.length > 0 ? Math.round((cpiValues.reduce((s, v) => s + v, 0) / cpiValues.length) * 100) / 100 : 100;

      const allWages = allSpells.filter(s => s.monthlySalary && s.monthlySalary > 0).map(s => s.monthlySalary!);
      const nationalAvgWage = allWages.length > 0 ? Math.round(allWages.reduce((a, b) => a + b, 0) / allWages.length) : 0;
      const nationalMedianWage = allWages.length > 0 ? percentile(allWages, 50) : 0;
      const avgBasketCost = rankings.filter(r => r.basketCost > 0).length > 0
        ? Math.round(rankings.filter(r => r.basketCost > 0).reduce((s, r) => s + r.basketCost, 0) / rankings.filter(r => r.basketCost > 0).length)
        : 0;
      const nationalRatio = avgBasketCost > 0 ? Math.round((nationalAvgWage / avgBasketCost) * 100) / 100 : 0;

      const categories = [...new Set(allPrices.map(p => p.category))];
      const categoryTrends: Record<string, { month: string; avgPrice: number; monthNum: number; year: number }[]> = {};
      for (const cat of categories) {
        const catPrices = allPrices.filter(p => p.category === cat);
        const grouped: Record<string, number[]> = {};
        for (const p of catPrices) {
          const key = `${p.year}-${p.month}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p.price);
        }
        categoryTrends[cat] = Object.entries(grouped).map(([key, prices]) => {
          const [y, m] = key.split("-").map(Number);
          return { month: `${MONTHS_SHORT[m - 1]} ${y}`, avgPrice: Math.round(prices.reduce((s, v) => s + v, 0) / prices.length * 100) / 100, monthNum: m, year: y };
        }).sort((a, b) => a.year - b.year || a.monthNum - b.monthNum);
      }

      const scatterData = rankings.filter(r => r.basketCost > 0 && r.avgWage > 0).map(r => ({
        county: r.county, basketCost: r.basketCost, avgWage: r.avgWage,
        ratio: r.ratio, surplus: r.surplus, workers: r.wageCount,
      }));

      const insights: string[] = [];
      const highestCPI = rankings.filter(r => r.cpi > 100).sort((a, b) => b.cpi - a.cpi)[0];
      if (highestCPI) insights.push(`${highestCPI.county} has the highest CPI at ${highestCPI.cpi} (${((highestCPI.cpi - 100)).toFixed(1)}% above baseline).`);
      const lowestRatio = scatterData.sort((a, b) => a.ratio - b.ratio)[0];
      if (lowestRatio && lowestRatio.ratio < 1) insights.push(`${lowestRatio.county} has an affordability ratio of ${lowestRatio.ratio}x — workers face a deficit.`);
      const highestBasket = rankings.filter(r => r.basketCost > 0).sort((a, b) => b.basketCost - a.basketCost)[0];
      if (highestBasket) insights.push(`${highestBasket.county} has the highest basket cost at L$${highestBasket.basketCost.toLocaleString()}.`);
      const topCat = Object.entries(categoryTrends).map(([cat, points]) => {
        if (points.length < 2) return { cat, change: 0 };
        const first = points[0].avgPrice, last = points[points.length - 1].avgPrice;
        return { cat, change: first > 0 ? Math.round(((last - first) / first) * 100) : 0 };
      }).sort((a, b) => b.change - a.change)[0];
      if (topCat && topCat.change > 0) insights.push(`${topCat.cat} is the fastest-rising category (+${topCat.change}% over the data period).`);

      let selectedCountyDetail = null;
      if (county && county !== "all" && typeof county === "string") {
        selectedCountyDetail = computeCountyData(county);
      }

      let compareCountyDetail = null;
      if (compare && compare !== "none" && typeof compare === "string") {
        compareCountyDetail = computeCountyData(compare);
      }

      const cpiByCounty: Record<string, { current: number; base: number; cpi: number; items: number }> = {};
      const costOfLivingByCounty: Record<string, { totalBasket: number; categories: Record<string, number> }> = {};
      const wagesByCounty: Record<string, { avgWage: number; medianWage: number; count: number; minWage: number; maxWage: number }> = {};
      const wageVsCost: Record<string, { avgWage: number; basketCost: number; affordabilityRatio: number; surplus: number }> = {};
      for (const r of rankings) {
        if (r.cpiItems > 0) cpiByCounty[r.county] = { current: 0, base: 0, cpi: r.cpi, items: r.cpiItems };
        if (r.basketCost > 0) costOfLivingByCounty[r.county] = { totalBasket: r.basketCost, categories: r.categories };
        if (r.wageCount > 0) wagesByCounty[r.county] = { avgWage: r.avgWage, medianWage: r.medianWage, count: r.wageCount, minWage: r.minWage, maxWage: r.maxWage };
        if (r.basketCost > 0 && r.avgWage > 0) wageVsCost[r.county] = { avgWage: r.avgWage, basketCost: r.basketCost, affordabilityRatio: r.ratio, surplus: r.surplus };
      }

      res.json({
        targetYear,
        baseYear: baseYearNum,
        nationalCPI,
        nationalAvgWage,
        nationalMedianWage,
        avgBasketCost,
        nationalRatio,
        cpiByCounty,
        costOfLivingByCounty,
        wagesByCounty,
        wageVsCost,
        priceTrends: categoryTrends,
        totalPriceEntries: allPrices.length,
        countiesWithData: Object.keys(cpiByCounty).length,
        rankings,
        scatterData,
        insights,
        selectedCountyDetail,
        compareCountyDetail,
        lastUpdated: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error computing economic indicators:", error);
      res.status(500).json({ error: "Failed to compute economic indicators" });
    }
  });

  // ==================== DASHBOARD ROUTES ====================

  // Dashboard data endpoint
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // National statistics page - comprehensive data from real records
  app.get("/api/national-statistics", async (_req, res) => {
    try {
      const data = await storage.getNationalStatisticsData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching national statistics:", error);
      res.status(500).json({ error: "Failed to fetch national statistics" });
    }
  });

  app.get("/api/reports/drilldown", async (req, res) => {
    try {
      const { sector, county } = req.query;
      const sectorLabelToKey: Record<string, string> = {
        "Private": "private", "Public": "public", "NGO/Projects": "ngo",
        "Informal": "informal", "Seasonal": "seasonal",
      };
      const filters: { sector?: string; county?: string } = {};
      if (sector && typeof sector === "string") {
        filters.sector = sectorLabelToKey[sector] || sector.toLowerCase();
      }
      if (county && typeof county === "string") filters.county = county;

      const spells = await storage.getEmploymentSpells(filters);

      const contractTypes: Record<string, number> = {};
      const genderDist: Record<string, number> = {};
      const verificationDist: Record<string, number> = {};
      const sectorDist: Record<string, number> = {};
      const countyDist: Record<string, number> = {};
      let totalWages = 0;
      let wageCount = 0;
      let activeCount = 0;

      spells.forEach(s => {
        const ct = s.contractType || "unknown";
        contractTypes[ct] = (contractTypes[ct] || 0) + 1;

        const gen = s.employeeGender || "unknown";
        genderDist[gen] = (genderDist[gen] || 0) + 1;

        const vs = s.verificationStatus || "self_reported";
        verificationDist[vs] = (verificationDist[vs] || 0) + 1;

        const sec = s.sector || "unknown";
        sectorDist[sec] = (sectorDist[sec] || 0) + 1;

        const cty = s.county || "unknown";
        countyDist[cty] = (countyDist[cty] || 0) + 1;

        if (s.monthlySalary) {
          totalWages += Number(s.monthlySalary);
          wageCount++;
        }
        if (!s.endDate || new Date(s.endDate) > new Date()) {
          activeCount++;
        }
      });

      res.json({
        totalRecords: spells.length,
        activeRecords: activeCount,
        averageWage: wageCount > 0 ? Math.round(totalWages / wageCount) : 0,
        contractTypes: Object.entries(contractTypes).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
        genderDistribution: Object.entries(genderDist).map(([gender, count]) => ({ gender, count })).sort((a, b) => b.count - a.count),
        verificationBreakdown: Object.entries(verificationDist).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
        sectorBreakdown: Object.entries(sectorDist).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count),
        countyBreakdown: Object.entries(countyDist).map(([county, count]) => ({ county, count })).sort((a, b) => b.count - a.count),
        filterApplied: { sector: filters.sector || null, county: filters.county || null }
      });
    } catch (error) {
      console.error("Error fetching reports drilldown:", error);
      res.status(500).json({ error: "Failed to fetch drill-down data" });
    }
  });

  app.get("/api/inflation-calculator", async (req, res) => {
    try {
      const { amount, fromMonth, fromYear, toMonth, toYear } = req.query;
      const amt = parseFloat(amount as string) || 1000;
      const fMonth = parseInt(fromMonth as string) || 1;
      const fYear = parseInt(fromYear as string) || 2024;
      const tMonth = parseInt(toMonth as string) || 1;
      const tYear = parseInt(toYear as string) || 2025;

      const allPrices = await storage.getPriceEntries();

      const fromPrices = allPrices.filter(p => p.year === fYear && p.month === fMonth);
      const toPrices = allPrices.filter(p => p.year === tYear && p.month === tMonth);

      if (fromPrices.length === 0 || toPrices.length === 0) {
        const fromNearby = allPrices.filter(p => p.year === fYear);
        const toNearby = allPrices.filter(p => p.year === tYear);
        if (fromNearby.length > 0 && toNearby.length > 0) {
          const fromAvg = fromNearby.reduce((s, p) => s + p.price, 0) / fromNearby.length;
          const toAvg = toNearby.reduce((s, p) => s + p.price, 0) / toNearby.length;
          const ratio = fromAvg > 0 ? toAvg / fromAvg : 1;
          res.json({ result: Math.round(amt * ratio * 100) / 100, method: "yearly_average", fromAvg, toAvg });
          return;
        }
        res.json({ result: amt, method: "no_data", note: "Insufficient price data for the selected periods" });
        return;
      }

      const fromAvg = fromPrices.reduce((s, p) => s + p.price, 0) / fromPrices.length;
      const toAvg = toPrices.reduce((s, p) => s + p.price, 0) / toPrices.length;
      const ratio = fromAvg > 0 ? toAvg / fromAvg : 1;

      res.json({
        result: Math.round(amt * ratio * 100) / 100,
        method: "monthly_cpi",
        fromAvg: Math.round(fromAvg * 100) / 100,
        toAvg: Math.round(toAvg * 100) / 100,
        inflationRate: Math.round((ratio - 1) * 100 * 100) / 100,
      });
    } catch (error) {
      console.error("Error in inflation calculator:", error);
      res.status(500).json({ error: "Failed to calculate inflation" });
    }
  });

  // National stats endpoint
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getNationalStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Counties endpoint
  app.get("/api/counties", async (_req, res) => {
    try {
      const counties = await storage.getCounties();
      res.json(counties);
    } catch (error) {
      console.error("Error fetching counties:", error);
      res.status(500).json({ error: "Failed to fetch counties" });
    }
  });

  // Monthly data endpoint
  app.get("/api/monthly-data", async (_req, res) => {
    try {
      const monthlyData = await storage.getMonthlyData();
      res.json(monthlyData);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });

  // Sector data endpoint
  app.get("/api/sectors", async (_req, res) => {
    try {
      const sectorData = await storage.getSectorData();
      res.json(sectorData);
    } catch (error) {
      console.error("Error fetching sector data:", error);
      res.status(500).json({ error: "Failed to fetch sector data" });
    }
  });

  // Get sector breakdown for a specific county
  app.get("/api/counties/:county/sectors", async (req, res) => {
    try {
      const { county } = req.params;
      const sectorData = await storage.getCountySectorData(county);
      res.json(sectorData);
    } catch (error) {
      console.error("Error fetching county sector data:", error);
      res.status(500).json({ error: "Failed to fetch county sector data" });
    }
  });

  // ==================== DATA PORTAL ROUTES ====================

  // Get job postings for data portal
  app.get("/api/data/postings", async (_req, res) => {
    try {
      const postings = await storage.getDataPortalPostings();
      res.json(postings);
    } catch (error) {
      console.error("Error fetching data portal postings:", error);
      res.status(500).json({ error: "Failed to fetch postings" });
    }
  });

  // Get job postings stats for data portal
  app.get("/api/data/postings/stats", async (_req, res) => {
    try {
      const stats = await storage.getDataPortalPostingsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching postings stats:", error);
      res.status(500).json({ error: "Failed to fetch postings stats" });
    }
  });

  // Get job seekers for data portal
  app.get("/api/data/seekers", async (_req, res) => {
    try {
      const seekers = await storage.getDataPortalSeekers();
      res.json(seekers);
    } catch (error) {
      console.error("Error fetching data portal seekers:", error);
      res.status(500).json({ error: "Failed to fetch seekers" });
    }
  });

  // Get job seekers stats for data portal
  app.get("/api/data/seekers/stats", async (_req, res) => {
    try {
      const stats = await storage.getDataPortalSeekersStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching seekers stats:", error);
      res.status(500).json({ error: "Failed to fetch seekers stats" });
    }
  });

  // ==================== REPORTS & EXPORT ROUTES ====================

  // Export employment data to Excel
  app.get("/api/export/employment", requireAuth, async (req, res) => {
    try {
      const spells = await storage.getEmploymentSpells({});
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(spells.map(s => ({
        "Person ID": s.personId,
        "Employer ID": s.employerId,
        "Job Title": s.jobTitle,
        "Sector": s.sector,
        "County": s.county,
        "District": s.district,
        "Start Date": s.startDate,
        "End Date": s.endDate || "Active",
        "Formal Indicator": s.formalIndicator,
        "Contract Type": s.contractType,
        "Monthly Salary": s.monthlySalary,
        "Currency": s.currency,
        "Verification Status": s.verificationStatus,
        "Trust Score": s.trustScore,
        "Created At": s.createdAt
      })));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employment Spells");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=employment_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting employment data:", error);
      res.status(500).json({ error: "Failed to export employment data" });
    }
  });

  // Export vacancies to Excel
  app.get("/api/export/vacancies", requireAuth, async (req, res) => {
    try {
      const vacanciesData = await storage.getVacancies({});
      const employersData = await storage.getEmployers();
      const employerMap = new Map(employersData.map(e => [e.id, e]));
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(vacanciesData.map(v => {
        const employer = employerMap.get(v.employerId);
        return {
          "Vacancy ID": v.id,
          "Job Title": v.title,
          "Employer": employer?.legalName || "Unknown",
          "Sector": employer?.sector || "Unknown",
          "County": v.county,
          "District": v.district,
          "Contract Type": v.contractType,
          "Work Mode": v.workMode,
          "Openings": v.openings,
          "Min Salary": v.minSalary,
          "Max Salary": v.maxSalary,
          "Currency": v.currency,
          "Status": v.status,
          "Posted Date": v.postedAt
        };
      }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vacancies");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=vacancies_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting vacancies:", error);
      res.status(500).json({ error: "Failed to export vacancies" });
    }
  });

  // Export job seekers to Excel
  app.get("/api/export/job-seekers", requireAuth, async (req, res) => {
    try {
      const seekersData = await storage.getJobSeekers({});
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(seekersData.map(s => ({
        "Person UID": s.person.personUid,
        "County": s.person.county,
        "Sex": s.person.sex,
        "Is Youth": s.person.isYouth ? "Yes" : "No",
        "Has Disability": s.person.hasDisability ? "Yes" : "No",
        "Headline": s.headline,
        "Highest Education": s.highestEducation,
        "Years Experience": s.yearsExperience,
        "Open to Work": s.isOpenToWork ? "Yes" : "No",
        "Preferred Sectors": s.preferredSectors?.join(", ") || "",
        "Preferred Counties": s.preferredCounties?.join(", ") || "",
        "Willing to Relocate": s.willingToRelocate ? "Yes" : "No",
        "Min Salary Expectation": s.minSalaryExpectation
      })));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Job Seekers");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=job_seekers_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting job seekers:", error);
      res.status(500).json({ error: "Failed to export job seekers" });
    }
  });

  // Export employers to Excel
  app.get("/api/export/employers", requireAuth, async (req, res) => {
    try {
      const employersData = await storage.getEmployers();
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(employersData.map(e => ({
        "Employer ID": e.id,
        "Legal Name": e.legalName,
        "Trading Name": e.tradingName,
        "Sector": e.sector,
        "Is Public Sector": e.isPublicSector ? "Yes" : "No",
        "Contact Email": e.contactEmail,
        "Contact Phone": e.contactPhone,
        "Website": e.website,
        "Is Verified": e.isVerified ? "Yes" : "No",
        "Trust Score": e.trustScore,
        "Created At": e.createdAt
      })));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employers");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=employers_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting employers:", error);
      res.status(500).json({ error: "Failed to export employers" });
    }
  });

  // Export comprehensive report data as JSON (for PDF generation client-side)
  app.get("/api/export/report-data", requireAuth, async (req, res) => {
    try {
      const [stats, sectorData, counties, monthlyData, observatoryStats] = await Promise.all([
        storage.getNationalStats(),
        storage.getSectorData(),
        storage.getCounties(),
        storage.getMonthlyData(),
        storage.getObservatoryStats()
      ]);
      
      res.json({
        stats,
        sectorData,
        counties,
        monthlyData,
        observatoryStats,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      res.status(500).json({ error: "Failed to fetch report data" });
    }
  });

  // ==================== JOB MATCHING ROUTES ====================

  // Get job matches for a specific seeker (requires auth)
  app.get("/api/matching/seeker/:personId", requireAuth, async (req, res) => {
    try {
      const personId = req.params.personId as string;
      const matches = await matchJobSeekerToVacancies(personId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching job matches:", error);
      res.status(500).json({ error: "Failed to fetch job matches" });
    }
  });

  // Get candidate matches for a specific vacancy (employer or admin)
  app.get("/api/matching/vacancy/:vacancyId", requireAuth, async (req, res) => {
    try {
      const vacancyId = req.params.vacancyId as string;
      const matches = await matchVacancyToSeekers(vacancyId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching candidate matches:", error);
      res.status(500).json({ error: "Failed to fetch candidate matches" });
    }
  });

  // Get all top matches for the current logged-in user's profile
  app.get("/api/matching/my-matches", requireAuth, async (req, res) => {
    try {
      const sessionUser = req.session.user as SessionUser;
      const person = await storage.getPersonByUserId(sessionUser.id);
      if (!person) {
        return res.json([]);
      }
      const matches = await matchJobSeekerToVacancies(person.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching my matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // Get top matches for all active job seekers (admin/ministry only)
  app.get("/api/matching/all", requireRole("admin", "ministry"), async (_req, res) => {
    try {
      const matches = await getTopMatchesForAllSeekers(5);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching all matches:", error);
      res.status(500).json({ error: "Failed to fetch all matches" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Get all users (admin only)
  app.get("/api/admin/users", requireRole("admin"), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Toggle user active status (admin only)
  app.patch("/api/admin/users/:id/toggle-status", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Prevent toggling demo accounts
      if (user.isDemo) {
        return res.status(400).json({ error: "Cannot modify demo accounts" });
      }
      const updated = await storage.updateUser(id, { isActive: !user.isActive });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/admin/users/:id/role", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;
      if (!role || !["admin", "ministry", "employer", "enumerator", "individual"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Prevent modifying demo accounts
      if (user.isDemo) {
        return res.status(400).json({ error: "Cannot modify demo accounts" });
      }
      const updated = await storage.updateUser(id, { role });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update user" });
      }
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Create new user (admin only)
  app.post("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      // Create schema for admin user creation (includes password)
      const adminCreateUserSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
      });

      const parsed = adminCreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid user data", details: parsed.error.flatten() });
      }

      // Check if email already exists
      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      const newUser = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
        isDemo: false,
        isActive: true,
      });

      const { password: _, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user details (admin only)
  app.put("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent modifying demo accounts
      if (user.isDemo) {
        return res.status(400).json({ error: "Cannot modify demo accounts" });
      }

      // Create update schema (all fields optional, password separate handling)
      const updateUserSchema = z.object({
        email: z.string().email().optional(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        role: z.enum(["admin", "ministry", "employer", "enumerator", "individual"]).optional(),
        sector: z.string().nullable().optional(),
        county: z.string().nullable().optional(),
        organizationName: z.string().nullable().optional(),
        organizationType: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional(),
      });

      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid user data", details: parsed.error.flatten() });
      }

      // If email is being changed, check it doesn't conflict
      if (parsed.data.email && parsed.data.email !== user.email) {
        const existingEmail = await storage.getUserByEmail(parsed.data.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      // Handle password separately
      let updates: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.password) {
        updates.password = await bcrypt.hash(parsed.data.password, 10);
      }

      const updated = await storage.updateUser(id, updates);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent deleting demo accounts
      if (user.isDemo) {
        return res.status(400).json({ error: "Cannot delete demo accounts" });
      }

      // Prevent deleting yourself
      const currentUser = req.session?.user;
      if (currentUser && currentUser.id === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete user" });
      }

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ==================== REGISTRATION VERIFICATION ROUTES ====================

  // Configure multer for registration document uploads
  const registrationDocStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const docDir = path.join(process.cwd(), "uploads", "registration-docs");
      if (!fs.existsSync(docDir)) {
        fs.mkdirSync(docDir, { recursive: true });
      }
      cb(null, docDir);
    },
    filename: (_req, file, cb) => {
      const uniqueId = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname) || ".pdf";
      cb(null, `doc-${uniqueId}${ext}`);
    }
  });

  const uploadRegistrationDoc = multer({
    storage: registrationDocStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, PNG, WebP, and PDF files are allowed"));
      }
    }
  });

  // Upload registration document (public - for registration process)
  app.post("/api/upload/registration-doc", uploadRegistrationDoc.single("document"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/uploads/registration-docs/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: error.message || "Failed to upload document" });
    }
  });

  // Serve registration documents using express.static
  const registrationDocsPath = path.join(process.cwd(), "uploads", "registration-docs");
  if (!fs.existsSync(registrationDocsPath)) {
    fs.mkdirSync(registrationDocsPath, { recursive: true });
  }
  app.use("/uploads/registration-docs", expressModule.static(registrationDocsPath));

  // Get pending registrations (admin or ministry verifier)
  app.get("/api/admin/pending-registrations", requireRole("admin", "ministry"), async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const pendingUsers = allUsers.filter(u => u.approvalStatus === "pending" && !u.isDemo);
      
      // Return users without password
      const safeUsers = pendingUsers.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        sector: u.sector,
        county: u.county,
        organizationName: u.organizationName,
        organizationType: u.organizationType,
        phone: u.phone,
        approvalStatus: u.approvalStatus,
        businessRegistrationNumber: u.businessRegistrationNumber,
        businessCertificateUrl: u.businessCertificateUrl,
        taxClearanceUrl: u.taxClearanceUrl,
        idNumber: u.idNumber,
        idCardUrl: u.idCardUrl,
        createdAt: u.createdAt
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      res.status(500).json({ error: "Failed to fetch pending registrations" });
    }
  });

  // Approve registration (admin or ministry verifier)
  app.post("/api/admin/registrations/:id/approve", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const userId = req.params.id as string;
      const { notes } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.approvalStatus !== "pending") {
        return res.status(400).json({ error: "User is not pending approval" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        approvalStatus: "approved",
        approvalNotes: notes || "Registration approved",
        approvedBy: req.session.user!.id,
        approvedAt: new Date()
      });
      
      res.json({ success: true, message: "Registration approved", user: updatedUser });
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ error: "Failed to approve registration" });
    }
  });

  // Reject registration (admin or ministry verifier)
  app.post("/api/admin/registrations/:id/reject", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const userId = req.params.id as string;
      const { notes } = req.body;
      
      if (!notes) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.approvalStatus !== "pending") {
        return res.status(400).json({ error: "User is not pending approval" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        approvalStatus: "rejected",
        approvalNotes: notes,
        approvedBy: req.session.user!.id,
        approvedAt: new Date(),
        isActive: false // Deactivate rejected accounts
      });
      
      res.json({ success: true, message: "Registration rejected", user: updatedUser });
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ error: "Failed to reject registration" });
    }
  });

  // ==================== BASELINE DATA ROUTES ====================

  // Get all baseline data (public for stats display, filtered for specific categories)
  app.get("/api/baseline-data", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const data = await storage.getBaselineData(category);
      res.json(data);
    } catch (error) {
      console.error("Error fetching baseline data:", error);
      res.status(500).json({ error: "Failed to fetch baseline data" });
    }
  });

  // Get a specific baseline data entry
  app.get("/api/baseline-data/:id", async (req, res) => {
    try {
      const data = await storage.getBaselineDataById(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Baseline data not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error fetching baseline data:", error);
      res.status(500).json({ error: "Failed to fetch baseline data" });
    }
  });

  // Baseline data validation schema using drizzle-zod with extended parsing
  const baselineDataCreateSchema = insertBaselineDataSchema
    .omit({ updatedBy: true })
    .extend({
      value: z.preprocess(
        (val) => typeof val === 'string' ? parseFloat(val) : val,
        z.number({ invalid_type_error: "Value must be a valid number" })
      ),
      year: z.preprocess(
        (val) => {
          if (val === null || val === undefined || val === '') return null;
          return typeof val === 'string' ? parseInt(val) : val;
        },
        z.number().nullable().optional()
      ),
    });

  // Create baseline data entry (admin only)
  app.post("/api/baseline-data", requireRole("admin"), async (req, res) => {
    try {
      const parseResult = baselineDataCreateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }
      const validated = parseResult.data;
      const data = await storage.createBaselineData({
        category: validated.category,
        key: validated.key,
        value: validated.value,
        label: validated.label || null,
        description: validated.description || null,
        year: validated.year || null,
        source: validated.source || null,
        updatedBy: req.session.user!.id
      });
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating baseline data:", error);
      res.status(500).json({ error: "Failed to create baseline data" });
    }
  });

  // Update baseline data entry (admin only)
  app.put("/api/baseline-data/:id", requireRole("admin"), async (req, res) => {
    try {
      const parseResult = baselineDataCreateSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }
      const validated = parseResult.data;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await storage.updateBaselineData(id, {
        ...(validated.category && { category: validated.category }),
        ...(validated.key && { key: validated.key }),
        ...(validated.value !== undefined && { value: validated.value }),
        ...(validated.label !== undefined && { label: validated.label }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.year !== undefined && { year: validated.year }),
        ...(validated.source !== undefined && { source: validated.source }),
        updatedBy: req.session.user!.id
      });
      if (!data) {
        return res.status(404).json({ error: "Baseline data not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error updating baseline data:", error);
      res.status(500).json({ error: "Failed to update baseline data" });
    }
  });

  // Delete baseline data entry (admin only)
  app.delete("/api/baseline-data/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const success = await storage.deleteBaselineData(id);
      if (!success) {
        return res.status(404).json({ error: "Baseline data not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting baseline data:", error);
      res.status(500).json({ error: "Failed to delete baseline data" });
    }
  });

  // ==================== TRAINING VIDEO ROUTES ====================

  // Get all video scripts
  app.get("/api/training/scripts", async (req, res) => {
    try {
      const audienceParam = req.query.audience;
      const audience = Array.isArray(audienceParam) ? audienceParam[0] : audienceParam;
      let scripts = videoScripts;
      if (audience && typeof audience === 'string') {
        scripts = scripts.filter(s => s.targetAudience === audience);
      }
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  // Get a specific script
  app.get("/api/training/scripts/:id", async (req, res) => {
    try {
      const script = videoScripts.find(s => s.id === req.params.id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      console.error("Error fetching script:", error);
      res.status(500).json({ error: "Failed to fetch script" });
    }
  });

  // Get training videos
  app.get("/api/training/videos", async (req, res) => {
    try {
      const audience = req.query.audience as string | undefined;
      const status = req.query.status as string | undefined;
      const videos = await storage.getTrainingVideos({ targetAudience: audience, status });
      res.json(videos);
    } catch (error) {
      console.error("Error fetching training videos:", error);
      res.status(500).json({ error: "Failed to fetch training videos" });
    }
  });

  // Get videos for current user's role
  app.get("/api/training/my-videos", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      const roleAudience = user.role === "admin" ? "admin" : 
                           user.role === "ministry" ? "ministry" :
                           user.role === "employer" ? "employer" :
                           user.role === "enumerator" ? "enumerator" : "individual";
      
      const [roleVideos, publicVideos] = await Promise.all([
        storage.getTrainingVideos({ targetAudience: roleAudience, status: "completed" }),
        storage.getTrainingVideos({ targetAudience: "public", status: "completed" })
      ]);
      
      res.json({ roleVideos, publicVideos });
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Check HeyGen API status
  app.get("/api/training/heygen/status", requireRole("admin"), async (_req, res) => {
    try {
      const configured = heygenService.isConfigured();
      res.json({ configured });
    } catch (error) {
      console.error("Error checking HeyGen status:", error);
      res.status(500).json({ error: "Failed to check HeyGen status" });
    }
  });

  // List available avatars
  app.get("/api/training/heygen/avatars", requireRole("admin"), async (_req, res) => {
    try {
      const avatars = await heygenService.listAvatars();
      res.json(avatars);
    } catch (error) {
      console.error("Error listing avatars:", error);
      res.status(500).json({ error: "Failed to list avatars" });
    }
  });

  // List available voices
  app.get("/api/training/heygen/voices", requireRole("admin"), async (_req, res) => {
    try {
      const voices = await heygenService.listVoices();
      res.json(voices);
    } catch (error) {
      console.error("Error listing voices:", error);
      res.status(500).json({ error: "Failed to list voices" });
    }
  });

  // Generate a video from a script
  app.post("/api/training/generate", requireRole("admin"), async (req, res) => {
    try {
      const { scriptId, avatarId, voiceId, test, backgroundMusic, avatarType } = req.body;
      
      if (!scriptId || !avatarId || !voiceId) {
        return res.status(400).json({ error: "scriptId, avatarId, and voiceId are required" });
      }

      const script = videoScripts.find(s => s.id === scriptId);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }

      // Check if video already exists for this script
      const existing = await storage.getTrainingVideoByScriptId(scriptId);
      if (existing && existing.status === "completed") {
        return res.status(400).json({ error: "Video already exists for this script" });
      }

      // Check if this is a talking photo avatar (custom avatar from photo)
      const customAvatars = await storage.getCustomAvatars();
      const customAvatar = customAvatars.find(a => a.heygenAvatarId === avatarId);
      const isTalkingPhoto = !!customAvatar;

      // Create video with HeyGen (includes multi-scene backgrounds and optional music)
      const videoId = await heygenService.createVideo(script.id, avatarId, voiceId, { 
        test, 
        isTalkingPhoto,
        backgroundMusic: backgroundMusic || 'corporate',
        avatarType: avatarType || 'regular',
      });

      let courseId = req.body.courseId || null;
      if (!courseId && (script as any).courseSlug) {
        const allCourses = await storage.getCourses();
        const matchedCourse = allCourses.find(c => 
          c.title.toLowerCase().includes((script as any).courseSlug.split('-')[0])
        );
        if (matchedCourse) courseId = matchedCourse.id;
      }

      if (existing) {
        await storage.updateTrainingVideo(existing.id, {
          heygenVideoId: videoId,
          status: "processing",
          errorMessage: null,
          ...(courseId ? { courseId } : {})
        });
      } else {
        await storage.createTrainingVideo({
          scriptId: script.id,
          title: script.title,
          description: script.description,
          targetAudience: script.targetAudience,
          courseId,
          heygenVideoId: videoId,
          status: "processing",
          duration: script.duration
        });
      }

      res.json({ success: true, videoId, message: "Video generation started" });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate video" });
    }
  });

  // Check video status and update
  app.post("/api/training/check-status/:id", requireRole("admin"), async (req, res) => {
    try {
      const videoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const video = await storage.getTrainingVideoById(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      if (!video.heygenVideoId) {
        return res.status(400).json({ error: "No HeyGen video ID" });
      }

      const status = await heygenService.getVideoStatus(video.heygenVideoId);
      
      const updates: any = { status: status.status };
      if (status.video_url) updates.videoUrl = status.video_url;
      if (status.thumbnail_url) updates.thumbnailUrl = status.thumbnail_url;
      if (status.error) updates.errorMessage = status.error.message;

      const updated = await storage.updateTrainingVideo(video.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error checking video status:", error);
      res.status(500).json({ error: "Failed to check video status" });
    }
  });

  // Get video generation status for all pending videos
  app.get("/api/training/pending", requireRole("admin"), async (_req, res) => {
    try {
      const pending = await storage.getTrainingVideos({ status: "processing" });
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending videos:", error);
      res.status(500).json({ error: "Failed to fetch pending videos" });
    }
  });

  // ==================== CUSTOM AVATAR ROUTES ====================

  // Get all custom avatars
  app.get("/api/training/custom-avatars", requireRole("admin"), async (_req, res) => {
    try {
      const avatars = await storage.getCustomAvatars();
      res.json(avatars);
    } catch (error) {
      console.error("Error fetching custom avatars:", error);
      res.status(500).json({ error: "Failed to fetch custom avatars" });
    }
  });

  // Serve uploaded photos
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadDir));

  // Upload a photo for avatar creation
  app.post("/api/training/upload-photo", requireRole("admin"), uploadPhoto.single("photo"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo file uploaded" });
      }

      // Get the host from the request to build the full URL
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.json({ 
        success: true, 
        url: photoUrl,
        filename: req.file.filename 
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload photo" });
    }
  });

  // Create a talking photo avatar from uploaded photo URL
  app.post("/api/training/custom-avatars/from-photo", requireRole("admin"), async (req, res) => {
    try {
      const { name, photoUrl, gender } = req.body;
      
      if (!name || !photoUrl) {
        return res.status(400).json({ error: "Name and photo URL are required" });
      }

      // Create database record first
      const avatar = await storage.createCustomAvatar({
        name,
        photoUrl,
        gender: gender || "unknown",
        ethnicity: "African",
        status: "processing",
        createdBy: req.session.user!.id
      });

      try {
        // Create talking photo in HeyGen
        const result = await heygenService.createTalkingPhoto(photoUrl, name);
        
        // Update with HeyGen ID
        await storage.updateCustomAvatar(avatar.id, {
          heygenAvatarId: result.talkingPhotoId,
          status: "ready",
          previewImageUrl: photoUrl
        });

        res.json({ 
          success: true, 
          avatar: { ...avatar, heygenAvatarId: result.talkingPhotoId, status: "ready" }
        });
      } catch (heygenError) {
        // Update with error
        await storage.updateCustomAvatar(avatar.id, {
          status: "failed",
          errorMessage: heygenError instanceof Error ? heygenError.message : "Failed to create talking photo"
        });
        throw heygenError;
      }
    } catch (error) {
      console.error("Error creating custom avatar:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create custom avatar" });
    }
  });

  // Generate AI avatar with specific ethnicity
  app.post("/api/training/custom-avatars/generate", requireRole("admin"), async (req, res) => {
    try {
      const { name, age, gender, ethnicity, appearance } = req.body;
      
      if (!name || !gender || !ethnicity) {
        return res.status(400).json({ error: "Name, gender, and ethnicity are required" });
      }

      // Create database record first
      const avatar = await storage.createCustomAvatar({
        name,
        gender,
        ethnicity,
        status: "generating",
        createdBy: req.session.user!.id
      });

      try {
        // Generate AI avatar photo
        const result = await heygenService.generateAIAvatarPhoto({
          name,
          age: age || "Adult",
          gender,
          ethnicity,
          appearance
        });
        
        // Update with generated avatar
        await storage.updateCustomAvatar(avatar.id, {
          heygenAvatarId: result.avatarId,
          previewImageUrl: result.imageUrl,
          photoUrl: result.imageUrl,
          status: "ready"
        });

        res.json({ 
          success: true, 
          avatar: { 
            ...avatar, 
            heygenAvatarId: result.avatarId, 
            previewImageUrl: result.imageUrl,
            status: "ready" 
          }
        });
      } catch (heygenError) {
        await storage.updateCustomAvatar(avatar.id, {
          status: "failed",
          errorMessage: heygenError instanceof Error ? heygenError.message : "Failed to generate avatar"
        });
        throw heygenError;
      }
    } catch (error) {
      console.error("Error generating AI avatar:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate AI avatar" });
    }
  });

  // Get HeyGen talking photos
  app.get("/api/training/heygen/talking-photos", requireRole("admin"), async (_req, res) => {
    try {
      const photos = await heygenService.listTalkingPhotos();
      res.json(photos);
    } catch (error) {
      console.error("Error listing talking photos:", error);
      res.status(500).json({ error: "Failed to list talking photos" });
    }
  });

  // Stream a training video from object storage
  app.get("/api/training/stream/:objectId", async (req, res) => {
    try {
      const objectId = req.params.objectId;
      if (!objectId) {
        return res.status(400).json({ error: "Object ID required" });
      }

      const objStorage = new ObjectStorageService();
      const signedUrl = await objStorage.getSignedReadURL(objectId, 3600);

      res.redirect(signedUrl);
    } catch (error) {
      console.error("Error streaming video:", error);
      if (!res.headersSent) {
        res.status(404).json({ error: "Video not found" });
      }
    }
  });

  // Delete a training video
  app.delete("/api/training/videos/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      await storage.deleteTrainingVideo(id);
      res.json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.patch("/api/training/videos/:id/visibility", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "isPublic must be a boolean" });
      }
      const updated = await storage.updateTrainingVideo(id, { isPublic });
      if (!updated) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating video visibility:", error);
      res.status(500).json({ error: "Failed to update video visibility" });
    }
  });

  // Manual video upload (for when HeyGen API is unavailable)
  app.post("/api/training/videos/upload", requireRole("admin"), async (req, res) => {
    try {
      const { scriptId, videoUrl, thumbnailUrl, title, description, targetAudience } = req.body;
      let { courseId } = req.body;
      
      if (!scriptId || !videoUrl) {
        return res.status(400).json({ error: "scriptId and videoUrl are required" });
      }

      const script = videoScripts.find(s => s.id === scriptId);

      if (!courseId && script && (script as any).courseSlug) {
        const allCourses = await storage.getCourses();
        const matchedCourse = allCourses.find(c => 
          c.title.toLowerCase().includes((script as any).courseSlug.split('-')[0])
        );
        if (matchedCourse) courseId = matchedCourse.id;
      }

      let finalVideoUrl = videoUrl;

      const existing = await storage.getTrainingVideoByScriptId(scriptId);
      if (existing) {
        const updated = await storage.updateTrainingVideo(existing.id, {
          videoUrl: finalVideoUrl,
          thumbnailUrl: thumbnailUrl || null,
          status: "completed",
          errorMessage: null,
          ...(courseId ? { courseId } : {})
        });
        return res.json(updated);
      }
      
      const video = await storage.createTrainingVideo({
        scriptId,
        title: title || script?.title || "Training Video",
        description: description || script?.description || null,
        targetAudience: targetAudience || script?.targetAudience || "public",
        courseId: courseId || null,
        heygenVideoId: null,
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailUrl || null,
        status: "completed",
        duration: null,
        errorMessage: null
      });

      res.json(video);
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // Delete a custom avatar
  app.delete("/api/training/custom-avatars/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = req.params.id as string;
      await storage.deleteCustomAvatar(id);
      res.json({ success: true, message: "Avatar deleted successfully" });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      res.status(500).json({ error: "Failed to delete avatar" });
    }
  });

  // Download blank bulk upload template
  app.get("/api/bulk-upload/template/blank", requireAuth, (_req, res) => {
    try {
      const headers = [
        "Employee First Name",
        "Employee Last Name", 
        "Job Title",
        "Sector",
        "County",
        "Start Date (YYYY-MM-DD)",
        "End Date (YYYY-MM-DD)",
        "Wage Amount",
        "Wage Period",
        "Currency",
        "Contract Type",
        "Notes"
      ];
      
      const sampleData = [
        ["John", "Smith", "Accountant", "private", "Montserrado", "2024-01-15", "", "45000", "monthly", "USD", "full_time", "Senior position"],
        ["Jane", "Doe", "Driver", "private", "Margibi", "2024-03-01", "", "1500", "daily", "LRD", "full_time", ""],
        ["", "", "", "", "", "", "", "", "", "", "", ""]
      ];
      
      const wsData = [headers, ...sampleData];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Employees");
      
      const instructions = [
        ["LiJOBS Bulk Upload Template - Instructions"],
        [""],
        ["REQUIRED FIELDS:"],
        ["- Employee First Name: First name of the employee"],
        ["- Employee Last Name: Last name of the employee"],
        ["- Job Title: Position/role (e.g., Accountant, Driver, Teacher)"],
        ["- Sector: Must be one of: private, public, ngo, informal, seasonal (use lowercase)"],
        ["- County: Full county name (e.g., Montserrado, Nimba, Grand Bassa)"],
        ["- Start Date: Format YYYY-MM-DD (e.g., 2024-01-15)"],
        [""],
        ["OPTIONAL FIELDS:"],
        ["- End Date: Leave empty for current employees"],
        ["- Wage Amount: Just the number without currency symbols"],
        ["- Wage Period: daily, weekly, or monthly (indicates how often this amount is paid)"],
        ["- Currency: LRD (Liberian Dollar), USD (US Dollar), or LRD_USD (paid in both)"],
        ["- Contract Type: full_time, part_time, contract, seasonal, informal"],
        ["- Notes: Any additional information"],
        [""],
        ["VALID SECTORS: private, public, ngo, informal, seasonal"],
        ["VALID COUNTIES: Montserrado, Margibi, Grand Bassa, Bong, Nimba, Lofa, Grand Gedeh, Grand Kru, Maryland, River Cess, Sinoe, Bomi, Grand Cape Mount, Gbarpolu, River Gee"],
        ["VALID CONTRACT TYPES: full_time, part_time, contract, seasonal, informal"],
        ["VALID WAGE PERIODS: daily, weekly, monthly"],
        ["VALID CURRENCIES: LRD, USD, LRD_USD"]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), "Instructions");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=LiJOBS_Bulk_Upload_Template.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Download pre-filled template with existing employees
  app.get("/api/bulk-upload/template/prefilled", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      
      const existingSpells = await storage.getEmploymentSpells({ reportedBy: user.id });
      
      const headers = [
        "Employee First Name",
        "Employee Last Name", 
        "Job Title",
        "Sector",
        "County",
        "Start Date (YYYY-MM-DD)",
        "End Date (YYYY-MM-DD)",
        "Wage Amount",
        "Wage Period",
        "Currency",
        "Contract Type",
        "Notes"
      ];
      
      const employeeData = existingSpells.map(spell => {
        const nameParts = (spell.employeeName || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        return [
          firstName,
          lastName,
          spell.jobTitle || "",
          spell.sector || "",
          spell.county || "",
          spell.startDate || "",
          spell.endDate || "",
          spell.monthlySalary || "",
          "monthly",
          spell.currency || "LRD",
          spell.contractType || "full_time",
          spell.notes || ""
        ];
      });
      
      if (employeeData.length === 0) {
        employeeData.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
      }
      
      const wsData = [headers, ...employeeData];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Employees");
      
      const instructions = [
        ["LiJOBS Pre-filled Template - Instructions"],
        [""],
        ["This template contains your existing employee records."],
        ["You can update information, add new employees, or mark departures."],
        [""],
        ["TO UPDATE EXISTING EMPLOYEES:"],
        ["- Modify any fields that need updating"],
        ["- Change end dates for employees who have left"],
        [""],
        ["TO ADD NEW EMPLOYEES:"],
        ["- Add new rows at the bottom with complete information"],
        [""],
        ["REQUIRED FIELDS:"],
        ["- Employee First Name, Last Name, Job Title, Sector, County, Start Date"],
        [""],
        ["VALID SECTORS: private, public, ngo, informal, seasonal"],
        ["VALID CONTRACT TYPES: full_time, part_time, contract, seasonal, informal"]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), "Instructions");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=LiJOBS_Existing_Employees_Template.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Error generating pre-filled template:", error);
      res.status(500).json({ error: "Failed to generate pre-filled template" });
    }
  });

  // Process bulk upload
  app.post("/api/bulk-upload", requireAuth, uploadExcel.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const user = req.session.user!;
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        return res.status(400).json({ error: "File must contain at least a header row and one data row" });
      }

      const headerRow = data[0].map((h: any) => String(h || "").toLowerCase().trim());
      const dataRows = data.slice(1).filter((row: any[]) => row.some((cell: any) => cell !== undefined && cell !== ""));

      const validSectors = ["private", "public", "ngo", "informal", "seasonal"];
      const validCounties = ["Montserrado", "Margibi", "Grand Bassa", "Bong", "Nimba", "Lofa", "Grand Gedeh", "Grand Kru", "Maryland", "River Cess", "Sinoe", "Bomi", "Grand Cape Mount", "Gbarpolu", "River Gee"];
      const validContractTypes = ["full_time", "part_time", "contract", "seasonal", "informal"];
      const validWagePeriods = ["daily", "weekly", "monthly"];
      const validCurrencies = ["lrd", "usd", "lrd_usd"];

      const results: { row: number; status: "valid" | "error"; errors: string[]; data?: any }[] = [];
      const validRecords: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;
        const errors: string[] = [];
        
        const getValue = (index: number): string => String(row[index] || "").trim();
        
        const firstName = getValue(0);
        const lastName = getValue(1);
        const jobTitle = getValue(2);
        const sector = getValue(3).toLowerCase();
        const county = getValue(4);
        const startDate = getValue(5);
        const endDate = getValue(6);
        const wageAmount = getValue(7);
        const wagePeriod = getValue(8).toLowerCase() || "monthly";
        const currency = getValue(9).toUpperCase() || "LRD";
        const contractType = getValue(10).toLowerCase() || "full_time";
        const notes = getValue(11);

        if (!firstName) errors.push("First Name is required");
        if (!lastName) errors.push("Last Name is required");
        if (!jobTitle) errors.push("Job Title is required");
        if (!sector) errors.push("Sector is required");
        else if (!validSectors.includes(sector)) errors.push(`Invalid sector: ${sector}. Must be one of: ${validSectors.join(", ")}`);
        if (!county) errors.push("County is required");
        else if (!validCounties.map(c => c.toLowerCase()).includes(county.toLowerCase())) errors.push(`Invalid county: ${county}`);
        if (!startDate) errors.push("Start Date is required");
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.push("Start Date must be in YYYY-MM-DD format");
        if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) errors.push("End Date must be in YYYY-MM-DD format");
        if (wagePeriod && !validWagePeriods.includes(wagePeriod)) errors.push(`Invalid wage period: ${wagePeriod}. Must be: daily, weekly, or monthly`);
        if (currency && !validCurrencies.includes(currency.toLowerCase())) errors.push(`Invalid currency: ${currency}. Must be: LRD, USD, or LRD_USD`);
        if (contractType && !validContractTypes.includes(contractType)) errors.push(`Invalid contract type: ${contractType}`);

        if (errors.length > 0) {
          results.push({ row: rowNum, status: "error", errors });
        } else {
          const matchedCounty = validCounties.find(c => c.toLowerCase() === county.toLowerCase()) || county;
          
          let monthlySalary: number | null = null;
          if (wageAmount) {
            const amount = parseFloat(wageAmount);
            if (wagePeriod === "daily") {
              monthlySalary = amount * 22;
            } else if (wagePeriod === "weekly") {
              monthlySalary = amount * 4;
            } else {
              monthlySalary = amount;
            }
          }
          
          const record = {
            employeeName: `${firstName} ${lastName}`,
            jobTitle,
            sector: sector as any,
            county: matchedCounty,
            startDate,
            endDate: endDate || null,
            monthlySalary,
            wageAmount: wageAmount ? parseFloat(wageAmount) : null,
            wagePeriod,
            currency: currency as "LRD" | "USD" | "LRD_USD",
            contractType: contractType as any,
            notes: notes || null,
            employerName: user.organizationName || user.firstName + " " + user.lastName,
            employerType: user.organizationType || "private_company",
            reportedBy: user.email
          };
          results.push({ row: rowNum, status: "valid", errors: [], data: record });
          validRecords.push(record);
        }
      }

      const validCount = results.filter(r => r.status === "valid").length;
      const errorCount = results.filter(r => r.status === "error").length;

      res.json({
        success: true,
        summary: {
          totalRows: dataRows.length,
          validRows: validCount,
          errorRows: errorCount
        },
        results,
        validRecords: validRecords.length > 0 ? validRecords : undefined
      });
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process file" });
    }
  });

  // Submit validated bulk upload records
  app.post("/api/bulk-upload/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.session.user!;
      const { records } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "No records to submit" });
      }

      const submittedSpells: any[] = [];

      for (const record of records) {
        const spell = await storage.createEmploymentSpell({
          employerName: record.employerName,
          employerType: record.employerType,
          sector: record.sector,
          county: record.county,
          jobTitle: record.jobTitle,
          employeeName: record.employeeName,
          contractType: record.contractType,
          startDate: record.startDate,
          endDate: record.endDate,
          monthlySalary: record.monthlySalary,
          currency: record.currency,
          notes: record.notes,
          reportedBy: user.email
        });
        submittedSpells.push(spell);
      }

      res.json({
        success: true,
        message: `Successfully submitted ${submittedSpells.length} employment records`,
        count: submittedSpells.length
      });
    } catch (error) {
      console.error("Error submitting bulk records:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to submit records" });
    }
  });

  // =============================================
  // REFERENCE DATA ENDPOINTS (ISCO-08, ISIC Rev.4)
  // =============================================

  // Get ISCO-08 occupation codes
  app.get("/api/reference/isco", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const occupations = await storage.getIscoOccupations(search);
      res.json(occupations);
    } catch (error) {
      console.error("Error fetching ISCO codes:", error);
      res.status(500).json({ error: "Failed to fetch occupation codes" });
    }
  });

  // Get ISIC Rev.4 industry codes
  app.get("/api/reference/isic", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const industries = await storage.getIsicIndustries(search);
      res.json(industries);
    } catch (error) {
      console.error("Error fetching ISIC codes:", error);
      res.status(500).json({ error: "Failed to fetch industry codes" });
    }
  });

  // Get districts (optionally filtered by county)
  app.get("/api/reference/districts", async (req, res) => {
    try {
      const county = req.query.county as string | undefined;
      const districtsList = await storage.getDistricts(county);
      res.json(districtsList);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });

  // =============================================
  // JOBS OBSERVATORY ENDPOINTS (The Differentiator!)
  // =============================================

  // Get observatory statistics
  app.get("/api/observatory/stats", async (_req, res) => {
    try {
      const stats = await storage.getObservatoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching observatory stats:", error);
      res.status(500).json({ error: "Failed to fetch observatory statistics" });
    }
  });

  // Create job creation event (for tracking source and evidence)
  app.post("/api/observatory/job-creation-events", requireAuth, async (req, res) => {
    try {
      const validationResult = insertJobCreationEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const event = await storage.createJobCreationEvent(validationResult.data);
      
      // Log the audit event
      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "job_creation_event",
        entityId: event.id,
        newValues: event,
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating job creation event:", error);
      res.status(500).json({ error: "Failed to create job creation event" });
    }
  });

  // Get job creation events for a spell
  app.get("/api/observatory/job-creation-events", requireAuth, async (req, res) => {
    try {
      const spellId = req.query.spellId as string | undefined;
      const events = await storage.getJobCreationEvents(spellId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching job creation events:", error);
      res.status(500).json({ error: "Failed to fetch job creation events" });
    }
  });

  // Verify employment spell (update verification status and trust score)
  app.patch("/api/observatory/spells/:id/verify", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const id = req.params.id as string;
      
      // Validate request body
      const validationResult = verifySpellSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { verificationStatus, trustScore, notes } = validationResult.data;
      
      const oldSpell = await storage.getEmploymentSpellById(id);
      if (!oldSpell) {
        return res.status(404).json({ error: "Employment spell not found" });
      }

      const updates: any = {
        verificationStatus,
        verifiedBy: req.session.user!.id,
        verifiedAt: new Date(),
      };
      
      if (trustScore !== undefined) {
        updates.trustScore = trustScore;
      }
      
      const updatedSpell = await storage.updateEmploymentSpell(id, updates);
      
      // Log audit event
      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "VERIFY",
        entityType: "employment_spell",
        entityId: id,
        oldValues: { verificationStatus: oldSpell.verificationStatus },
        newValues: { verificationStatus, trustScore },
        details: { notes },
      });
      
      res.json(updatedSpell);
    } catch (error) {
      console.error("Error verifying employment spell:", error);
      res.status(500).json({ error: "Failed to verify employment spell" });
    }
  });

  // =============================================
  // EMPLOYERS ENDPOINTS
  // =============================================

  // Get all employers
  app.get("/api/employers", async (_req, res) => {
    try {
      const employersList = await storage.getEmployers();
      res.json(employersList);
    } catch (error) {
      console.error("Error fetching employers:", error);
      res.status(500).json({ error: "Failed to fetch employers" });
    }
  });

  // Get current user's employer profile
  app.get("/api/employers/me", requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      if (!user || user.role !== "employer") {
        return res.status(403).json({ error: "Only employers can access this endpoint" });
      }
      
      const allEmployers = await storage.getEmployers();
      let myEmployer = allEmployers.find(e => e.userId === user.id);
      
      if (!myEmployer) {
        myEmployer = await storage.createEmployer({
          userId: user.id,
          legalName: user.organizationName || `${user.firstName} ${user.lastName}`,
          tradingName: user.organizationName || null,
          sector: user.sector || "private",
          isPublicSector: user.sector === "public",
          contactEmail: user.email,
          contactPhone: user.phone || "",
        });
      }
      
      res.json(myEmployer);
    } catch (error) {
      console.error("Error fetching employer profile:", error);
      res.status(500).json({ error: "Failed to fetch employer profile" });
    }
  });

  // Get employer by ID
  app.get("/api/employers/:id", async (req, res) => {
    try {
      const employer = await storage.getEmployerById(req.params.id);
      if (!employer) {
        return res.status(404).json({ error: "Employer not found" });
      }
      res.json(employer);
    } catch (error) {
      console.error("Error fetching employer:", error);
      res.status(500).json({ error: "Failed to fetch employer" });
    }
  });

  // Create employer
  app.post("/api/employers", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validationResult = createEmployerValidation.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const employer = await storage.createEmployer(validationResult.data);
      
      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "employer",
        entityId: employer.id,
        newValues: employer,
      });
      
      res.status(201).json(employer);
    } catch (error) {
      console.error("Error creating employer:", error);
      res.status(500).json({ error: "Failed to create employer" });
    }
  });

  // =============================================
  // VACANCIES ENDPOINTS (Labour Exchange)
  // =============================================

  // Get vacancies
  app.get("/api/vacancies", async (req, res) => {
    try {
      const filters = {
        employerId: req.query.employerId as string | undefined,
        county: req.query.county as string | undefined,
        status: req.query.status as string | undefined,
      };
      const vacanciesList = await storage.getVacancies(filters);
      res.json(vacanciesList);
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      res.status(500).json({ error: "Failed to fetch vacancies" });
    }
  });

  // Get vacancy by ID
  app.get("/api/vacancies/:id", async (req, res) => {
    try {
      const vacancy = await storage.getVacancyById(req.params.id);
      if (!vacancy) {
        return res.status(404).json({ error: "Vacancy not found" });
      }
      res.json(vacancy);
    } catch (error) {
      console.error("Error fetching vacancy:", error);
      res.status(500).json({ error: "Failed to fetch vacancy" });
    }
  });

  // Create vacancy
  app.post("/api/vacancies", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertVacancySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const vacancy = await storage.createVacancy(validationResult.data);
      
      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "vacancy",
        entityId: vacancy.id,
        newValues: vacancy,
      });
      
      res.status(201).json(vacancy);
    } catch (error) {
      console.error("Error creating vacancy:", error);
      res.status(500).json({ error: "Failed to create vacancy" });
    }
  });

  // Update vacancy
  app.patch("/api/vacancies/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const vacancy = await storage.updateVacancy(id, req.body);
      if (!vacancy) {
        return res.status(404).json({ error: "Vacancy not found" });
      }
      res.json(vacancy);
    } catch (error) {
      console.error("Error updating vacancy:", error);
      res.status(500).json({ error: "Failed to update vacancy" });
    }
  });

  // =============================================
  // AUDIT LOG ENDPOINTS
  // =============================================

  // Get audit logs (admin only)
  app.get("/api/audit-logs", requireRole("admin"), async (req, res) => {
    try {
      const filters = {
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        actorUserId: req.query.actorUserId as string | undefined,
      };
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // =============================================
  // LABOUR EXCHANGE - JOB SEEKERS
  // =============================================

  // Get current user's job seeker profile
  app.get("/api/job-seekers/me", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonByUserId(req.session.user!.id);
      if (!person) {
        return res.status(404).json({ error: "No job seeker profile found" });
      }
      const profile = await storage.getJobSeekerProfile(person.id);
      const skills = await storage.getPersonSkills(person.id);
      res.json({ person, profile, skills });
    } catch (error) {
      console.error("Error fetching job seeker profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Register as job seeker (create person and profile)
  app.post("/api/job-seekers/register", requireAuth, async (req, res) => {
    try {
      // Validate person data
      const personValidation = insertPersonSchema.safeParse(req.body.person);
      if (!personValidation.success) {
        return res.status(400).json({ error: "Invalid person data", details: personValidation.error.errors });
      }

      // Check if already registered
      const existingPerson = await storage.getPersonByUserId(req.session.user!.id);
      if (existingPerson) {
        return res.status(400).json({ error: "Already registered as job seeker" });
      }

      // Create person
      const person = await storage.createPerson({
        ...personValidation.data,
        userId: req.session.user!.id,
      });

      // Create job seeker profile if provided
      let profile = null;
      if (req.body.profile) {
        const profileValidation = insertJobSeekerProfileSchema.safeParse({
          ...req.body.profile,
          personId: person.id,
        });
        if (profileValidation.success) {
          profile = await storage.createJobSeekerProfile(profileValidation.data);
        }
      }

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "job_seeker",
        entityId: person.id,
        newValues: { person, profile },
      });

      res.status(201).json({ person, profile });
    } catch (error) {
      console.error("Error registering job seeker:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Update job seeker profile
  app.patch("/api/job-seekers/me", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonByUserId(req.session.user!.id);
      if (!person) {
        return res.status(404).json({ error: "No job seeker profile found" });
      }

      // Validate and update person if data provided
      if (req.body.person) {
        const personValidation = updatePersonSchema.safeParse(req.body.person);
        if (!personValidation.success) {
          return res.status(400).json({ error: "Invalid person data", details: personValidation.error.errors });
        }
        await storage.updatePerson(person.id, personValidation.data);
      }

      // Validate and update profile if data provided
      if (req.body.profile) {
        const profileValidation = updateJobSeekerProfileSchema.safeParse(req.body.profile);
        if (!profileValidation.success) {
          return res.status(400).json({ error: "Invalid profile data", details: profileValidation.error.errors });
        }
        let profile = await storage.getJobSeekerProfile(person.id);
        if (profile) {
          await storage.updateJobSeekerProfile(person.id, profileValidation.data);
        } else {
          await storage.createJobSeekerProfile({ ...profileValidation.data, personId: person.id });
        }
      }

      const updatedPerson = await storage.getPersonById(person.id);
      const updatedProfile = await storage.getJobSeekerProfile(person.id);
      res.json({ person: updatedPerson, profile: updatedProfile });
    } catch (error) {
      console.error("Error updating job seeker profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // List job seekers (for employers)
  app.get("/api/job-seekers", requireAuth, async (req, res) => {
    try {
      const filters = {
        county: req.query.county as string | undefined,
        isOpenToWork: req.query.isOpenToWork === "true" ? true : undefined,
      };
      const jobSeekers = await storage.getJobSeekers(filters);
      res.json(jobSeekers);
    } catch (error) {
      console.error("Error fetching job seekers:", error);
      res.status(500).json({ error: "Failed to fetch job seekers" });
    }
  });

  // =============================================
  // LABOUR EXCHANGE - SKILLS
  // =============================================

  // Get all skills
  app.get("/api/skills", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const skills = await storage.getSkills(category);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  // Add skill to current user
  app.post("/api/job-seekers/me/skills", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonByUserId(req.session.user!.id);
      if (!person) {
        return res.status(404).json({ error: "No job seeker profile found" });
      }

      const validation = insertPersonSkillSchema.safeParse({
        ...req.body,
        personId: person.id,
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid skill data", details: validation.error.errors });
      }

      const personSkill = await storage.addPersonSkill(validation.data);
      res.status(201).json(personSkill);
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ error: "Failed to add skill" });
    }
  });

  // Remove skill from current user
  app.delete("/api/job-seekers/me/skills/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const deleted = await storage.removePersonSkill(id);
      if (!deleted) {
        return res.status(404).json({ error: "Skill not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing skill:", error);
      res.status(500).json({ error: "Failed to remove skill" });
    }
  });

  // =============================================
  // LABOUR EXCHANGE - APPLICATIONS
  // =============================================

  // Apply for a vacancy
  app.post("/api/applications", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonByUserId(req.session.user!.id);
      if (!person) {
        return res.status(400).json({ error: "Must register as job seeker first" });
      }

      const validation = insertApplicationSchema.safeParse({
        ...req.body,
        personId: person.id,
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid application data", details: validation.error.errors });
      }

      // Verify vacancy exists and is open
      const vacancy = await storage.getVacancyById(validation.data.vacancyId);
      if (!vacancy) {
        return res.status(404).json({ error: "Vacancy not found" });
      }
      if (vacancy.status !== "open") {
        return res.status(400).json({ error: "This vacancy is no longer accepting applications" });
      }

      // Check if already applied
      const existingApps = await storage.getApplicationsByPerson(person.id);
      if (existingApps.some(a => a.vacancyId === validation.data.vacancyId)) {
        return res.status(400).json({ error: "Already applied to this vacancy" });
      }

      const application = await storage.createApplication(validation.data);

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "application",
        entityId: application.id,
        newValues: application,
      });

      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Get my applications
  app.get("/api/applications/me", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonByUserId(req.session.user!.id);
      if (!person) {
        return res.json([]);
      }
      const applications = await storage.getApplicationsByPerson(person.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get applications for a vacancy (employers who own the vacancy, admins, or ministry)
  app.get("/api/vacancies/:id/applications", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;
      const vacancyId = req.params.id as string;
      
      // Only admin, ministry, and employer roles can access applications
      const allowedRoles = ["admin", "ministry", "employer", "private", "public", "ngo"];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Not authorized to view applications" });
      }
      
      // Verify vacancy exists
      const vacancy = await storage.getVacancyById(vacancyId);
      if (!vacancy) {
        return res.status(404).json({ error: "Vacancy not found" });
      }

      // Admin and ministry can see all applications; employers can only see their own vacancies
      if (!["admin", "ministry"].includes(userRole)) {
        // For employer roles, verify they own the vacancy through employer relationship
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        
        if (!userEmployer || userEmployer.id !== vacancy.employerId) {
          return res.status(403).json({ error: "Not authorized to view applications for this vacancy" });
        }
      }

      const applications = await storage.getApplicationsByVacancy(vacancyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Update application status (employers who own the vacancy, or admins)
  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;
      
      // Only admin and employer roles can update applications
      const allowedRoles = ["admin", "employer", "private", "public", "ngo"];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Not authorized to update applications" });
      }

      // Validate request body
      const validation = updateApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid update data", details: validation.error.errors });
      }

      // Get the application first
      const existingApp = await storage.getApplicationById(req.params.id as string);
      if (!existingApp) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify vacancy ownership for non-admins
      if (userRole !== "admin") {
        // Get the vacancy to check ownership
        const vacancy = await storage.getVacancyById(existingApp.vacancyId);
        if (!vacancy) {
          return res.status(404).json({ error: "Vacancy not found" });
        }

        // Verify the user owns the employer that posted this vacancy
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        
        if (!userEmployer || userEmployer.id !== vacancy.employerId) {
          return res.status(403).json({ error: "Not authorized to update this application" });
        }
      }

      const application = await storage.updateApplication(req.params.id as string, {
        ...validation.data,
        reviewedAt: new Date(),
        reviewedBy: req.session.user!.id,
      });
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "UPDATE",
        entityType: "application",
        entityId: application.id,
        newValues: req.body,
      });

      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Training Provider endpoints
  app.get("/api/training-providers", async (_req, res) => {
    try {
      const providers = await storage.getTrainingProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching training providers:", error);
      res.status(500).json({ error: "Failed to fetch training providers" });
    }
  });

  app.get("/api/training-providers/:id", async (req, res) => {
    try {
      const provider = await storage.getTrainingProviderById(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching training provider:", error);
      res.status(500).json({ error: "Failed to fetch training provider" });
    }
  });

  app.post("/api/training-providers", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const provider = await storage.createTrainingProvider(req.body);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating training provider:", error);
      res.status(500).json({ error: "Failed to create training provider" });
    }
  });

  app.patch("/api/training-providers/:id", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const provider = await storage.updateTrainingProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating training provider:", error);
      res.status(500).json({ error: "Failed to update training provider" });
    }
  });

  app.delete("/api/training-providers/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteTrainingProvider(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting training provider:", error);
      res.status(500).json({ error: "Failed to delete training provider" });
    }
  });

  // Courses endpoints
  app.get("/api/courses", async (req, res) => {
    try {
      const providerId = req.query.providerId as string | undefined;
      const courses = await storage.getCourses(providerId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const allCourses = await storage.getCourses();
      const withProvider = allCourses.find(c => c.id === course.id);
      const lessons = await storage.getCourseLessons(course.id);
      const questions = await storage.getCourseQuizQuestions(course.id);
      res.json({
        ...course,
        providerName: withProvider?.providerName,
        lessons,
        quizQuestionCount: questions.length,
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.get("/api/courses/:id/videos", async (req, res) => {
    try {
      const videos = await storage.getTrainingVideosByCourseId(req.params.id);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching course videos:", error);
      res.status(500).json({ error: "Failed to fetch course videos" });
    }
  });

  app.get("/api/courses/:id/quiz", async (req, res) => {
    try {
      const questions = await storage.getCourseQuizQuestions(req.params.id);
      const safeQuestions = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        orderIndex: q.orderIndex,
      }));
      res.json(safeQuestions);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/courses/:id/enroll", async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      const course = await storage.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const existing = await storage.getEnrollmentByCourseAndEmail(req.params.id, email);
      if (existing) {
        return res.json(existing);
      }
      const userId = req.user?.id || null;
      const enrollment = await storage.createEnrollment({
        courseId: req.params.id,
        enrolleeName: name,
        enrolleeEmail: email,
        userId,
        status: "enrolled",
        completedAt: null,
      });
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling:", error);
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  app.get("/api/enrollments/:id", async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      const attempts = await storage.getQuizAttempts(enrollment.id);
      const certificate = await storage.getCertificate(enrollment.id);
      res.json({ ...enrollment, attempts, certificate });
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });

  app.post("/api/enrollments/:id/quiz", async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      const questions = await storage.getCourseQuizQuestions(enrollment.courseId);
      if (questions.length === 0) {
        return res.status(400).json({ error: "No quiz available for this course" });
      }
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Answers array is required" });
      }
      let correctCount = 0;
      const graded = questions.map((q, i) => {
        const userAnswer = answers[i] ?? -1;
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          userAnswer,
          correctIndex: q.correctIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= 70;
      const attempt = await storage.createQuizAttempt({
        enrollmentId: enrollment.id,
        answers: graded,
        score,
        totalQuestions: questions.length,
        passed,
      });
      let certificate = null;
      if (passed) {
        await storage.updateEnrollment(enrollment.id, {
          status: "completed",
          completedAt: new Date(),
        });
        const existingCert = await storage.getCertificate(enrollment.id);
        if (!existingCert) {
          const course = await storage.getCourseById(enrollment.courseId);
          const allCourses = await storage.getCourses();
          const withProvider = allCourses.find(c => c.id === enrollment.courseId);
          const year = new Date().getFullYear();
          const random = Math.random().toString(36).substring(2, 8).toUpperCase();
          const certNumber = `LIB-${year}-${random}`;
          certificate = await storage.createCertificate({
            enrollmentId: enrollment.id,
            courseId: enrollment.courseId,
            certificateNumber: certNumber,
            recipientName: enrollment.enrolleeName,
            courseName: course?.title || "Unknown Course",
            providerName: withProvider?.providerName || null,
            score,
          });
        } else {
          certificate = existingCert;
        }
      }
      res.json({ attempt, certificate, score, passed, graded });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  app.get("/api/certificates/:number", async (req, res) => {
    try {
      const certificate = await storage.getCertificateByNumber(req.params.number);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/courses", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const course = await storage.updateCourse(req.params.id, req.body);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteCourse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Public Employment Centres (PEC) endpoints
  app.get("/api/pecs", async (_req, res) => {
    try {
      const pecs = await storage.getPECs();
      res.json(pecs);
    } catch (error) {
      console.error("Error fetching PECs:", error);
      res.status(500).json({ error: "Failed to fetch employment centres" });
    }
  });

  app.get("/api/pecs/:id", async (req, res) => {
    try {
      const pec = await storage.getPECById(req.params.id);
      if (!pec) {
        return res.status(404).json({ error: "Employment centre not found" });
      }
      res.json(pec);
    } catch (error) {
      console.error("Error fetching PEC:", error);
      res.status(500).json({ error: "Failed to fetch employment centre" });
    }
  });

  app.post("/api/pecs", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const pec = await storage.createPEC(req.body);
      res.status(201).json(pec);
    } catch (error) {
      console.error("Error creating PEC:", error);
      res.status(500).json({ error: "Failed to create employment centre" });
    }
  });

  app.patch("/api/pecs/:id", requireRole("admin", "ministry"), async (req, res) => {
    try {
      const pec = await storage.updatePEC(req.params.id, req.body);
      if (!pec) {
        return res.status(404).json({ error: "Employment centre not found" });
      }
      res.json(pec);
    } catch (error) {
      console.error("Error updating PEC:", error);
      res.status(500).json({ error: "Failed to update employment centre" });
    }
  });

  app.delete("/api/pecs/:id", requireRole("admin"), async (req, res) => {
    try {
      const deleted = await storage.deletePEC(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Employment centre not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting PEC:", error);
      res.status(500).json({ error: "Failed to delete employment centre" });
    }
  });

  // Bulk Upload endpoints
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

  app.post("/api/bulk-upload/employment-spells", requireRole("admin", "ministry", "employer", "enumerator"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      let imported = 0;
      let errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          await storage.createEmploymentSpell({
            personId: row.personId || row.person_id,
            employerId: row.employerId || row.employer_id,
            startDate: row.startDate || row.start_date,
            endDate: row.endDate || row.end_date || null,
            contractType: row.contractType || row.contract_type || "permanent",
            sector: row.sector || "private",
            county: row.county || "Montserrado",
            iscoCode: row.iscoCode || row.isco_code || null,
            isicCode: row.isicCode || row.isic_code || null,
            jobTitle: row.jobTitle || row.job_title || null,
            monthlySalary: row.monthlySalary || row.monthly_salary || null,
            salaryCurrency: row.salaryCurrency || row.salary_currency || "LRD",
            hoursPerWeek: row.hoursPerWeek || row.hours_per_week || null,
            isFormal: row.isFormal ?? row.is_formal ?? true,
            verificationStatus: "self_reported",
            trustScore: "0.2",
            sourceId: "bulk_upload",
          });
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }

      res.json({
        success: true,
        imported,
        errors: errors.length > 0 ? errors.slice(0, 10) : [],
        totalRows: data.length,
      });
    } catch (error: any) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  app.post("/api/bulk-upload/employers", requireRole("admin", "ministry"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      let imported = 0;
      let errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          await storage.createEmployer({
            name: row.name,
            taxId: row.taxId || row.tax_id || null,
            sector: row.sector || "private",
            county: row.county || "Montserrado",
            address: row.address || null,
            phone: row.phone || null,
            email: row.email || null,
            isicCode: row.isicCode || row.isic_code || null,
            employeeCount: row.employeeCount || row.employee_count || null,
          });
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }

      res.json({
        success: true,
        imported,
        errors: errors.length > 0 ? errors.slice(0, 10) : [],
        totalRows: data.length,
      });
    } catch (error: any) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  app.post("/api/bulk-upload/vacancies", requireRole("admin", "ministry", "employer"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      let imported = 0;
      let errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          await storage.createVacancy({
            employerId: row.employerId || row.employer_id,
            title: row.title,
            description: row.description || null,
            county: row.county || "Montserrado",
            sector: row.sector || "private",
            iscoCode: row.iscoCode || row.isco_code || null,
            minSalary: row.minSalary || row.min_salary || null,
            maxSalary: row.maxSalary || row.max_salary || null,
            salaryCurrency: row.salaryCurrency || row.salary_currency || "LRD",
            contractType: row.contractType || row.contract_type || "permanent",
            positions: row.positions || 1,
            closingDate: row.closingDate || row.closing_date || null,
            educationRequired: row.educationRequired || row.education_required || null,
            experienceYears: row.experienceYears || row.experience_years || null,
          });
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }

      res.json({
        success: true,
        imported,
        errors: errors.length > 0 ? errors.slice(0, 10) : [],
        totalRows: data.length,
      });
    } catch (error: any) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  // Get template for bulk upload
  app.get("/api/bulk-upload/template/:type", requireAuth, (req, res) => {
    const { type } = req.params;
    let headers: string[] = [];
    let sampleData: Record<string, any>[] = [];

    switch (type) {
      case "employment-spells":
        headers = ["personId", "employerId", "startDate", "endDate", "contractType", "sector", "county", "iscoCode", "isicCode", "jobTitle", "monthlySalary", "salaryCurrency", "hoursPerWeek", "isFormal"];
        sampleData = [{
          personId: "person-uuid-here",
          employerId: "employer-uuid-here",
          startDate: "2024-01-15",
          endDate: "2025-01-14",
          contractType: "permanent",
          sector: "private",
          county: "Montserrado",
          iscoCode: "2512",
          isicCode: "62",
          jobTitle: "Software Developer",
          monthlySalary: 50000,
          salaryCurrency: "LRD",
          hoursPerWeek: 40,
          isFormal: true
        }];
        break;
      case "employers":
        headers = ["name", "taxId", "sector", "county", "address", "phone", "email", "isicCode", "employeeCount"];
        sampleData = [{
          name: "Example Company Ltd",
          taxId: "LR123456789",
          sector: "private",
          county: "Montserrado",
          address: "123 Main Street, Monrovia",
          phone: "+231-xxx-xxx-xxxx",
          email: "contact@example.com",
          isicCode: "62",
          employeeCount: 50
        }];
        break;
      case "vacancies":
        headers = ["employerId", "title", "description", "county", "sector", "iscoCode", "minSalary", "maxSalary", "salaryCurrency", "contractType", "positions", "closingDate", "educationRequired", "experienceYears"];
        sampleData = [{
          employerId: "employer-uuid-here",
          title: "Software Developer",
          description: "We are looking for a skilled developer...",
          county: "Montserrado",
          sector: "private",
          iscoCode: "2512",
          minSalary: 40000,
          maxSalary: 60000,
          salaryCurrency: "LRD",
          contractType: "permanent",
          positions: 2,
          closingDate: "2025-03-15",
          educationRequired: "tertiary",
          experienceYears: 2
        }];
        break;
      default:
        return res.status(400).json({ error: "Unknown template type" });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="template_${type}.xlsx"`);
    res.send(buffer);
  });

  // ==================== LABOUR MARKET INDICATORS ROUTES ====================

  app.get("/api/labour-indicators", async (_req, res) => {
    try {
      const indicators = await storage.getLabourMarketIndicators();
      res.json(indicators);
    } catch (error: any) {
      console.error("Error fetching labour indicators:", error);
      res.status(500).json({ message: "Failed to fetch labour indicators", error: error.message });
    }
  });

  app.get("/api/labour-indicators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const indicator = await storage.getLabourMarketIndicatorById(id);
      if (!indicator) return res.status(404).json({ message: "Indicator not found" });
      res.json(indicator);
    } catch (error: any) {
      console.error("Error fetching labour indicator:", error);
      res.status(500).json({ message: "Failed to fetch labour indicator", error: error.message });
    }
  });

  app.post("/api/labour-indicators", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const result = insertLabourMarketIndicatorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", details: result.error.errors });
      }
      const indicator = await storage.createLabourMarketIndicator({ ...result.data, createdBy: req.session.user.id });
      res.status(201).json(indicator);
    } catch (error: any) {
      console.error("Error creating labour indicator:", error);
      res.status(500).json({ message: "Failed to create labour indicator", error: error.message });
    }
  });

  app.put("/api/labour-indicators/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const indicator = await storage.updateLabourMarketIndicator(id, req.body);
      if (!indicator) return res.status(404).json({ message: "Indicator not found" });
      res.json(indicator);
    } catch (error: any) {
      console.error("Error updating labour indicator:", error);
      res.status(500).json({ message: "Failed to update labour indicator", error: error.message });
    }
  });

  app.delete("/api/labour-indicators/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const deleted = await storage.deleteLabourMarketIndicator(id);
      if (!deleted) return res.status(404).json({ message: "Indicator not found" });
      res.json({ message: "Indicator deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting labour indicator:", error);
      res.status(500).json({ message: "Failed to delete labour indicator", error: error.message });
    }
  });

  // ==================== COUNTY INDICATORS ROUTES ====================

  app.get("/api/county-indicators", async (req, res) => {
    try {
      const { year, quarter, county } = req.query;
      let query = `SELECT * FROM county_indicators WHERE 1=1`;
      const params: any[] = [];
      if (year) { params.push(parseInt(year as string)); query += ` AND year = $${params.length}`; }
      if (quarter) { params.push(parseInt(quarter as string)); query += ` AND quarter = $${params.length}`; }
      if (county) { params.push(county as string); query += ` AND county = $${params.length}`; }
      query += ` ORDER BY year DESC, quarter DESC NULLS LAST, county ASC`;
      const { rows } = await pool.query(query, params);
      const mapped = rows.map((r: any) => ({
        id: r.id, county: r.county, year: r.year, quarter: r.quarter,
        population: r.population, activePopulation: r.active_population,
        totalEmployed: r.total_employed, totalUnemployed: r.total_unemployed,
        totalUnderemployed: r.total_underemployed, unemploymentRate: r.unemployment_rate,
        employmentRate: r.employment_rate, underemploymentRate: r.underemployment_rate,
        labourForceParticipation: r.labour_force_participation,
        maleUnemploymentRate: r.male_unemployment_rate, femaleUnemploymentRate: r.female_unemployment_rate,
        urbanUnemploymentRate: r.urban_unemployment_rate, ruralUnemploymentRate: r.rural_unemployment_rate,
        youthUnemploymentRate: r.youth_unemployment_rate, agriculturePct: r.agriculture_pct,
        servicesPct: r.services_pct, industryPct: r.industry_pct,
        totalJobSeekers: r.total_job_seekers, totalVacancies: r.total_vacancies,
      }));
      res.json(mapped);
    } catch (error: any) {
      console.error("Error fetching county indicators:", error);
      res.status(500).json({ message: "Failed to fetch county indicators", error: error.message });
    }
  });

  // ==================== GRIEVANCE ROUTES ====================

  app.post("/api/grievances", async (req, res) => {
    try {
      const result = insertGrievanceCaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", details: result.error.errors });
      }
      const grievance = await storage.createGrievanceCase(result.data);
      res.status(201).json({ grievance, trackingNumber: grievance.trackingNumber });
    } catch (error: any) {
      console.error("Error creating grievance case:", error);
      res.status(500).json({ message: "Failed to create grievance case", error: error.message });
    }
  });

  app.get("/api/grievances/track/:trackingNumber", async (req, res) => {
    try {
      const grievance = await storage.getGrievanceCaseByTracking(req.params.trackingNumber);
      if (!grievance) return res.status(404).json({ message: "Grievance case not found" });
      res.json(grievance);
    } catch (error: any) {
      console.error("Error tracking grievance case:", error);
      res.status(500).json({ message: "Failed to track grievance case", error: error.message });
    }
  });

  app.get("/api/grievances", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const filters: { status?: string; county?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.county) filters.county = req.query.county as string;
      const cases = await storage.getGrievanceCases(filters);
      res.json(cases);
    } catch (error: any) {
      console.error("Error fetching grievance cases:", error);
      res.status(500).json({ message: "Failed to fetch grievance cases", error: error.message });
    }
  });

  app.patch("/api/grievances/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const updated = await storage.updateGrievanceCase(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Grievance case not found" });
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating grievance case:", error);
      res.status(500).json({ message: "Failed to update grievance case", error: error.message });
    }
  });

  // ==================== KNOWLEDGE BASE ROUTES ====================

  app.get("/api/knowledge-base", async (req, res) => {
    try {
      const filters: { category?: string; isPublished?: boolean } = { isPublished: true };
      if (req.query.category) filters.category = req.query.category as string;
      const items = await storage.getKnowledgeBaseItems(filters);
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching knowledge base items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base items", error: error.message });
    }
  });

  app.get("/api/knowledge-base/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const item = await storage.getKnowledgeBaseItemById(id);
      if (!item) return res.status(404).json({ message: "Knowledge base item not found" });
      res.json(item);
    } catch (error: any) {
      console.error("Error fetching knowledge base item:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base item", error: error.message });
    }
  });

  app.post("/api/knowledge-base", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const result = insertKnowledgeBaseItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", details: result.error.errors });
      }
      const item = await storage.createKnowledgeBaseItem({ ...result.data, createdBy: req.session.user.id });
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating knowledge base item:", error);
      res.status(500).json({ message: "Failed to create knowledge base item", error: error.message });
    }
  });

  app.put("/api/knowledge-base/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const item = await storage.updateKnowledgeBaseItem(id, req.body);
      if (!item) return res.status(404).json({ message: "Knowledge base item not found" });
      res.json(item);
    } catch (error: any) {
      console.error("Error updating knowledge base item:", error);
      res.status(500).json({ message: "Failed to update knowledge base item", error: error.message });
    }
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.session.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const deleted = await storage.deleteKnowledgeBaseItem(id);
      if (!deleted) return res.status(404).json({ message: "Knowledge base item not found" });
      res.json({ message: "Knowledge base item deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting knowledge base item:", error);
      res.status(500).json({ message: "Failed to delete knowledge base item", error: error.message });
    }
  });

  // ==================== WORKPLACE INCIDENTS ROUTES ====================

  app.post("/api/workplace-incidents", async (req, res) => {
    try {
      const result = insertWorkplaceIncidentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", details: result.error.errors });
      }
      const incident = await storage.createWorkplaceIncident(result.data);
      res.status(201).json(incident);
    } catch (error: any) {
      console.error("Error creating workplace incident:", error);
      res.status(500).json({ message: "Failed to create workplace incident", error: error.message });
    }
  });

  app.get("/api/workplace-incidents/stats/summary", async (_req, res) => {
    try {
      const incidents = await storage.getWorkplaceIncidents();
      const total = incidents.length;
      let totalFatalities = 0;
      let totalInjuries = 0;
      const bySeverity: Record<string, number> = {};
      const byCounty: Record<string, number> = {};
      const byType: Record<string, number> = {};
      for (const incident of incidents) {
        totalFatalities += incident.fatalities;
        totalInjuries += incident.injuries;
        bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
        byCounty[incident.county] = (byCounty[incident.county] || 0) + 1;
        byType[incident.incidentType] = (byType[incident.incidentType] || 0) + 1;
      }
      res.json({ total, totalFatalities, totalInjuries, bySeverity, byCounty, byType });
    } catch (error: any) {
      console.error("Error fetching workplace incident stats:", error);
      res.status(500).json({ message: "Failed to fetch workplace incident stats", error: error.message });
    }
  });

  app.get("/api/workplace-incidents", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const filters: { status?: string; county?: string; severity?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.county) filters.county = req.query.county as string;
      if (req.query.severity) filters.severity = req.query.severity as string;
      const incidents = await storage.getWorkplaceIncidents(filters);
      res.json(incidents);
    } catch (error: any) {
      console.error("Error fetching workplace incidents:", error);
      res.status(500).json({ message: "Failed to fetch workplace incidents", error: error.message });
    }
  });

  app.get("/api/workplace-incidents/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const incident = await storage.getWorkplaceIncidentById(id);
      if (!incident) return res.status(404).json({ message: "Workplace incident not found" });
      res.json(incident);
    } catch (error: any) {
      console.error("Error fetching workplace incident:", error);
      res.status(500).json({ message: "Failed to fetch workplace incident", error: error.message });
    }
  });

  app.patch("/api/workplace-incidents/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!["admin", "ministry"].includes(req.session.user.role)) {
        return res.status(403).json({ message: "Admin or ministry access required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const incident = await storage.updateWorkplaceIncident(id, req.body);
      if (!incident) return res.status(404).json({ message: "Workplace incident not found" });
      res.json(incident);
    } catch (error: any) {
      console.error("Error updating workplace incident:", error);
      res.status(500).json({ message: "Failed to update workplace incident", error: error.message });
    }
  });

  // =============================================
  // TENDERS & BIDDING
  // =============================================

  // Get tenders (public)
  app.get("/api/tenders", async (req, res) => {
    try {
      const filters = {
        employerId: req.query.employerId as string | undefined,
        type: req.query.type as string | undefined,
        status: req.query.status as string | undefined,
        county: req.query.county as string | undefined,
      };
      const tendersList = await storage.getTenders(filters);
      res.json(tendersList);
    } catch (error) {
      console.error("Error fetching tenders:", error);
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  // Get tender by ID (public)
  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.getTenderById(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      console.error("Error fetching tender:", error);
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });

  // Create tender (auth required)
  app.post("/api/tenders", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      const employers = await storage.getEmployers();
      let userEmployer = employers.find(e => e.userId === user.id);
      if (!userEmployer) {
        if (user.role === "employer" || user.role === "admin") {
          userEmployer = await storage.createEmployer({
            userId: user.id,
            legalName: user.organizationName || `${user.firstName} ${user.lastName}`,
            tradingName: user.organizationName || null,
            sector: user.sector || "private",
            isPublicSector: user.sector === "public",
            contactEmail: user.email,
            contactPhone: user.phone || "",
          });
        } else {
          return res.status(400).json({ error: "Only employers can create tenders" });
        }
      }

      const validationResult = insertTenderSchema.safeParse({
        ...req.body,
        employerId: userEmployer.id,
      });
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.errors });
      }

      const tender = await storage.createTender(validationResult.data);

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "tender",
        entityId: tender.id,
        newValues: tender,
      });

      res.status(201).json(tender);
    } catch (error) {
      console.error("Error creating tender:", error);
      res.status(500).json({ error: "Failed to create tender" });
    }
  });

  // Update tender (auth required, employer must own tender)
  app.patch("/api/tenders/:id", requireAuth, async (req, res) => {
    try {
      const tender = await storage.getTenderById(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }

      const userRole = req.session.user!.role;
      if (!["admin", "ministry"].includes(userRole)) {
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        if (!userEmployer || userEmployer.id !== tender.employerId) {
          return res.status(403).json({ error: "Not authorized to update this tender" });
        }
      }

      const updated = await storage.updateTender(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Tender not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating tender:", error);
      res.status(500).json({ error: "Failed to update tender" });
    }
  });

  // Delete tender (auth required, employer must own tender)
  app.delete("/api/tenders/:id", requireAuth, async (req, res) => {
    try {
      const tender = await storage.getTenderById(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }

      const userRole = req.session.user!.role;
      if (!["admin", "ministry"].includes(userRole)) {
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        if (!userEmployer || userEmployer.id !== tender.employerId) {
          return res.status(403).json({ error: "Not authorized to delete this tender" });
        }
      }

      const deleted = await storage.deleteTender(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tender not found" });
      }

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "DELETE",
        entityType: "tender",
        entityId: req.params.id,
      });

      res.json({ message: "Tender deleted successfully" });
    } catch (error) {
      console.error("Error deleting tender:", error);
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // Get submissions for a tender (auth required, employer must own tender)
  app.get("/api/tenders/:id/submissions", requireAuth, async (req, res) => {
    try {
      const tender = await storage.getTenderById(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }

      const userRole = req.session.user!.role;
      if (!["admin", "ministry"].includes(userRole)) {
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        if (!userEmployer || userEmployer.id !== tender.employerId) {
          return res.status(403).json({ error: "Not authorized to view submissions for this tender" });
        }
      }

      const submissions = await storage.getTenderSubmissions(req.params.id);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching tender submissions:", error);
      res.status(500).json({ error: "Failed to fetch tender submissions" });
    }
  });

  // Submit a bid (auth required)
  app.post("/api/tenders/:id/submissions", requireAuth, async (req, res) => {
    try {
      const tender = await storage.getTenderById(req.params.id);
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      if (tender.status !== "open") {
        return res.status(400).json({ error: "This tender is no longer accepting submissions" });
      }

      const validationResult = insertTenderSubmissionSchema.safeParse({
        ...req.body,
        tenderId: req.params.id,
        bidderId: req.session.user!.id,
      });
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.errors });
      }

      const submission = await storage.createTenderSubmission(validationResult.data);

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "CREATE",
        entityType: "tender_submission",
        entityId: submission.id,
        newValues: submission,
      });

      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating tender submission:", error);
      res.status(500).json({ error: "Failed to submit bid" });
    }
  });

  // Update tender submission status (auth required, employer must own parent tender)
  app.patch("/api/tender-submissions/:id", requireAuth, async (req, res) => {
    try {
      const submission = await storage.getTenderSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const tender = await storage.getTenderById(submission.tenderId);
      if (!tender) {
        return res.status(404).json({ error: "Parent tender not found" });
      }

      const userRole = req.session.user!.role;
      if (!["admin", "ministry"].includes(userRole)) {
        const employers = await storage.getEmployers();
        const userEmployer = employers.find(e => e.userId === req.session.user!.id);
        if (!userEmployer || userEmployer.id !== tender.employerId) {
          return res.status(403).json({ error: "Not authorized to update this submission" });
        }
      }

      const updated = await storage.updateTenderSubmission(req.params.id, {
        ...req.body,
        reviewedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ error: "Submission not found" });
      }

      await storage.createAuditLog({
        actorUserId: req.session.user!.id,
        action: "UPDATE",
        entityType: "tender_submission",
        entityId: updated.id,
        newValues: req.body,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating tender submission:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // ==================== OCCUPATIONAL ECONOMICS ====================

  app.get("/api/occupational-economics/wage-by-occupation", async (req, res) => {
    try {
      const { county, compare } = req.query;
      const allSpells = await storage.getEmploymentSpells();
      const spellsWithWage = allSpells.filter(s => s.monthlySalary && s.monthlySalary > 0 && s.iscoCode);

      function percentile(arr: number[], p: number) {
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = (p / 100) * (sorted.length - 1);
        const lo = Math.floor(idx), hi = Math.ceil(idx);
        return lo === hi ? sorted[lo] : Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
      }

      function computeOccupations(spells: typeof spellsWithWage) {
        const byOcc: Record<string, { salaries: number[]; title: string; byCounty: Record<string, { salaries: number[] }> }> = {};
        for (const spell of spells) {
          const code = spell.iscoCode!;
          if (!byOcc[code]) byOcc[code] = { salaries: [], title: spell.jobTitle, byCounty: {} };
          byOcc[code].salaries.push(spell.monthlySalary!);
          if (!byOcc[code].byCounty[spell.county]) byOcc[code].byCounty[spell.county] = { salaries: [] };
          byOcc[code].byCounty[spell.county].salaries.push(spell.monthlySalary!);
        }
        return Object.entries(byOcc).map(([code, data]) => {
          const s = data.salaries;
          const avg = Math.round(s.reduce((a, b) => a + b, 0) / s.length);
          return {
            iscoCode: code,
            title: data.title,
            avgSalary: avg,
            medianSalary: percentile(s, 50),
            p25Salary: percentile(s, 25),
            p75Salary: percentile(s, 75),
            minSalary: Math.min(...s),
            maxSalary: Math.max(...s),
            workers: s.length,
            byCounty: Object.entries(data.byCounty).map(([c, d]) => ({
              county: c,
              avgSalary: Math.round(d.salaries.reduce((a, b) => a + b, 0) / d.salaries.length),
              medianSalary: percentile(d.salaries, 50),
              workers: d.salaries.length,
            })).sort((a, b) => b.avgSalary - a.avgSalary),
          };
        }).sort((a, b) => b.avgSalary - a.avgSalary);
      }

      const filtered = county && county !== "all"
        ? spellsWithWage.filter(s => s.county === county)
        : spellsWithWage;

      const result = computeOccupations(filtered);

      const wageDistribution = [
        { range: "< L$10K", count: 0 },
        { range: "L$10K-20K", count: 0 },
        { range: "L$20K-30K", count: 0 },
        { range: "L$30K-40K", count: 0 },
        { range: "L$40K-50K", count: 0 },
        { range: "> L$50K", count: 0 },
      ];
      for (const spell of filtered) {
        const sal = spell.monthlySalary!;
        if (sal < 10000) wageDistribution[0].count++;
        else if (sal < 20000) wageDistribution[1].count++;
        else if (sal < 30000) wageDistribution[2].count++;
        else if (sal < 40000) wageDistribution[3].count++;
        else if (sal < 50000) wageDistribution[4].count++;
        else wageDistribution[5].count++;
      }

      const allSalaries = filtered.map(s => s.monthlySalary!);
      const nationalAvg = allSalaries.length > 0 ? Math.round(allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length) : 0;
      const nationalMedian = allSalaries.length > 0 ? percentile(allSalaries, 50) : 0;

      let compareData = null;
      if (compare && compare !== "all" && compare !== county) {
        const compareSpells = spellsWithWage.filter(s => s.county === compare);
        compareData = { county: compare as string, occupations: computeOccupations(compareSpells), totalWorkers: compareSpells.length };
      }

      const latestDate = filtered.reduce((max, s) => {
        const d = s.endDate || s.startDate;
        return d > max ? d : max;
      }, "2020-01-01");

      res.json({
        occupations: result,
        totalWorkers: filtered.length,
        nationalAvg,
        nationalMedian,
        wageDistribution,
        compareData,
        lastUpdated: latestDate,
        dataSource: "employment_spells",
        sampleNote: county && county !== "all" ? `Filtered to ${county} County` : "National aggregate across all 15 counties",
      });
    } catch (error) {
      console.error("Error fetching wage by occupation:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.get("/api/occupational-economics/demand-trends", async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const spellsWithCode = allSpells.filter(s => s.iscoCode);

      const byYearAndOcc: Record<string, Record<string, { count: number; title: string }>> = {};
      const bySectorYear: Record<string, Record<string, number>> = {};
      const byCountyOcc: Record<string, Record<string, number>> = {};

      for (const spell of spellsWithCode) {
        const year = new Date(spell.startDate).getFullYear().toString();
        const code = spell.iscoCode!;
        if (!byYearAndOcc[year]) byYearAndOcc[year] = {};
        if (!byYearAndOcc[year][code]) byYearAndOcc[year][code] = { count: 0, title: spell.jobTitle };
        byYearAndOcc[year][code].count++;

        if (!bySectorYear[spell.sector]) bySectorYear[spell.sector] = {};
        bySectorYear[spell.sector][year] = (bySectorYear[spell.sector][year] || 0) + 1;

        if (!byCountyOcc[spell.county]) byCountyOcc[spell.county] = {};
        byCountyOcc[spell.county][code] = (byCountyOcc[spell.county][code] || 0) + 1;
      }

      const currentYear = new Date().getFullYear();
      const years = Object.keys(byYearAndOcc).sort();
      const allCodes = new Set<string>();
      Object.values(byYearAndOcc).forEach(y => Object.keys(y).forEach(c => allCodes.add(c)));

      const trends = Array.from(allCodes).map(code => {
        const yearData = years.map(y => ({
          year: parseInt(y),
          count: byYearAndOcc[y]?.[code]?.count || 0,
        }));

        const title = Object.values(byYearAndOcc).find(y => y[code])![code].title;
        const completeYearData = yearData.filter(y => y.year < currentYear);
        const firstYear = completeYearData[0]?.count || 0;
        const lastYear = completeYearData[completeYearData.length - 1]?.count || (yearData[yearData.length - 1]?.count || 0);
        const growthRate = firstYear > 0 ? Math.round(((lastYear - firstYear) / firstYear) * 100) : 0;

        const countyBreakdown = Object.entries(byCountyOcc).map(([county, occs]) => ({
          county, count: occs[code] || 0,
        })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

        return {
          iscoCode: code, title, yearData, totalSpells: yearData.reduce((sum, y) => sum + y.count, 0),
          growthRate, trend: growthRate > 10 ? "growing" : growthRate < -10 ? "declining" : "stable",
          countyBreakdown,
        };
      }).sort((a, b) => b.growthRate - a.growthRate);

      const sectorTrends = Object.entries(bySectorYear).map(([sector, yearData]) => ({
        sector,
        yearData: years.map(y => ({ year: parseInt(y), count: yearData[y] || 0 })),
        total: Object.values(yearData).reduce((a, b) => a + b, 0),
      })).sort((a, b) => b.total - a.total);

      const summary = {
        totalOccupations: trends.length,
        growing: trends.filter(t => t.trend === "growing").length,
        stable: trends.filter(t => t.trend === "stable").length,
        declining: trends.filter(t => t.trend === "declining").length,
        totalSpells: spellsWithCode.length,
        topGrowing: trends.filter(t => t.trend === "growing").slice(0, 3).map(t => t.title),
        topDeclining: trends.filter(t => t.trend === "declining").slice(-3).map(t => t.title),
      };

      res.json({ trends, years: years.map(Number), sectorTrends, summary, lastUpdated: new Date().toISOString().split("T")[0] });
    } catch (error) {
      console.error("Error fetching demand trends:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.get("/api/occupational-economics/skills-gap", async (req, res) => {
    try {
      const allVacancies = await storage.getVacancies();
      const allSkillsList = await storage.getSkills();
      const allPersons = await db.select().from(persons);
      const allPersonSkills = await db.select().from(personSkills);

      const seekerSkillCounts: Record<number, number> = {};
      for (const ps of allPersonSkills) {
        seekerSkillCounts[ps.skillId] = (seekerSkillCounts[ps.skillId] || 0) + 1;
      }

      const employerSkillDemand: Record<string, number> = {};
      for (const v of allVacancies) {
        if (v.requiredSkills) {
          for (const skill of v.requiredSkills) {
            if (skill) {
              employerSkillDemand[skill] = (employerSkillDemand[skill] || 0) + (v.openings || 1);
            }
          }
        }
      }

      const skillMap = new Map(allSkillsList.map(s => [s.id, s]));
      const skillNameMap = new Map(allSkillsList.map(s => [s.name, s]));

      const gapAnalysis = allSkillsList.map(skill => {
        const supply = seekerSkillCounts[skill.id] || 0;
        const demand = employerSkillDemand[skill.name] || 0;
        const gap = demand - supply;
        const gapType = gap > 2 ? "shortage" : gap < -2 ? "surplus" : "balanced";

        return {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          supply,
          demand,
          gap,
          gapType,
          trainingOpportunity: gap > 2,
        };
      }).sort((a, b) => b.gap - a.gap);

      const shortages = gapAnalysis.filter(g => g.gapType === "shortage");
      const surpluses = gapAnalysis.filter(g => g.gapType === "surplus");
      const balanced = gapAnalysis.filter(g => g.gapType === "balanced");

      res.json({
        skills: gapAnalysis,
        summary: {
          totalSkills: gapAnalysis.length,
          shortages: shortages.length,
          surpluses: surpluses.length,
          balanced: balanced.length,
          totalSeekers: allPersons.length,
          totalVacancies: allVacancies.length,
          topShortages: shortages.slice(0, 5).map(s => s.skillName),
          topSurpluses: surpluses.slice(0, 5).map(s => s.skillName),
        },
      });
    } catch (error) {
      console.error("Error fetching skills gap:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.get("/api/occupational-economics/projections", async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const spellsWithCode = allSpells.filter(s => s.iscoCode);

      const bySectorYear: Record<string, Record<string, number>> = {};
      const byOccYear: Record<string, Record<string, { count: number; title: string }>> = {};

      for (const spell of spellsWithCode) {
        const year = new Date(spell.startDate).getFullYear().toString();

        if (!bySectorYear[spell.sector]) bySectorYear[spell.sector] = {};
        bySectorYear[spell.sector][year] = (bySectorYear[spell.sector][year] || 0) + 1;

        const code = spell.iscoCode!;
        if (!byOccYear[code]) byOccYear[code] = {};
        if (!byOccYear[code][year]) byOccYear[code][year] = { count: 0, title: spell.jobTitle };
        byOccYear[code][year].count++;
      }

      const years = [...new Set(spellsWithCode.map(s => new Date(s.startDate).getFullYear()))].sort();
      const projectionYear = (years[years.length - 1] || 2025) + 1;

      const sectorProjections = Object.entries(bySectorYear).map(([sector, yearData]) => {
        const sortedYears = Object.entries(yearData).sort(([a], [b]) => Number(a) - Number(b));
        const values = sortedYears.map(([, count]) => count);

        let projected = values[values.length - 1] || 0;
        if (values.length >= 2) {
          const avgGrowth = (values[values.length - 1] - values[0]) / (values.length - 1);
          projected = Math.max(0, Math.round(values[values.length - 1] + avgGrowth));
        }

        const trend = values.length >= 2 ?
          (values[values.length - 1] > values[0] ? "growing" : values[values.length - 1] < values[0] ? "declining" : "stable")
          : "insufficient_data";

        return {
          sector,
          historical: sortedYears.map(([y, c]) => ({ year: Number(y), count: c })),
          projected: { year: projectionYear, count: projected },
          trend,
          confidence: values.length >= 3 ? "moderate" : "low",
        };
      });

      const occupationProjections = Object.entries(byOccYear).map(([code, yearData]) => {
        const sortedYears = Object.entries(yearData).sort(([a], [b]) => Number(a) - Number(b));
        const values = sortedYears.map(([, d]) => d.count);
        const title = Object.values(yearData)[0]?.title || code;

        let projected = values[values.length - 1] || 0;
        if (values.length >= 2) {
          const avgGrowth = (values[values.length - 1] - values[0]) / (values.length - 1);
          projected = Math.max(0, Math.round(values[values.length - 1] + avgGrowth));
        }

        return {
          iscoCode: code,
          title,
          historical: sortedYears.map(([y, d]) => ({ year: Number(y), count: d.count })),
          projected: { year: projectionYear, count: projected },
          trend: values.length >= 2 ? (values[values.length - 1] > values[0] ? "growing" : "declining") : "insufficient_data",
        };
      }).sort((a, b) => (b.projected.count - a.projected.count));

      res.json({
        projectionYear,
        dataYears: years,
        sectorProjections,
        occupationProjections,
        disclaimer: "Projections are based on linear trend analysis of available employment spell data. Accuracy improves with more years of data.",
      });
    } catch (error) {
      console.error("Error fetching projections:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.get("/api/occupational-economics/injury-risk", async (req, res) => {
    try {
      const incidents = await storage.getWorkplaceIncidents();
      const allSpells = await storage.getEmploymentSpells();

      const bySector: Record<string, { incidents: number; fatalities: number; injuries: number; severities: Record<string, number>; types: Record<string, number> }> = {};

      for (const inc of incidents) {
        const sector = inc.sector;
        if (!bySector[sector]) {
          bySector[sector] = { incidents: 0, fatalities: 0, injuries: 0, severities: {}, types: {} };
        }
        bySector[sector].incidents++;
        bySector[sector].fatalities += inc.fatalities;
        bySector[sector].injuries += inc.injuries;
        bySector[sector].severities[inc.severity] = (bySector[sector].severities[inc.severity] || 0) + 1;
        bySector[sector].types[inc.incidentType] = (bySector[sector].types[inc.incidentType] || 0) + 1;
      }

      const workersBySector: Record<string, number> = {};
      for (const spell of allSpells) {
        workersBySector[spell.sector] = (workersBySector[spell.sector] || 0) + 1;
      }

      const byCounty: Record<string, { incidents: number; fatalities: number; injuries: number }> = {};
      for (const inc of incidents) {
        if (!byCounty[inc.county]) byCounty[inc.county] = { incidents: 0, fatalities: 0, injuries: 0 };
        byCounty[inc.county].incidents++;
        byCounty[inc.county].fatalities += inc.fatalities;
        byCounty[inc.county].injuries += inc.injuries;
      }

      const sectorRisk = Object.entries(bySector).map(([sector, data]) => ({
        sector,
        incidents: data.incidents,
        fatalities: data.fatalities,
        injuries: data.injuries,
        workers: workersBySector[sector] || 0,
        incidentRate: workersBySector[sector] ? Math.round((data.incidents / workersBySector[sector]) * 1000) / 10 : 0,
        severityBreakdown: data.severities,
        incidentTypes: Object.entries(data.types).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      })).sort((a, b) => b.incidentRate - a.incidentRate);

      const countyRisk = Object.entries(byCounty).map(([county, data]) => ({
        county,
        ...data,
      })).sort((a, b) => b.incidents - a.incidents);

      const totalIncidents = incidents.length;
      const totalFatalities = incidents.reduce((sum, i) => sum + i.fatalities, 0);
      const totalInjuries = incidents.reduce((sum, i) => sum + i.injuries, 0);

      res.json({
        summary: { totalIncidents, totalFatalities, totalInjuries },
        bySector: sectorRisk,
        byCounty: countyRisk,
      });
    } catch (error) {
      console.error("Error fetching injury risk:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  // ==================== STATISTICAL RIGOR ====================

  // 1. Automated Quality Checks
  app.get("/api/statistical-rigor/quality-checks", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const allEmployers = await storage.getEmployers();

      const issues: { type: string; severity: string; description: string; recordId?: string; field?: string; value?: string }[] = [];

      // Duplicate detection: same person + employer + overlapping dates
      const duplicateMap = new Map<string, typeof allSpells>();
      for (const spell of allSpells) {
        const key = `${spell.personId || spell.employeeName}-${spell.employerId || spell.employerName}`;
        if (!duplicateMap.has(key)) duplicateMap.set(key, []);
        duplicateMap.get(key)!.push(spell);
      }
      const duplicateRecordIds = new Set<string>();
      for (const [, group] of duplicateMap) {
        if (group.length > 1) {
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const a = group[i], b = group[j];
              const aStart = new Date(a.startDate), aEnd = a.endDate ? new Date(a.endDate) : new Date();
              const bStart = new Date(b.startDate), bEnd = b.endDate ? new Date(b.endDate) : new Date();
              if (aStart <= bEnd && bStart <= aEnd) {
                duplicateRecordIds.add(a.id);
                duplicateRecordIds.add(b.id);
                if (issues.filter(i => i.type === "duplicate").length < 10) {
                  issues.push({
                    type: "duplicate",
                    severity: "high",
                    description: `Overlapping employment spells for ${a.employeeName || a.personId} at ${a.employerName}`,
                    recordId: a.id,
                    field: "dates",
                    value: `${a.startDate} - ${a.endDate || 'active'} overlaps with ${b.startDate} - ${b.endDate || 'active'}`,
                  });
                }
              }
            }
          }
        }
      }
      const duplicateCount = duplicateRecordIds.size;

      // Impossible dates
      let impossibleDateCount = 0;
      const impossibleDateIds = new Set<string>();
      const now = new Date();
      for (const spell of allSpells) {
        const start = new Date(spell.startDate);
        const end = spell.endDate ? new Date(spell.endDate) : null;
        if (end && end < start) {
          impossibleDateCount++;
          impossibleDateIds.add(spell.id);
          if (issues.filter(i => i.type === "impossible_date").length < 10) {
            issues.push({
              type: "impossible_date",
              severity: "critical",
              description: `End date before start date for ${spell.employeeName || 'Unknown'} at ${spell.employerName}`,
              recordId: spell.id,
              field: "endDate",
              value: `Start: ${spell.startDate}, End: ${spell.endDate}`,
            });
          }
        }
        if (start > now) {
          impossibleDateCount++;
          impossibleDateIds.add(spell.id);
          if (issues.filter(i => i.type === "impossible_date").length < 10) {
            issues.push({
              type: "impossible_date",
              severity: "medium",
              description: `Future start date for ${spell.employeeName || 'Unknown'} at ${spell.employerName}`,
              recordId: spell.id,
              field: "startDate",
              value: spell.startDate,
            });
          }
        }
        if (end && start.getTime() > 0) {
          const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (years > 50) {
            impossibleDateCount++;
            impossibleDateIds.add(spell.id);
            if (issues.filter(i => i.type === "impossible_date").length < 10) {
              issues.push({
                type: "impossible_date",
                severity: "medium",
                description: `Employment spell exceeds 50 years for ${spell.employeeName || 'Unknown'}`,
                recordId: spell.id,
                field: "duration",
                value: `${Math.round(years)} years`,
              });
            }
          }
        }
      }

      // Wage outliers using IQR method
      const wages = allSpells.filter(s => s.monthlySalary && s.monthlySalary > 0).map(s => ({ id: s.id, name: s.employeeName, employer: s.employerName, wage: Number(s.monthlySalary), sector: s.sector }));
      wages.sort((a, b) => a.wage - b.wage);
      let wageOutlierCount = 0;
      const wageOutlierIds = new Set<string>();
      if (wages.length > 4) {
        const q1 = wages[Math.floor(wages.length * 0.25)].wage;
        const q3 = wages[Math.floor(wages.length * 0.75)].wage;
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        for (const w of wages) {
          if (w.wage < lowerBound || w.wage > upperBound) {
            wageOutlierCount++;
            wageOutlierIds.add(w.id);
            if (issues.filter(i => i.type === "wage_outlier").length < 10) {
              issues.push({
                type: "wage_outlier",
                severity: w.wage > upperBound * 2 || w.wage < 0 ? "high" : "medium",
                description: `${w.wage > upperBound ? 'Unusually high' : 'Unusually low'} wage for ${w.name || 'Unknown'} at ${w.employer}`,
                recordId: w.id,
                field: "monthlySalary",
                value: `L$${w.wage.toLocaleString()} (normal range: L$${Math.round(lowerBound).toLocaleString()} - L$${Math.round(upperBound).toLocaleString()})`,
              });
            }
          }
        }
      }

      // Unusual employer employee counts
      const employerSpellCounts = new Map<string, number>();
      for (const spell of allSpells) {
        const eid = spell.employerId || spell.employerName;
        employerSpellCounts.set(eid, (employerSpellCounts.get(eid) || 0) + 1);
      }
      const counts = Array.from(employerSpellCounts.values());
      counts.sort((a, b) => a - b);
      let unusualEmployerCount = 0;
      if (counts.length > 4) {
        const median = counts[Math.floor(counts.length / 2)];
        const threshold = median * 5;
        for (const [eid, count] of employerSpellCounts) {
          if (count > threshold || (count === 1 && median > 5)) {
            unusualEmployerCount++;
            const emp = allEmployers.find(e => e.id === eid || e.legalName === eid || e.tradingName === eid);
            const empName = emp?.legalName || emp?.tradingName || eid;
            if (issues.filter(i => i.type === "unusual_employer").length < 10) {
              issues.push({
                type: "unusual_employer",
                severity: count > threshold ? "medium" : "low",
                description: count > threshold
                  ? `${empName} has unusually high employee count (${count} vs median ${median})`
                  : `${empName} has only 1 recorded employee`,
                recordId: eid,
                field: "employeeCount",
                value: `${count} employees (median: ${median})`,
              });
            }
          }
        }
      }

      const allAffectedRecords = new Set<string>([...duplicateRecordIds, ...impossibleDateIds, ...wageOutlierIds]);
      const uniqueAffectedCount = allAffectedRecords.size;
      const summary = {
        totalRecords: allSpells.length,
        totalIssues: duplicateCount + impossibleDateCount + wageOutlierCount + unusualEmployerCount,
        duplicates: duplicateCount,
        impossibleDates: impossibleDateCount,
        wageOutliers: wageOutlierCount,
        unusualEmployers: unusualEmployerCount,
        dataQualityScore: Math.max(0, Math.round((1 - uniqueAffectedCount / Math.max(allSpells.length, 1)) * 100)),
      };

      res.json({ summary, issues: issues.slice(0, 50) });
    } catch (error) {
      console.error("Error running quality checks:", error);
      res.status(500).json({ error: "Failed to run quality checks" });
    }
  });

  // 2. Sampling Frameworks
  app.get("/api/statistical-rigor/sampling-frameworks", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const allEmployers = await storage.getEmployers();
      const confidenceLevel = 0.95;
      const marginOfError = 0.05;
      const zScore = 1.96;

      // County-level strata
      const countyStrata: Record<string, { population: number; employers: Set<string>; sectors: Set<string> }> = {};
      for (const spell of allSpells) {
        if (!countyStrata[spell.county]) {
          countyStrata[spell.county] = { population: 0, employers: new Set(), sectors: new Set() };
        }
        countyStrata[spell.county].population++;
        countyStrata[spell.county].employers.add(spell.employerId || spell.employerName);
        countyStrata[spell.county].sectors.add(spell.sector);
      }

      const totalPopulation = allSpells.length;
      const cochranN0 = Math.ceil((zScore * zScore * 0.5 * 0.5) / (marginOfError * marginOfError));

      const countyRecommendations = Object.entries(countyStrata).map(([county, data]) => {
        const proportion = data.population / totalPopulation;
        const adjustedN = Math.ceil(cochranN0 / (1 + (cochranN0 - 1) / data.population));
        const proportionalSample = Math.ceil(cochranN0 * proportion);
        const recommended = Math.min(Math.max(adjustedN, 30), data.population);
        return {
          county,
          population: data.population,
          proportion: Math.round(proportion * 1000) / 10,
          employers: data.employers.size,
          sectors: data.sectors.size,
          recommendedSample: recommended,
          proportionalSample,
          coveragePercent: Math.round((recommended / data.population) * 1000) / 10,
          priority: proportion < 0.03 ? "high" : proportion < 0.08 ? "medium" : "low",
        };
      }).sort((a, b) => b.population - a.population);

      // Sector-level strata
      const sectorStrata: Record<string, { population: number; counties: Set<string> }> = {};
      for (const spell of allSpells) {
        if (!sectorStrata[spell.sector]) sectorStrata[spell.sector] = { population: 0, counties: new Set() };
        sectorStrata[spell.sector].population++;
        sectorStrata[spell.sector].counties.add(spell.county);
      }

      const sectorRecommendations = Object.entries(sectorStrata).map(([sector, data]) => {
        const proportion = data.population / totalPopulation;
        const adjustedN = Math.ceil(cochranN0 / (1 + (cochranN0 - 1) / data.population));
        return {
          sector,
          population: data.population,
          proportion: Math.round(proportion * 1000) / 10,
          counties: data.counties.size,
          recommendedSample: Math.min(Math.max(adjustedN, 30), data.population),
          priority: proportion < 0.1 ? "high" : proportion < 0.25 ? "medium" : "low",
        };
      }).sort((a, b) => b.population - a.population);

      res.json({
        parameters: {
          confidenceLevel: `${confidenceLevel * 100}%`,
          marginOfError: `±${marginOfError * 100}%`,
          zScore,
          totalPopulation,
          cochranSampleSize: cochranN0,
          totalEmployers: allEmployers.length,
        },
        byCounty: countyRecommendations,
        bySector: sectorRecommendations,
      });
    } catch (error) {
      console.error("Error generating sampling frameworks:", error);
      res.status(500).json({ error: "Failed to generate sampling frameworks" });
    }
  });

  // 3. Seasonal Adjustment
  app.get("/api/statistical-rigor/seasonal-adjustment", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();

      // Monthly employment counts by sector
      const monthlyData: Record<string, Record<string, number>> = {};
      const sectorMonthly: Record<string, Record<string, number>> = {};

      for (const spell of allSpells) {
        const start = new Date(spell.startDate);
        const end = spell.endDate ? new Date(spell.endDate) : new Date();
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (current <= endMonth) {
          const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
          if (!monthlyData[monthKey][spell.sector]) monthlyData[monthKey][spell.sector] = 0;
          monthlyData[monthKey][spell.sector]++;

          if (!sectorMonthly[spell.sector]) sectorMonthly[spell.sector] = {};
          if (!sectorMonthly[spell.sector][monthKey]) sectorMonthly[spell.sector][monthKey] = 0;
          sectorMonthly[spell.sector][monthKey]++;

          current.setMonth(current.getMonth() + 1);
        }
      }

      // Calculate seasonal indices using ratio-to-moving-average
      const seasonalIndices: Record<string, Record<number, number>> = {};
      for (const [sector, months] of Object.entries(sectorMonthly)) {
        const sortedMonths = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
        if (sortedMonths.length < 12) continue;

        const monthRatios: Record<number, number[]> = {};
        for (let i = 6; i < sortedMonths.length - 6; i++) {
          const window = sortedMonths.slice(i - 6, i + 7).map(([, v]) => v);
          const movingAvg = window.reduce((s, v) => s + v, 0) / window.length;
          if (movingAvg > 0) {
            const monthNum = parseInt(sortedMonths[i][0].split('-')[1]);
            if (!monthRatios[monthNum]) monthRatios[monthNum] = [];
            monthRatios[monthNum].push(sortedMonths[i][1] / movingAvg);
          }
        }

        const rawIndices: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) {
          if (monthRatios[m] && monthRatios[m].length > 0) {
            rawIndices[m] = monthRatios[m].reduce((s, v) => s + v, 0) / monthRatios[m].length;
          } else {
            rawIndices[m] = 1.0;
          }
        }
        const avgIndex = Object.values(rawIndices).reduce((s, v) => s + v, 0) / 12;
        seasonalIndices[sector] = {};
        for (let m = 1; m <= 12; m++) {
          seasonalIndices[sector][m] = Math.round((rawIndices[m] / avgIndex) * 1000) / 1000;
        }
      }

      // Build time series with adjusted values
      const sortedMonthKeys = Object.keys(monthlyData).sort();
      const timeSeries = sortedMonthKeys.map(monthKey => {
        const monthNum = parseInt(monthKey.split('-')[1]);
        const sectors: Record<string, { raw: number; adjusted: number; index: number }> = {};
        let totalRaw = 0, totalAdjusted = 0;

        for (const [sector, count] of Object.entries(monthlyData[monthKey])) {
          const index = seasonalIndices[sector]?.[monthNum] || 1.0;
          const adjusted = Math.round(count / index);
          sectors[sector] = { raw: count, adjusted, index };
          totalRaw += count;
          totalAdjusted += adjusted;
        }

        return { month: monthKey, totalRaw, totalAdjusted, sectors };
      });

      // Sector summary with seasonal patterns
      const sectorSummary = Object.entries(seasonalIndices).map(([sector, indices]) => {
        const peakMonth = Object.entries(indices).sort((a, b) => b[1] - a[1])[0];
        const troughMonth = Object.entries(indices).sort((a, b) => a[1] - b[1])[0];
        const seasonality = Math.max(...Object.values(indices)) - Math.min(...Object.values(indices));
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return {
          sector,
          seasonalityStrength: seasonality > 0.3 ? "strong" : seasonality > 0.1 ? "moderate" : "weak",
          seasonalityIndex: Math.round(seasonality * 100) / 100,
          peakMonth: monthNames[parseInt(peakMonth[0])],
          peakIndex: peakMonth[1],
          troughMonth: monthNames[parseInt(troughMonth[0])],
          troughIndex: troughMonth[1],
          indices: Object.fromEntries(Object.entries(indices).map(([m, v]) => [monthNames[parseInt(m)], v])),
        };
      }).sort((a, b) => b.seasonalityIndex - a.seasonalityIndex);

      res.json({
        timeSeries: timeSeries.slice(-24),
        sectorSummary,
        methodology: "Ratio-to-moving-average method with 13-month centered moving average",
      });
    } catch (error) {
      console.error("Error calculating seasonal adjustment:", error);
      res.status(500).json({ error: "Failed to calculate seasonal adjustment" });
    }
  });

  // 4. Confidence Intervals
  app.get("/api/statistical-rigor/confidence-intervals", requireRole("admin", "ministry", "director"), async (req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();
      const allEmployers = await storage.getEmployers();
      const zScore95 = 1.96;
      const zScore90 = 1.645;

      // Employment count CI by county
      const countyEmployment: Record<string, number> = {};
      for (const spell of allSpells) {
        if (spell.isActive) {
          countyEmployment[spell.county] = (countyEmployment[spell.county] || 0) + 1;
        }
      }
      const totalActive = Object.values(countyEmployment).reduce((s, v) => s + v, 0);

      const employmentCI = Object.entries(countyEmployment).map(([county, count]) => {
        const p = count / totalActive;
        const se = Math.sqrt((p * (1 - p)) / totalActive);
        const margin95 = zScore95 * se * totalActive;
        return {
          county,
          estimate: count,
          standardError: Math.round(se * totalActive),
          ci95Lower: Math.max(0, Math.round(count - margin95)),
          ci95Upper: Math.round(count + margin95),
          marginOfError: `±${Math.round(margin95)}`,
          reliability: margin95 / count < 0.1 ? "high" : margin95 / count < 0.25 ? "moderate" : "low",
        };
      }).sort((a, b) => b.estimate - a.estimate);

      // Wage CI by sector
      const sectorWages: Record<string, number[]> = {};
      for (const spell of allSpells) {
        if (spell.monthlySalary && Number(spell.monthlySalary) > 0) {
          if (!sectorWages[spell.sector]) sectorWages[spell.sector] = [];
          sectorWages[spell.sector].push(Number(spell.monthlySalary));
        }
      }

      const wageCI = Object.entries(sectorWages).map(([sector, wages]) => {
        const n = wages.length;
        const mean = wages.reduce((s, v) => s + v, 0) / n;
        const variance = wages.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
        const stdDev = Math.sqrt(variance);
        const se = stdDev / Math.sqrt(n);
        const margin95 = zScore95 * se;
        const margin90 = zScore90 * se;
        return {
          sector,
          sampleSize: n,
          meanWage: Math.round(mean),
          standardDeviation: Math.round(stdDev),
          standardError: Math.round(se),
          ci95: { lower: Math.round(mean - margin95), upper: Math.round(mean + margin95), margin: `±L$${Math.round(margin95).toLocaleString()}` },
          ci90: { lower: Math.round(mean - margin90), upper: Math.round(mean + margin90), margin: `±L$${Math.round(margin90).toLocaleString()}` },
          coefficientOfVariation: Math.round((stdDev / mean) * 100),
          reliability: (se / mean) < 0.05 ? "high" : (se / mean) < 0.15 ? "moderate" : "low",
        };
      }).sort((a, b) => b.sampleSize - a.sampleSize);

      // Overall statistics with CI
      const allWages = allSpells.filter(s => s.monthlySalary && Number(s.monthlySalary) > 0).map(s => Number(s.monthlySalary));
      const overallMean = allWages.reduce((s, v) => s + v, 0) / allWages.length;
      const overallVar = allWages.reduce((s, v) => s + (v - overallMean) ** 2, 0) / (allWages.length - 1);
      const overallSE = Math.sqrt(overallVar) / Math.sqrt(allWages.length);

      res.json({
        overall: {
          totalRecords: allSpells.length,
          activeEmployment: totalActive,
          averageWage: Math.round(overallMean),
          wageCI95: {
            lower: Math.round(overallMean - zScore95 * overallSE),
            upper: Math.round(overallMean + zScore95 * overallSE),
            margin: `±L$${Math.round(zScore95 * overallSE).toLocaleString()}`,
          },
          sampleSize: allWages.length,
        },
        byCounty: employmentCI,
        bySector: wageCI,
      });
    } catch (error) {
      console.error("Error calculating confidence intervals:", error);
      res.status(500).json({ error: "Failed to calculate confidence intervals" });
    }
  });

  // 5. Methodology Documentation
  app.get("/api/statistical-rigor/methodology", async (_req, res) => {
    try {
      const allSpells = await storage.getEmploymentSpells();

      const methodologies = [
        {
          id: "employment-tracking",
          title: "Employment Spell Tracking",
          category: "Core Methodology",
          description: "Employment is measured through time-bound 'employment spells' — records with explicit start and end dates linked to verified employers. Each spell captures occupation (ISCO-08), industry (ISIC Rev.4), county, wage, and contract type.",
          formula: "Active Employment = Count of spells WHERE is_active = TRUE AND start_date ≤ TODAY",
          dataSource: `employment_spells table (${allSpells.length} records)`,
          limitations: "Depends on employer reporting compliance. Informal sector coverage may be incomplete. Self-employment not fully captured.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "wage-statistics",
          title: "Wage Statistics Calculation",
          category: "Core Methodology",
          description: "Average wages are computed from monthly_salary field in employment spells. Wages are reported in Liberian Dollars (LRD). Outliers beyond 1.5× IQR are flagged but included in calculations unless manually excluded.",
          formula: "Mean Wage = Σ(monthly_salary) / N; Median = value at P50; IQR = P75 - P25",
          dataSource: "monthly_salary field in employment_spells",
          limitations: "Self-reported wages may be inaccurate. Currency conversion not applied for USD-denominated positions. Part-time wages not normalized to full-time equivalents.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "quality-checks",
          title: "Automated Quality Checks",
          category: "Data Quality",
          description: "Four types of automated validation: (1) Duplicate detection finds overlapping spells for the same person-employer pair. (2) Impossible date detection flags end dates before start dates, future start dates, and spells exceeding 50 years. (3) Wage outlier detection uses the Interquartile Range (IQR) method. (4) Unusual employer size flags employers with employee counts >5× the median.",
          formula: "IQR Outlier: wage < Q1 - 1.5×IQR OR wage > Q3 + 1.5×IQR; Duplicate: person_id = same AND employer_id = same AND date_ranges_overlap",
          dataSource: "employment_spells and employers tables",
          limitations: "Duplicate detection may produce false positives for legitimate re-employment. IQR thresholds may need sector-specific calibration.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "sampling",
          title: "Survey Sampling Framework",
          category: "Statistical Methods",
          description: "Sample sizes are calculated using Cochran's formula for finite populations with 95% confidence level and 5% margin of error. Proportional allocation distributes sample sizes across counties and sectors based on their share of total employment. A minimum sample of 30 is enforced per stratum for statistical validity.",
          formula: "n₀ = (z² × p × q) / e²; n = n₀ / (1 + (n₀-1)/N); where z=1.96, p=0.5, e=0.05, N=stratum population",
          dataSource: "employment_spells distribution by county and sector",
          limitations: "Assumes simple random sampling within strata. Design effect not applied. Cluster effects from geographic sampling not modeled.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "seasonal-adjustment",
          title: "Seasonal Adjustment",
          category: "Statistical Methods",
          description: "Seasonal adjustment removes predictable seasonal patterns from employment time series to reveal underlying trends. Uses the ratio-to-moving-average method with a 13-month centered moving average. Seasonal indices are computed per sector, identifying peak and trough months for industries like agriculture and mining.",
          formula: "Seasonal Index (month m) = Average(actual_m / 13-month MA_m) across all years; Adjusted Value = Raw Value / Seasonal Index",
          dataSource: "Monthly employment counts from employment_spells start/end dates",
          limitations: "Requires at least 2 years of data for reliable indices. Calendar effects (holidays, variable month lengths) not separately modeled. Trading day adjustment not applied.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "confidence-intervals",
          title: "Confidence Intervals",
          category: "Statistical Methods",
          description: "95% confidence intervals are computed for all published statistics using the normal approximation. For proportions (employment rates), Wilson score intervals are used when sample sizes are small. Coefficient of variation (CV) classifies reliability: CV < 5% = high, 5-15% = moderate, >15% = low reliability.",
          formula: "CI = estimate ± z × SE; SE(mean) = σ/√n; SE(proportion) = √(p(1-p)/n); CV = (σ/mean) × 100%",
          dataSource: "Computed from all employment_spells and wage data",
          limitations: "Assumes normal distribution for large samples. Non-response bias not corrected. Bootstrap intervals may be more appropriate for skewed wage distributions.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "trust-score",
          title: "Trust Score System",
          category: "Data Quality",
          description: "Each employment spell receives a Trust Score (0-1) based on verification status through the three-layer verification system. Pending records start at 0.3, employer-verified at 0.5, enumerator-verified at 0.7, and fully ministry-verified at 1.0. Flagged records receive reduced scores.",
          formula: "Trust Score: pending=0.3, employer_verified=0.5, enumerator_verified=0.7, fully_verified=1.0, flagged=0.1, rejected=0.0",
          dataSource: "verification_status and trust_score fields in employment_spells",
          limitations: "Score thresholds are administrative decisions, not statistically derived. Does not account for partial verification or time decay.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        {
          id: "projections",
          title: "Employment Projections",
          category: "Forecasting",
          description: "Employment projections use linear trend analysis fitted to historical year-over-year creation rates. Only complete years of data are used to avoid partial-year bias. Projections are indicative and should not be used as definitive forecasts.",
          formula: "Trend = β₁ × year + β₀; where β₁ = Σ((xᵢ-x̄)(yᵢ-ȳ)) / Σ((xᵢ-x̄)²); Projected = trend value at target year",
          dataSource: "employment_spells creation rates by occupation and sector",
          limitations: "Linear model assumes constant growth rate. Does not account for economic shocks, policy changes, or structural breaks. Short data history limits projection reliability.",
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      ];

      res.json({ methodologies });
    } catch (error) {
      console.error("Error fetching methodology:", error);
      res.status(500).json({ error: "Failed to fetch methodology documentation" });
    }
  });

  // Get my tender submissions (bidder view)
  app.get("/api/my-tender-submissions", requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getTenderSubmissionsByBidder(req.session.user!.id);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching my tender submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  const aiRateLimits = new Map<string, { count: number; resetAt: number }>();
  const AI_RATE_LIMIT = 30;
  const AI_RATE_WINDOW = 60_000;

  function checkAiRateLimit(req: Request, res: Response): boolean {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = aiRateLimits.get(ip);
    if (!entry || now > entry.resetAt) {
      aiRateLimits.set(ip, { count: 1, resetAt: now + AI_RATE_WINDOW });
      return true;
    }
    if (entry.count >= AI_RATE_LIMIT) {
      res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
      return false;
    }
    entry.count++;
    return true;
  }

  app.post("/api/ai-assistant/chat", async (req: Request, res: Response) => {
    if (!checkAiRateLimit(req, res)) return;
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required" });
      }
      if (message.length > 2000) {
        return res.status(400).json({ error: "Message too long (max 2000 characters)" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      let dataContext = "";
      try {
        const [vacancyCount] = await db.select({ count: sql<number>`count(*)` }).from(vacancies);
        const [employerCount] = await db.select({ count: sql<number>`count(*)` }).from(employers);
        const [spellCount] = await db.select({ count: sql<number>`count(*)` }).from(employmentSpells);
        const [jobSeekerCount] = await db.select({ count: sql<number>`count(*)` }).from(jobSeekerProfiles);

        const recentVacancies = await db.select({
          title: vacancies.title,
          county: vacancies.county,
          sector: vacancies.sector,
          wageMin: vacancies.wageMin,
          wageMax: vacancies.wageMax,
        }).from(vacancies).where(sql`${vacancies.status} = 'open'`).limit(10);

        dataContext = `\n\nLIVE DATA CONTEXT:
- Total registered employers: ${employerCount.count}
- Total employment spells tracked: ${spellCount.count}
- Active job vacancies: ${vacancyCount.count}
- Registered job seekers: ${jobSeekerCount.count}
- Recent open vacancies: ${recentVacancies.map(v => `${v.title} in ${v.county} (${v.sector}${v.wageMin ? `, LRD ${v.wageMin}-${v.wageMax}` : ""})`).join("; ")}`;
      } catch (e) {
        console.error("Error fetching live data for AI context:", e);
      }

      const systemPrompt = `You are the LiJOBS AI Assistant for Liberia's Ministry of Labor. LiJOBS (Liberia Jobs Observatory System) is the national employment tracking platform.

CORE CAPABILITIES YOU HELP WITH:
1. JOBS & VACANCIES: Browse open positions, filter by county/sector/type. Employers post through their dashboard.
2. REGISTRATION: Users register as Employer, Individual (job seeker), or other roles via Get Started > Register. Accounts need admin approval.
3. LOGIN: Via Get Started > Sign In. Demo accounts available for testing.
4. EMPLOYMENT REPORTING: Report employment spells individually or bulk upload via Excel.
5. GRIEVANCE SYSTEM: File complaints (wage disputes, discrimination, etc.) without an account. Track via reference number.
6. WORKPLACE SAFETY: Report incidents anonymously. View safety statistics dashboard.
7. TRAINING & COURSES: Browse course catalog with lessons, quizzes, certifications. Open enrollment.
8. PUBLIC EMPLOYMENT CENTRES (PECs): Located in all 15 counties - Bomi, Bong, Gbarpolu, Grand Bassa, Grand Cape Mount, Grand Gedeh, Grand Kru, Lofa, Margibi, Maryland, Montserrado, Nimba, River Cess, River Gee, Sinoe.
9. DATA PORTAL: National employment statistics, county-level data, sector analysis. Export as Excel/CSV.
10. JOBS OBSERVATORY: Tracks employment spells with 3-layer verification (employer > enumerator > ministry) and trust scores.
11. LABOUR MARKET INDICATORS: Unemployment, employment, underemployment trends by county and sector.
12. ECONOMIC INDICATORS: Consumer price index, cost of living by county, wage affordability analysis.
13. TENDERS & BIDDING: Browse active tenders, submit bids through employer dashboard.
14. KNOWLEDGE BASE: Policy documents, research reports, publications.
15. JOB MATCHING: AI-powered matching of job seekers to vacancies based on skills, location, experience.
16. OCCUPATIONAL ECONOMICS: Wage analysis, demand trends, skills gap, employment projections, safety stats by occupation.
17. STATISTICAL RIGOR: Data quality checks, sampling frameworks, seasonal adjustment, confidence intervals.
${dataContext}

RESPONSE GUIDELINES:
- Be warm, professional, and concise (2-4 sentences typical).
- When users ask about jobs, mention specific vacancies from the live data if available.
- Guide users to the right page/feature for their needs.
- For technical issues, suggest contacting Ministry of Labor support.
- You represent the Government of Liberia's Ministry of Labor.
- Always be helpful and encouraging about Liberia's economic development.

CONVERSATION CLOSING:
- When the user says farewell words like "thank you", "thanks", "bye", "goodbye", "that's all", "I'm done", or similar closing phrases, respond with a warm goodbye and append the exact token [CLOSE_SESSION] at the very end of your response (after your farewell message). This signals the system to end the conversation.
- If the user says "thank you" but also asks a follow-up question in the same message, answer the question and do NOT append [CLOSE_SESSION].
- Only append [CLOSE_SESSION] when the user is clearly done and not asking anything new.`;

      const chatMessages: Array<{role: "system" | "user" | "assistant", content: string}> = [
        { role: "system", content: systemPrompt }
      ];

      if (history && Array.isArray(history)) {
        for (const msg of history.slice(-10)) {
          if (msg.role === "user" || msg.role === "assistant") {
            chatMessages.push({ role: msg.role, content: msg.text || msg.content || "" });
          }
        }
      }

      chatMessages.push({ role: "user", content: message });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Could you try rephrasing your question?";
      res.json({ reply });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "AI chat failed", reply: "I'm having trouble connecting right now. Please try again in a moment." });
    }
  });

  app.post("/api/ai-assistant/tts", async (req: Request, res: Response) => {
    if (!checkAiRateLimit(req, res)) return;
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }
      if (text.length > 1000) {
        return res.status(400).json({ error: "text too long" });
      }
      const audioBuffer = await textToSpeech(text);
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Text-to-speech failed" });
    }
  });

  app.post("/api/ai-assistant/stt", audioUpload.single("audio"), async (req: Request, res: Response) => {
    if (!checkAiRateLimit(req, res)) return;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "audio file is required" });
      }
      const transcript = await speechToText(req.file.buffer, req.file.originalname || "audio.webm");
      res.json({ text: transcript });
    } catch (error: any) {
      console.error("STT error:", error);
      res.status(500).json({ error: "Speech-to-text failed" });
    }
  });

  return httpServer;
}
