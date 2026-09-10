import { db } from "./db";
import { trainingProviders, courses, courseLessons, courseQuizQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const MOL_PROVIDER_ID = "mol-training-academy-001";

const ministryCoursesData = [
  {
    title: "Data Collection & Entry for Enumerators",
    description: "Step-by-step training for Ministry staff and enumerators on how to collect, enter, and verify employment data correctly using LiJOBS. Covers field data collection protocols, employment spell creation, data quality standards, and common errors to avoid.",
    providerId: MOL_PROVIDER_ID,
    durationWeeks: 2,
    cost: 0,
    currency: "LRD",
    iscoCode: "3313",
    skillsCovered: ["Data Collection", "Data Entry", "Employment Spells", "Field Enumeration", "Data Quality"],
  },
  {
    title: "Statistical Literacy for Ministry Officials",
    description: "Courses explaining what labour market numbers mean, how to read charts, interpret trends, and confidently brief the Minister or present to international partners like ILO, World Bank, and UNDP.",
    providerId: MOL_PROVIDER_ID,
    durationWeeks: 3,
    cost: 0,
    currency: "LRD",
    iscoCode: "2120",
    skillsCovered: ["Statistics", "Data Interpretation", "Chart Reading", "Trend Analysis", "Report Briefing"],
  },
  {
    title: "LiJOBS System Training — Complete Platform Guide",
    description: "Interactive guide on how to use every feature of LiJOBS — from the Jobs Observatory and Labour Exchange to Grievances, Knowledge Base, Reports, and the Director Dashboard. Covers all user roles.",
    providerId: MOL_PROVIDER_ID,
    durationWeeks: 1,
    cost: 0,
    currency: "LRD",
    iscoCode: "3512",
    skillsCovered: ["LiJOBS Platform", "System Navigation", "Report Generation", "Dashboard Usage", "Role Management"],
  },
  {
    title: "Verification & Trust Score Procedures",
    description: "Training on the three-layer employment verification workflow — employer sign-off, enumerator field check, and director approval. Covers trust score calculation, flagging suspicious records, and handling disputes.",
    providerId: MOL_PROVIDER_ID,
    durationWeeks: 2,
    cost: 0,
    currency: "LRD",
    iscoCode: "3313",
    skillsCovered: ["Verification", "Trust Score", "Quality Assurance", "Dispute Resolution", "Audit Trail"],
  },
  {
    title: "Economic Indicators & Occupational Analytics",
    description: "Advanced training on interpreting CPI data, wage affordability analysis, occupational demand trends, skills gap analysis, and employment projections. For senior Ministry staff and the Director of Statistics.",
    providerId: MOL_PROVIDER_ID,
    durationWeeks: 3,
    cost: 0,
    currency: "LRD",
    iscoCode: "2120",
    skillsCovered: ["CPI Analysis", "Wage Analysis", "Labour Market Indicators", "Occupational Economics", "Statistical Rigor"],
  },
];

interface LessonData { title: string; content: string; durationMinutes: number; }
interface QuizData { question: string; options: string[]; correctIndex: number; explanation: string; }

const ministryLessonData: Record<string, LessonData[]> = {
  "Data Collection & Entry for Enumerators": [
    {
      title: "Introduction to Field Data Collection",
      durationMinutes: 20,
      content: `As a Ministry enumerator or data entry staff, your work is the foundation of Liberia's official employment statistics. Every record you enter into LiJOBS becomes part of the national picture of job creation — used by the Minister, international partners, and policymakers to make decisions that affect millions of Liberians.

This course will teach you the correct procedures for collecting employment data in the field and entering it into the LiJOBS system. Accuracy is critical: a single incorrect entry can distort statistics for an entire county.

**What is an Employment Spell?**
An employment spell is a period of time that a person works for a specific employer in a specific job. It has a start date, and may have an end date if the person has left the job. Every employment spell in LiJOBS tracks:
- The worker's identity (name, age, gender, county, district)
- The employer (company name, sector, registration status)
- The job details (title, ISCO occupation code, ISIC industry code)
- Dates (start date, end date if applicable)
- Employment type (formal/informal, full-time/part-time, seasonal)
- Wage information (monthly wage, currency)

**Field Collection Protocol**
When visiting an employer or worksite:
1. Introduce yourself with your Ministry ID and explain the purpose of data collection
2. Request to speak with the HR manager or business owner
3. Collect the employer's registration details first
4. For each worker, record all required fields — never leave fields blank
5. Cross-check worker counts with payroll records where available
6. Have the employer sign the verification form
7. Note any discrepancies or concerns in the comments field

**Common Mistakes to Avoid**
- Entering approximate dates instead of exact dates — always ask for the actual start date
- Using the wrong ISCO code — refer to the code lookup tool in LiJOBS
- Skipping the district field — every record must include both county AND district
- Entering wages in the wrong currency — confirm whether it's LRD or USD
- Duplicating records for the same worker at the same employer`
    },
    {
      title: "Creating Employment Spells in LiJOBS",
      durationMinutes: 25,
      content: `This lesson walks you through the step-by-step process of creating an employment spell record in LiJOBS.

**Step 1: Log In and Navigate**
Log into LiJOBS with your enumerator credentials. From your dashboard, click "Report New Jobs" to begin creating employment records.

**Step 2: Enter Worker Details**
- Full name: Enter the worker's legal name exactly as it appears on their ID
- Gender: Select from the dropdown
- Date of birth: Enter to calculate age and track youth employment
- County and District: Select the county where the worker is employed (not where they live)
- Phone number: Optional but helps for verification callbacks

**Step 3: Enter Employer Details**
- If the employer already exists in LiJOBS, search by name and select them
- If new, you'll need to create the employer record first with their registration details
- Verify the employer's sector (public, private, NGO, international organization)

**Step 4: Enter Job Details**
- Job title: Use the worker's actual job title (e.g., "Security Guard", not just "Staff")
- ISCO-08 code: Use the occupation code lookup. For example, "Security Guard" is 5414
- ISIC Rev.4 code: Use the industry code lookup. For example, "Private Security" is 8010
- Employment type: Formal (has contract, registered) or Informal (no contract, unregistered)
- Work pattern: Full-time, part-time, or seasonal
- Monthly wage: Enter the exact amount and select the correct currency

**Step 5: Enter Dates**
- Start date: The date the worker began this specific job (not when they joined the company if they changed roles)
- End date: Leave blank if the worker is still employed. Only enter an end date if the worker has left

**Step 6: Submit and Verify**
- Review all fields before submitting
- After submission, the record enters the verification pipeline with "pending" status
- The employer will be asked to verify the record
- An enumerator (possibly you) will conduct a field check
- The Director of Statistics gives final approval

**Data Quality Checks**
LiJOBS automatically runs quality checks on your submissions:
- Duplicate detection: If a similar record already exists, you'll see a warning
- Date validation: Start date cannot be in the future; end date cannot be before start date
- Wage outlier detection: Extremely high or low wages are flagged for review
- Missing fields: Required fields that are empty will block submission`
    },
    {
      title: "Quality Assurance and Error Correction",
      durationMinutes: 18,
      content: `Data quality is what separates trustworthy official statistics from unreliable guesswork. As a data collector, you are the first line of defense against bad data entering the national system.

**The Data Quality Score**
LiJOBS calculates a data quality score for every batch of records. This score considers:
- Completeness: Are all required fields filled in?
- Consistency: Do the dates, codes, and values make sense together?
- Uniqueness: Are there duplicate or overlapping records?
- Timeliness: Were records entered within the expected timeframe?

Your goal should be a data quality score above 90% for every submission batch.

**Common Data Quality Issues**

1. **Duplicate Records**
   The most common error. This happens when:
   - The same worker is entered twice at the same employer
   - A worker who changed job titles is entered as a new record instead of updating the existing one
   - Two enumerators visit the same worksite and both enter the same workers
   
   Prevention: Always search for existing records before creating new ones.

2. **Impossible Dates**
   - Start dates in the future
   - End dates before start dates
   - Workers supposedly employed before they were born
   
   Prevention: Cross-check dates with employer records and worker IDs.

3. **Wage Outliers**
   - Monthly wages of $50,000 USD (probably entered in LRD but marked as USD)
   - Monthly wages of $1 (probably a data entry error)
   
   Prevention: Verify currency and double-check amounts. A typical monthly wage in Liberia ranges from 5,000 to 100,000 LRD depending on the sector and position.

4. **Incorrect Occupation/Industry Codes**
   - Using generic codes instead of specific ones
   - Selecting the wrong code due to similar-sounding occupations
   
   Prevention: Use the LiJOBS code lookup tool and read the code descriptions carefully.

**Correcting Errors**
If you discover an error in a submitted record:
1. Do NOT create a new record to replace it
2. Find the original record using the search function
3. Click "Edit" and correct the specific field
4. Add a note explaining what was changed and why
5. The record will need to go through re-verification

**Reporting Data Collection Issues**
If you encounter situations in the field that prevent accurate data collection (uncooperative employers, inaccessible worksites, suspected fraud), report these through the Grievance System in LiJOBS with the category "Data Collection Issue."`
    },
  ],

  "Statistical Literacy for Ministry Officials": [
    {
      title: "Understanding Labour Market Statistics",
      durationMinutes: 25,
      content: `As a Ministry official, you will regularly need to understand, explain, and present labour market statistics to the Minister, Cabinet, Parliament, and international partners such as the ILO, World Bank, and UNDP. This course ensures you can do so with confidence and accuracy.

**Key Labour Market Indicators**

1. **Employment Rate**
   The percentage of the working-age population (15-64) that is currently employed. In LiJOBS, this is calculated as:
   Employment Rate = (Active Employment Spells / Working-Age Population) × 100
   
   A rising employment rate means more people are finding work. But context matters — if the population is growing faster than employment, even rising absolute numbers can mean a falling rate.

2. **Unemployment Rate**
   The percentage of the labour force that is actively seeking work but cannot find it. This is different from the "not employed" rate because it excludes people who are not looking for work (students, retirees, homemakers).
   
   Unemployment Rate = (Unemployed Job Seekers / Labour Force) × 100
   where Labour Force = Employed + Unemployed

3. **Underemployment Rate**
   People who are employed but working fewer hours than they want, or in jobs below their skill level. This is harder to measure and often overlooked, but it reveals hidden labour market problems.

4. **Job Creation Rate**
   New employment spells created in a given period. LiJOBS tracks this precisely because every new spell has a start date. Month-over-month and year-over-year comparisons show whether job creation is accelerating or slowing.

5. **Informality Rate**
   The percentage of employment that is informal (no contract, no social protection). Reducing informality is a key policy goal.

**Formal vs. Informal Employment**
Formal employment includes workers with written contracts, registered businesses, and social security contributions. Informal employment covers unregistered businesses, casual workers, and subsistence activities. LiJOBS tracks both, giving Liberia a complete picture that most countries in the region lack.

**Sectoral Breakdown**
Employment can be analyzed by sector: Agriculture, Mining, Manufacturing, Construction, Services, Public Administration, etc. Each sector has different characteristics — agriculture is often seasonal and informal, while public administration is formal and stable. Understanding sectoral composition helps policymakers target interventions.`
    },
    {
      title: "Reading Charts and Interpreting Trends",
      durationMinutes: 22,
      content: `Charts and graphs are the primary way that labour market data is communicated. Being able to read them correctly is essential for any Ministry official.

**Types of Charts in LiJOBS**

1. **Bar Charts**
   Used to compare values across categories (e.g., employment by county, vacancies by sector). The height or length of each bar represents the value. When reading bar charts:
   - Always check the y-axis scale — a chart starting at 100 instead of 0 can make small differences look dramatic
   - Look for the tallest and shortest bars to identify leaders and laggards
   - Compare related bars (e.g., formal vs. informal in each county)

2. **Line Charts**
   Used to show trends over time (e.g., monthly job creation, quarterly unemployment rate). When reading line charts:
   - An upward slope means the value is increasing
   - A downward slope means decreasing
   - A flat line means stable
   - Sudden spikes or dips deserve investigation — are they real or data quality issues?

3. **Pie Charts**
   Used to show composition (e.g., what percentage of employment is in each sector). When reading pie charts:
   - Larger slices mean larger shares
   - Very small slices may be hard to read — look at the legend and labels
   - Pie charts should always add up to 100%

4. **Scatter Plots**
   Used to show relationships between two variables (e.g., wage levels vs. education, county size vs. employment). When reading scatter plots:
   - Points clustered together suggest similarity
   - Points far from the cluster are outliers worth investigating
   - An upward trend from left to right suggests a positive correlation

**Common Mistakes in Chart Interpretation**
- **Correlation vs. Causation**: Just because two things move together doesn't mean one causes the other. Employment might rise at the same time as rainfall, but rain doesn't create jobs.
- **Cherry-Picking Time Periods**: Choosing a start date that makes trends look better or worse than they really are. Always use consistent time periods.
- **Ignoring Sample Size**: A 50% increase sounds dramatic, but if it's from 2 to 3, it's not meaningful.
- **Seasonal Effects**: Many indicators have natural seasonal patterns. Employment in agriculture rises during planting and harvest seasons. Always compare the same month year-over-year, not consecutive months.

**The Seasonal Adjustment Feature**
LiJOBS includes automatic seasonal adjustment (available in the Statistical Rigor section). This removes predictable seasonal patterns to reveal the underlying trend. When presenting data, always clarify whether numbers are seasonally adjusted or raw.`
    },
    {
      title: "Presenting Data to Stakeholders",
      durationMinutes: 20,
      content: `Effective data presentation is a critical skill for Ministry officials. Whether briefing the Minister, presenting to Parliament, or meeting with ILO representatives, you need to communicate data clearly and persuasively.

**Know Your Audience**
Different audiences need different levels of detail:
- **The Minister**: Wants headlines and key takeaways. Lead with the most important number and what it means for policy. Keep it to 3-5 key points.
- **Parliament/Cabinet**: Wants to see progress on commitments. Show before-and-after comparisons and county-level breakdowns.
- **International Partners (ILO, World Bank, UNDP)**: Want methodology and data quality assurance. They'll ask about sample sizes, confidence intervals, and data sources. Reference LiJOBS's Statistical Rigor section.
- **Media/Public**: Want simple, relatable numbers. Use comparisons: "1 in 5 Liberians found new employment this year."

**The Data Story Framework**
Every data presentation should tell a story with three parts:
1. **Where We Were**: The baseline or starting point
2. **Where We Are**: Current numbers and trends
3. **Where We're Going**: Projections and policy implications

Example: "Last year, Liberia had 45,000 formal employment records. Today, we have 62,000 — a 38% increase. Based on current trends and the new mining investments in Nimba County, we project 80,000 by end of next year."

**Using LiJOBS Reports**
LiJOBS can generate export-ready reports for any presentation:
- Go to Reports > Download Reports
- Select the data type (Employment Spells, Vacancies, Employers, Job Seekers)
- Apply filters (date range, county, sector)
- Export as Excel or CSV
- Use the Labour Market Indicators dashboard for ready-made charts

**Confidence and Methodology**
When presenting LiJOBS data, you can confidently state:
- "These figures come from LiJOBS, the national Jobs Observatory System with verified administrative records"
- "Each record goes through a three-layer verification process: employer sign-off, enumerator field check, and director approval"
- "Our data quality score is [X]% based on automated checks for duplicates, date consistency, and wage outliers"
- "The methodology is publicly available on the LiJOBS Methodology page for full transparency"

This level of rigour and transparency is what international partners expect and what sets LiJOBS apart from survey-based estimates.`
    },
  ],

  "LiJOBS System Training — Complete Platform Guide": [
    {
      title: "Navigating the LiJOBS Platform",
      durationMinutes: 20,
      content: `Welcome to LiJOBS — the Liberia Jobs Observatory System. This lesson will teach you how to navigate the platform and find what you need quickly, regardless of your role.

**Logging In**
Visit the LiJOBS website and click "Login" in the top navigation bar. Enter your email and password. If you don't have an account, click "Register" and fill in your details. Your role (admin, ministry, employer, enumerator, individual) determines which features you can access.

**The Dashboard**
After logging in, you'll see your personalized dashboard with:
- Quick action buttons for your most common tasks
- Summary statistics relevant to your role
- Training videos assigned to your role

**Main Navigation**
The top navigation bar has several sections:

1. **Home**: The public-facing landing page with national statistics
2. **About**: Information about LiJOBS and the Ministry of Labour
3. **Data Portal**: Employment data, statistics, and analytics tools
   - Jobs Observatory: Browse employment records
   - Labour Market Indicators: National and county-level dashboards
   - Occupational Economics: Wage and demand analytics
   - Statistical Rigor: Data quality and methodology (ministry/admin only)
4. **Resources**: Tools and services
   - Find Jobs: Browse job vacancies
   - Bids & Tenders: Government procurement opportunities
   - Job Matching: AI-powered job matching for seekers
   - Training Providers: Accredited training centres
   - Course Catalog: Training courses with lessons and quizzes
   - Employment Centres: PEC locations across all 15 counties
   - Reports: Downloadable data exports
   - Knowledge Base: Policy documents and research
   - Workplace Safety: Incident reporting and statistics
   - Grievance System: File and track complaints
   - Methodology: How all statistics are calculated
5. **Contact**: Ministry contact information

**Role-Specific Features**
- **Employers** see vacancy management, application review, and tender tools
- **Enumerators** see data entry tools and field assignment tracking
- **Ministry Staff** see verification tools, analytics, and administrative functions
- **Directors** see the comprehensive Director Dashboard with system-wide statistics
- **Individuals** see job search, application tracking, and course enrollment`
    },
    {
      title: "Key Features Walkthrough",
      durationMinutes: 25,
      content: `This lesson covers the core features of LiJOBS that every staff member should know.

**Jobs Observatory**
The heart of LiJOBS. The Observatory tracks every employment spell in Liberia — who is working, where, for whom, doing what, and for how long. 
- Browse employment records with filters for county, sector, occupation, and verification status
- Each record shows the worker, employer, job details, dates, and trust score
- The trust score (0 to 1) indicates how well-verified a record is

**Labour Market Indicators**
The comprehensive dashboard at /labour-market-indicators shows:
- Unemployment, employment, and underemployment rates by county
- Gender and urban/rural breakdowns
- Sector composition with pie charts
- Time series trends with combined bar and line charts
- Scatter plots showing county-level relationships
- CSV export for all data

**Labour Exchange**
The job matching marketplace:
- Employers post vacancies with job requirements
- Job seekers browse and apply
- The matching algorithm scores seekers against vacancies based on skills, location, sector, and experience
- Employers review applications and manage the hiring process

**Grievance System**
Citizens can file complaints without needing an account:
- Categories: wage disputes, unsafe conditions, child labour, discrimination, wrongful termination
- Each complaint gets a tracking number
- Ministry staff can view, investigate, and resolve complaints

**Knowledge Base**
The research library stores:
- Policy documents
- Research reports
- ILO publications
- Ministry guidelines
- Anyone can browse; ministry staff can upload new documents

**Workplace Safety**
- Citizens report workplace incidents (injuries, fatalities, near-misses)
- The safety dashboard shows aggregate statistics by sector and county
- Helps identify high-risk industries for targeted inspections

**Reports & Exports**
Generate downloadable reports:
- Employment spells, vacancies, employers, job seekers, applications
- Filter by date range, county, sector
- Export as Excel or CSV for use in other tools`
    },
    {
      title: "Administrative Functions and User Management",
      durationMinutes: 18,
      content: `This lesson covers administrative features available to ministry staff and system administrators.

**User Management (Admin Only)**
Accessible from Dashboard > User Management:
- View all registered users with their roles
- Search and filter users by name, email, or role
- Assign or change user roles (admin, ministry, employer, enumerator, individual)
- Deactivate accounts that are no longer needed

**Verification Workflow**
Ministry staff and admins manage the three-layer verification pipeline:
1. **Employer Verification**: The employer confirms that the worker is/was employed
2. **Enumerator Verification**: A field officer physically verifies the employment
3. **Director Approval**: The Director of Statistics gives final sign-off

From Dashboard > Verify Records:
- See all pending records awaiting verification
- Filter by county, district, and status
- Approve, flag, or reject records with comments
- Track verification rates by county and officer

**Director Dashboard**
The Director of Statistics has a comprehensive dashboard showing:
- System-wide statistics across all 15 counties
- Verification pipeline status (pending, signed, verified, flagged, rejected)
- Overdue alerts for records awaiting verification for 3+ days
- Officer performance metrics (verification rates, pending counts)
- County breakdown with employment, vacancies, and verification data

**Bulk Upload**
For mass data import:
- Go to Resources > Bulk Upload
- Download the Excel template for the data type (employment spells, employers, vacancies)
- Fill in the template following the column headers exactly
- Upload the completed file
- LiJOBS validates all records and reports any errors
- Valid records are imported; errors are listed for correction

**Economic Indicators Management**
Ministry and enumerator staff enter consumer price data:
- Go to /price-entry to record prices for a basket of 20 goods
- Select the county and month
- Enter current prices for each item
- The system automatically calculates CPI and cost-of-living indices

**Training Video Management (Admin Only)**
Admins can generate and manage AI-powered training videos:
- Dashboard > Video Management
- Create scripts for different audiences (admin, ministry, employer, enumerator)
- Generate videos with AI avatars
- Videos appear on the relevant user's dashboard`
    },
  ],

  "Verification & Trust Score Procedures": [
    {
      title: "The Three-Layer Verification System",
      durationMinutes: 22,
      content: `LiJOBS uses a three-layer verification system to ensure that every employment record in the national database is accurate and trustworthy. This system is what makes LiJOBS data reliable enough for official statistics, international reporting, and policy decisions.

**Why Verification Matters**
Without verification, anyone could enter false employment records — inflating job creation numbers, claiming workers who don't exist, or misrepresenting employment conditions. Verification prevents fraud, ensures accuracy, and builds trust in the system.

**Layer 1: Employer Verification (Sign-Off)**
After an employment spell is entered into LiJOBS (either by the employer directly or by an enumerator):
- The employer receives a notification to verify the record
- They log into LiJOBS and review the details: worker name, job title, dates, wage
- They confirm ("sign off") that the information is correct, or flag discrepancies
- This is the first layer of assurance that the employment actually exists

What to check during employer verification:
- Is this person actually employed by this company?
- Is the job title correct?
- Are the start/end dates accurate?
- Is the wage information correct?
- Is the employment type (formal/informal, full/part-time) accurate?

**Layer 2: Enumerator Field Verification**
After employer sign-off, an enumerator visits the worksite to independently verify:
- Does the business exist at the registered address?
- Is the worker physically present at the worksite?
- Do the working conditions match what was reported?
- Are there any discrepancies between what was reported and what is observed?

The enumerator records their findings in LiJOBS:
- Verified: Everything checks out
- Flagged: Some discrepancies noted (recorded in comments)
- Rejected: Record appears to be fraudulent

**Layer 3: Director Approval**
The Director of Statistics (or authorized delegate) reviews:
- Records that passed both employer and enumerator verification
- Flagged records that need further investigation
- Statistical anomalies detected by automated quality checks

The Director can:
- Approve: Record becomes "fully verified" with maximum trust score
- Send back: Return to previous layer for re-verification
- Reject: Remove from active statistics with documented reason

**Verification Timelines**
- Employer verification: Expected within 48 hours of record creation
- Enumerator field check: Expected within 5 business days
- Director approval: Expected within 3 business days
- Records overdue for verification appear on the Director Dashboard alerts`
    },
    {
      title: "Understanding and Using Trust Scores",
      durationMinutes: 20,
      content: `Every employment record in LiJOBS has a trust score — a number between 0 and 1 that indicates how reliable the record is. Trust scores help the system (and users) distinguish between well-verified records and records that still need attention.

**How Trust Scores Are Calculated**
The trust score is a weighted combination of several factors:

1. **Verification Status (40% weight)**
   - Pending: 0.1
   - Employer verified: 0.4
   - Enumerator verified: 0.7
   - Fully verified (director approved): 1.0
   - Flagged: 0.2
   - Rejected: 0.0

2. **Data Completeness (20% weight)**
   - All required fields filled: 1.0
   - Missing non-critical fields: 0.7
   - Missing critical fields: 0.3

3. **Consistency (20% weight)**
   - Dates are logical: +0.3
   - Wage is within expected range: +0.3
   - ISCO/ISIC codes match job title: +0.2
   - No duplicate records: +0.2

4. **Source Reliability (20% weight)**
   - Entered by verified employer: 0.9
   - Entered by trained enumerator: 0.8
   - Bulk upload from registered source: 0.7
   - Self-reported by individual: 0.5

**Trust Score Interpretation**
- 0.8 - 1.0: High confidence — can be used in official statistics
- 0.5 - 0.79: Moderate confidence — included with caveats
- 0.3 - 0.49: Low confidence — needs further verification
- Below 0.3: Unreliable — excluded from official statistics, flagged for review

**Using Trust Scores in Your Work**
As a Ministry staff member:
- Focus verification efforts on records with low trust scores
- When presenting statistics, report the average trust score as a quality indicator
- Use the Statistical Rigor dashboard to see overall data quality metrics
- When exporting data, you can filter by minimum trust score to ensure quality

**Improving Trust Scores**
Records with low trust scores need:
1. Missing field completion — fill in any blank required fields
2. Verification progression — move through employer and enumerator verification
3. Consistency fixes — correct any date or wage anomalies
4. Source documentation — attach supporting documents (contracts, payslips)

**The National Average Trust Score**
The Director Dashboard shows the system-wide average trust score. This is a key performance indicator for the Ministry's data collection efforts. The target should be an average trust score above 0.7, meaning most records have been through at least enumerator verification.`
    },
    {
      title: "Handling Flags, Disputes, and Edge Cases",
      durationMinutes: 18,
      content: `Not every employment record is straightforward. This lesson covers how to handle flagged records, disputes between parties, and unusual employment situations.

**Flagged Records**
A record can be flagged at any verification layer. Common reasons for flagging:

1. **Employer Disputes Worker's Claim**
   - The employer says the worker was never employed there
   - Action: Contact the worker for supporting evidence (contract, pay stub, witness)
   - If unresolved, escalate to the Grievance System

2. **Enumerator Cannot Locate Business**
   - The business address doesn't exist or the business has closed
   - Action: Check if the business has moved; contact the employer by phone
   - If confirmed closed, update the employment spell with an end date

3. **Wage Anomaly**
   - The reported wage is extremely high or low for the occupation and county
   - Action: Contact the employer to confirm the wage
   - If confirmed unusual, add a note explaining why (e.g., "expatriate technical advisor" for high wages)

4. **Duplicate Suspicion**
   - The automated quality check found a similar record
   - Action: Review both records side by side
   - If truly duplicate, merge them (keep the one with more complete data)
   - If different (e.g., same person, different job), mark both as verified

**Disputes Between Employer and Worker**
When an employer and worker disagree about employment details:
1. Document both parties' claims in the record notes
2. Request supporting documentation from both sides
3. If the dispute involves wages or conditions, refer to the Grievance System
4. If the dispute is about dates or job title, use available evidence to determine the most accurate record
5. Add a note to the record explaining the resolution

**Edge Cases**

**Seasonal Employment**: Workers who are employed for specific seasons (farming, fishing) should have separate employment spells for each season with clear start and end dates. Do not create a single continuous spell.

**Multiple Jobs**: A person can have multiple active employment spells if they hold multiple jobs simultaneously. Each job is a separate record. Ensure the primary/secondary distinction is noted.

**Informal Employment**: For workers without contracts or formal registration, use available evidence: witness statements, mobile money payment records, photos of the worksite. Note the evidence source in the record.

**Self-Employment**: Individuals who run their own businesses can be recorded as both the employer and the worker. Create the employer record first, then the employment spell.

**Cross-Border Employment**: Liberians working in neighbouring countries (Sierra Leone, Guinea, Côte d'Ivoire) for Liberian-registered companies can be recorded. Note the actual work location in the comments.

**Government Employment**: Public sector workers should be verified through the Civil Service Agency records where possible, providing an additional data source for cross-referencing.`
    },
  ],

  "Economic Indicators & Occupational Analytics": [
    {
      title: "Consumer Price Index and Cost of Living",
      durationMinutes: 25,
      content: `The Consumer Price Index (CPI) is one of the most important economic indicators tracked by LiJOBS. It measures how the prices of everyday goods and services change over time, directly affecting the cost of living for Liberian workers and families.

**What is the CPI?**
The CPI measures the average change in prices paid by consumers for a basket of goods and services. LiJOBS tracks a basket of 20 common items including:
- Rice (25kg bag)
- Palm oil (1 gallon)
- Cassava (1 bundle)
- Fish (dried, 1 pound)
- Chicken (whole)
- Sugar (1 kg)
- Cooking charcoal (1 bag)
- Gasoline (1 gallon)
- Cement (1 bag)
- Transport (motorcycle taxi fare)
- And more everyday essentials

**How CPI is Calculated**
For each county, each month:
1. Enumerators record the current price of each item in the basket
2. The current month's total basket cost is compared to the base period cost
3. CPI = (Current Period Cost / Base Period Cost) × 100
4. A CPI of 105 means prices have risen 5% from the base period

**County-Level Price Differences**
Prices vary significantly across Liberia's 15 counties. Factors include:
- Distance from Monrovia (import port)
- Road conditions and transportation costs
- Local supply and demand
- Seasonal agricultural patterns

LiJOBS displays these differences on the Economic Indicators dashboard, allowing policymakers to see which counties have the highest cost of living and why.

**Entering Price Data**
Ministry and enumerator staff enter price data at /price-entry:
1. Select the county and month
2. For each of the 20 items, enter the current market price
3. Use the "standard unit" column to ensure consistent measurement (e.g., "25kg bag" for rice, not just "rice")
4. Note any items that were unavailable in that county/month
5. Submit for automatic CPI calculation

**Wage vs. Cost of Living Analysis**
LiJOBS combines CPI data with wage data from employment spells to calculate affordability:
- Real Wage = Nominal Wage / (CPI / 100)
- Purchasing Power Parity across counties
- "How many hours of work at the average wage does it take to buy the basic basket?"
- This analysis identifies counties where workers are struggling most with cost of living

This information is critical for minimum wage policy, social protection targeting, and poverty reduction strategies.`
    },
    {
      title: "Occupational Demand Trends and Skills Gap Analysis",
      durationMinutes: 22,
      content: `Understanding which occupations are growing, which are declining, and where skills gaps exist is essential for education policy, training investment, and workforce development.

**Occupational Demand Trends**
LiJOBS tracks demand for different occupations over time by analyzing:
- New employment spells created each month by ISCO occupation code
- Active vacancy postings by occupation
- Spell terminations by occupation (declining industries)

The Occupational Economics dashboard (/occupational-economics) shows:
- Which occupations have the most new hires
- Month-over-month growth rates by occupation
- Occupations with rising vs. falling demand
- County-level demand variations

**Reading the Demand Trend Charts**
- Green (upward trending): Occupation is growing — more new hires each month
- Red (downward trending): Occupation is declining — fewer new hires or increasing terminations
- Blue (stable): Occupation demand is relatively constant

Example interpretation: "Security guards (ISCO 5414) saw a 23% increase in new employment spells in the last quarter, driven primarily by Montserrado County. This suggests growing demand for private security services."

**Skills Gap Analysis**
The skills gap is the difference between what employers need and what job seekers offer. LiJOBS measures this by comparing:
- Skills listed in active vacancy postings (employer demand)
- Skills listed in job seeker profiles (worker supply)

The gap analysis shows:
- **Surplus skills**: More job seekers have these skills than employers need (e.g., "Basic Computer Skills" — many people have this, not enough demand)
- **Deficit skills**: Employers need these skills but few job seekers have them (e.g., "Welding", "Electrical Installation" — high demand, low supply)
- **Training opportunities**: Skills with the largest deficits where training programs could fill the gap

**Using Skills Gap Data for Policy**
This data directly informs:
1. **Training Investment**: Which courses should receive government funding?
2. **Curriculum Development**: What should vocational schools teach?
3. **Immigration Policy**: Which skills might need foreign workers while training programs ramp up?
4. **Youth Employment Programs**: Which skills should youth training programs focus on?

**Employment Projections**
LiJOBS uses linear trend analysis to project future employment levels:
- Based on historical growth rates over the past 12+ months
- Projected separately by sector and occupation
- Includes confidence bands showing the range of likely outcomes
- Projections become less reliable further into the future — LiJOBS shows this visually

Important caveat: Projections assume current trends continue. Major economic events (new mines, road construction, policy changes) can change the trajectory. Always present projections with appropriate caveats.`
    },
    {
      title: "Statistical Rigor and Data Quality Assurance",
      durationMinutes: 22,
      content: `As a senior Ministry official, you need to understand the statistical methods LiJOBS uses to ensure data quality and how to communicate this rigour to international partners.

**Automated Quality Checks**
LiJOBS continuously monitors data quality through automated checks:

1. **Duplicate Detection**: Uses overlap detection to identify workers with overlapping employment spells at the same employer. Counts unique affected records, not pairs, to avoid inflated numbers.

2. **Impossible Date Detection**: Flags records where:
   - Start date is in the future
   - End date is before start date
   - Employment duration exceeds reasonable limits (50+ years)

3. **Wage Outlier Detection (IQR Method)**:
   - Calculates the Interquartile Range (IQR) = Q3 - Q1
   - Lower bound = Q1 - 1.5 × IQR
   - Upper bound = Q3 + 1.5 × IQR
   - Wages outside these bounds are flagged for review

4. **Employer Headcount Anomalies**: Flags employers with unusually high or low worker counts compared to their sector average.

**The Data Quality Score**
Calculated as: Score = 100 - (Affected Records / Total Records × 100)
A score above 90% indicates good data quality. Below 80% requires urgent attention.

**Sampling Frameworks**
When full enumeration isn't possible, LiJOBS calculates appropriate sample sizes using Cochran's formula:
- n₀ = (z² × p × q) / e²  where z=1.96 (95% confidence), p=0.5 (maximum variability), e=0.05 (5% margin of error)
- Finite population correction: n = n₀ / (1 + (n₀-1)/N)
- Proportional allocation ensures each county and sector is represented

**Seasonal Adjustment**
Uses the ratio-to-moving-average method:
1. Calculate a 13-month centered moving average to smooth seasonal patterns
2. Compute ratios of actual values to the moving average
3. Average the ratios by month to get seasonal indices
4. Normalize indices so they average to 1.0 (no artificial drift)
5. Divide actual values by seasonal indices to get seasonally adjusted values

This reveals underlying trends by removing predictable seasonal patterns.

**Confidence Intervals**
LiJOBS calculates 95% confidence intervals for key statistics:
- Employment counts by county: Using normal approximation for proportions
- Wage estimates by sector: Using sample mean ± (z × standard error)
- Reliability ratings based on coefficient of variation (CV):
  - CV < 5%: High reliability
  - CV 5-15%: Moderate reliability
  - CV > 15%: Low reliability — interpret with caution

**Communicating Statistical Rigour**
When presenting to international partners:
- Reference the Methodology page (publicly accessible)
- Quote the data quality score
- Note the confidence intervals for key statistics
- Explain the three-layer verification system
- Emphasize that LiJOBS uses administrative records (actual employment data) rather than surveys (estimates from samples)

This positions Liberia as having one of the most rigorous employment tracking systems in West Africa.`
    },
  ],
};

const ministryQuizData: Record<string, QuizData[]> = {
  "Data Collection & Entry for Enumerators": [
    { question: "What is an employment spell in LiJOBS?", options: ["A type of magic used in job interviews", "A period of time a person works for a specific employer in a specific job", "A government policy document about employment", "A training certificate for workers"], correctIndex: 1, explanation: "An employment spell is a time-bounded record of a person working for a specific employer in a specific role, with start and end dates." },
    { question: "What should you do FIRST when visiting an employer for data collection?", options: ["Start counting workers immediately", "Take photos of the workplace", "Introduce yourself with your Ministry ID and explain the purpose", "Ask workers about their wages privately"], correctIndex: 2, explanation: "Always introduce yourself with your Ministry ID and explain why you are collecting data. This builds trust and ensures cooperation." },
    { question: "When entering wages, what is the most important thing to verify?", options: ["That the wage is above minimum wage", "The correct currency (LRD vs USD)", "That the worker agrees with the amount", "That the wage matches the industry average"], correctIndex: 1, explanation: "Entering wages in the wrong currency is one of the most common errors. A wage of 10,000 LRD is very different from 10,000 USD. Always confirm the currency with the employer." },
    { question: "If you find a record that might be a duplicate, what should you do?", options: ["Delete it immediately", "Create a new record to replace it", "Search for the existing record and verify before creating a new one", "Ignore it and move on"], correctIndex: 2, explanation: "Always search for existing records before creating new ones. Duplicates inflate statistics and reduce data quality scores." },
    { question: "What is the target data quality score for submissions?", options: ["50%", "70%", "Above 90%", "100% always"], correctIndex: 2, explanation: "A data quality score above 90% indicates that the vast majority of records are complete, consistent, and free of duplicates or errors." },
  ],

  "Statistical Literacy for Ministry Officials": [
    { question: "How is the unemployment rate calculated?", options: ["Unemployed / Total Population × 100", "Unemployed / Labour Force × 100", "Employed / Total Population × 100", "Job Seekers / Total Workers × 100"], correctIndex: 1, explanation: "Unemployment Rate = Unemployed / Labour Force × 100, where Labour Force = Employed + Unemployed. It excludes people not seeking work." },
    { question: "If a bar chart's y-axis starts at 500 instead of 0, what should you be cautious about?", options: ["The data is wrong", "Small differences will look exaggerated", "The chart is too old to use", "The bars are in the wrong order"], correctIndex: 1, explanation: "When the y-axis doesn't start at 0, small differences between bars appear much larger than they really are. This can mislead audiences." },
    { question: "Why should you compare the same month year-over-year instead of consecutive months?", options: ["Because data is only collected once a year", "To remove seasonal effects that distort the comparison", "Because the Ministry only publishes annual data", "To make the numbers look better"], correctIndex: 1, explanation: "Many indicators have natural seasonal patterns (e.g., agriculture employment rises during harvest). Comparing Jan-to-Jan removes seasonal effects and shows true trends." },
    { question: "When briefing the Minister, how many key points should you focus on?", options: ["As many as possible to show thoroughness", "3-5 key takeaways", "Only 1 number", "At least 20 data points"], correctIndex: 1, explanation: "Ministers want headlines and actionable insights. Lead with 3-5 key points and have detailed backup ready if they ask follow-up questions." },
    { question: "What makes LiJOBS data more reliable than survey-based estimates?", options: ["LiJOBS uses prettier charts", "LiJOBS uses actual administrative records with three-layer verification", "LiJOBS only counts formal employment", "LiJOBS data is collected by international organizations"], correctIndex: 1, explanation: "LiJOBS tracks actual employment records (administrative data) rather than estimating from survey samples. Combined with three-layer verification, this provides much higher accuracy." },
  ],

  "LiJOBS System Training — Complete Platform Guide": [
    { question: "Where do you find the Labour Market Indicators dashboard?", options: ["Under Resources > Reports", "Under Data Portal > Labour Market Indicators", "Under About > Statistics", "Under Contact > Data"], correctIndex: 1, explanation: "Labour Market Indicators is in the Data Portal section of the navigation, which contains all data analysis and visualization tools." },
    { question: "Who can access the Statistical Rigor section?", options: ["Anyone with a LiJOBS account", "Only the Director of Statistics", "Admin, ministry, and director roles only", "Only international partners"], correctIndex: 2, explanation: "Statistical Rigor is restricted to admin, ministry, and director roles because it contains internal data quality checks. The Methodology page is public for transparency." },
    { question: "What is the correct process for bulk uploading employment data?", options: ["Email an Excel file to the admin", "Upload any Excel file to the Bulk Upload page", "Download the template, fill it in exactly, then upload", "Copy-paste data into individual records"], correctIndex: 2, explanation: "You must download the official template, fill it in following the column headers exactly, then upload. LiJOBS validates all records and reports errors." },
    { question: "Can citizens file grievances without creating a LiJOBS account?", options: ["No, they must register first", "Yes, the grievance system works without authentication", "Only if a Ministry staff files it for them", "Only through the mobile app"], correctIndex: 1, explanation: "The Grievance System is designed to be accessible to all citizens. No account is needed — anyone can file and track a complaint using a tracking number." },
    { question: "What happens when you enter price data at /price-entry?", options: ["Nothing until the admin approves it", "The CPI and cost-of-living indices are automatically calculated", "It goes to a separate pricing database", "An email is sent to the Central Bank"], correctIndex: 1, explanation: "LiJOBS automatically calculates CPI and cost-of-living comparisons across counties as soon as price data is entered. No manual calculation needed." },
  ],

  "Verification & Trust Score Procedures": [
    { question: "What are the three layers of verification in LiJOBS?", options: ["Data entry, review, publication", "Employer sign-off, enumerator field check, director approval", "Worker statement, employer confirmation, court verification", "Survey, census, administrative check"], correctIndex: 1, explanation: "The three layers are: (1) Employer verifies the record is accurate, (2) Enumerator independently checks in the field, (3) Director of Statistics gives final approval." },
    { question: "What does a trust score of 0.45 indicate?", options: ["High confidence — use in official statistics", "Moderate confidence — include with caveats", "Low confidence — needs further verification", "The record should be deleted"], correctIndex: 2, explanation: "Trust scores between 0.3 and 0.49 indicate low confidence. These records need further verification before being included in official statistics." },
    { question: "How long should employer verification take after a record is created?", options: ["24 hours", "48 hours", "One week", "One month"], correctIndex: 1, explanation: "Employer verification is expected within 48 hours. Records that exceed this timeline appear on the Director Dashboard's overdue alerts." },
    { question: "If an employer disputes that a worker was ever employed there, what should you do?", options: ["Immediately delete the record", "Contact the worker for supporting evidence", "Side with the employer automatically", "Create a new record with different details"], correctIndex: 1, explanation: "Contact the worker for supporting evidence such as contracts, pay stubs, or witness statements. If unresolved, escalate through the Grievance System." },
    { question: "How should seasonal employment (e.g., farming) be recorded?", options: ["As one continuous spell covering multiple seasons", "As separate spells for each season with clear start and end dates", "Only during the main harvest season", "Seasonal work shouldn't be recorded in LiJOBS"], correctIndex: 1, explanation: "Each season should be a separate employment spell with distinct start and end dates. This gives accurate data on seasonal employment patterns." },
  ],

  "Economic Indicators & Occupational Analytics": [
    { question: "What does a CPI of 112 mean?", options: ["Prices have decreased by 12%", "Prices have increased by 12% from the base period", "112 items were measured", "The economy grew by 12%"], correctIndex: 1, explanation: "A CPI of 112 means the average price of the basket of goods has risen 12% compared to the base period (CPI=100)." },
    { question: "In the skills gap analysis, what does a 'deficit skill' mean?", options: ["A skill that nobody needs", "More job seekers have this skill than employers need", "Employers need this skill but few job seekers have it", "A skill that's being phased out"], correctIndex: 2, explanation: "A deficit skill has high employer demand but low supply from job seekers. This signals a need for training programs in that skill area." },
    { question: "What method does LiJOBS use for seasonal adjustment?", options: ["Simple monthly averaging", "Ratio-to-moving-average with 13-month centered MA", "Year-over-year comparison only", "No seasonal adjustment is applied"], correctIndex: 1, explanation: "LiJOBS uses the ratio-to-moving-average method with a 13-month centered moving average, normalized so indices average to 1.0 to prevent drift." },
    { question: "What does a Coefficient of Variation (CV) above 15% indicate?", options: ["High reliability data", "Moderate reliability data", "Low reliability — interpret with caution", "The data is wrong and should be discarded"], correctIndex: 2, explanation: "A CV above 15% indicates high variability relative to the estimate, meaning the statistic should be interpreted with caution and its reliability limitation noted." },
    { question: "Why is wage vs. cost of living analysis important?", options: ["It determines tax rates", "It identifies counties where workers struggle most with affordability", "It's required by international law", "It only matters for government workers"], correctIndex: 1, explanation: "By comparing wages to the cost of a basic basket of goods by county, policymakers can identify where workers are struggling most and target minimum wage or social protection policies." },
  ],
};

export async function seedMinistryTrainingCourses() {
  try {
    const existing = await db.select().from(courses).where(eq(courses.title, "Data Collection & Entry for Enumerators"));
    if (existing.length > 0) {
      console.log("Ministry training courses already exist, skipping.");
      return;
    }

    const existingProvider = await db.select().from(trainingProviders).where(eq(trainingProviders.id, MOL_PROVIDER_ID));
    if (existingProvider.length === 0) {
      await db.insert(trainingProviders).values({
        id: MOL_PROVIDER_ID,
        name: "Ministry of Labour — LiJOBS Training Academy",
        county: "Montserrado",
        accreditationStatus: "accredited",
        isActive: true,
      });
      console.log("Created Ministry of Labour training provider.");
    }

    console.log("Seeding 5 Ministry staff training courses...");
    for (const course of ministryCoursesData) {
      const courseId = crypto.randomUUID();
      await db.insert(courses).values({
        id: courseId,
        ...course,
      });

      const lessons = ministryLessonData[course.title];
      if (lessons) {
        for (let i = 0; i < lessons.length; i++) {
          await db.insert(courseLessons).values({
            id: crypto.randomUUID(),
            courseId,
            title: lessons[i].title,
            content: lessons[i].content,
            orderIndex: i,
            durationMinutes: lessons[i].durationMinutes,
          });
        }
      }

      const quizzes = ministryQuizData[course.title];
      if (quizzes) {
        for (let i = 0; i < quizzes.length; i++) {
          await db.insert(courseQuizQuestions).values({
            id: crypto.randomUUID(),
            courseId,
            question: quizzes[i].question,
            options: quizzes[i].options,
            correctIndex: quizzes[i].correctIndex,
            explanation: quizzes[i].explanation,
            orderIndex: i,
          });
        }
      }

      console.log(`Seeded ministry course: ${course.title}`);
    }

    console.log("Ministry training seeding complete! 5 courses, 15 lessons, 25 quiz questions created.");
  } catch (error) {
    console.error("Failed to seed ministry training courses:", error);
  }
}
