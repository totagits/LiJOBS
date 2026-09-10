export interface VideoScene {
  text: string;
  background: 'intro' | 'office' | 'data' | 'technology' | 'people' | 'government' | 'liberia' | 'map' | 'success' | 'closing' | 'branded';
}

export interface VideoScript {
  id: string;
  title: string;
  description: string;
  targetAudience: 'public' | 'admin' | 'ministry' | 'employer' | 'enumerator' | 'individual' | 'course';
  duration: string;
  script: string;
  scenes?: VideoScene[];
  courseSlug?: string;
}

export const videoScripts: VideoScript[] = [
  // ==================== PUBLIC VIDEOS ====================
  {
    id: 'public-overview',
    title: 'Welcome to LiJOBS - Liberia Jobs Observatory System',
    description: 'An introduction to the national job creation data platform',
    targetAudience: 'public',
    duration: '3-4 minutes',
    script: `Welcome to LiJOBS, the Liberia Jobs Observatory System. LiJOBS is Liberia's official National Job Creation Data Platform, developed by the Government of Liberia to provide real-time, trustworthy, and privacy-safe employment statistics for our nation.`,
    scenes: [
      {
        text: "Welcome to LiJOBS, the Liberia Jobs Observatory System. LiJOBS is Liberia's official National Job Creation Data Platform, developed by the Government of Liberia to provide real-time, trustworthy, and privacy-safe employment statistics for our nation.",
        background: 'intro'
      },
      {
        text: "Why does LiJOBS matter? For too long, Liberia has lacked accurate data on job creation across our economy. This made it difficult for policymakers to make informed decisions, for investors to understand our labor market, and for citizens to see the true picture of employment in our country.",
        background: 'government'
      },
      {
        text: "LiJOBS changes everything. Our platform tracks employment across all fifteen Liberian counties and all five major sectors of our economy: public sector employment, private sector jobs, NGO and project-based work, informal sector activities, and seasonal employment.",
        background: 'map'
      },
      {
        text: "What makes LiJOBS unique is our approach to tracking employment. We don't just count jobs. We track what we call employment spells - the actual periods when Liberians are working. This gives us a much more accurate picture of employment, especially for seasonal workers, contract employees, and those in the informal sector.",
        background: 'data'
      },
      {
        text: "The data in LiJOBS comes from verified sources. Employers register their workers directly on our platform. Government ministries verify public sector employment. County enumerators collect data from informal and seasonal workers in the field. And individual Liberians can register their own employment history.",
        background: 'people'
      },
      {
        text: "All of this data is protected by strong privacy safeguards. We follow international best practices for data protection, ensuring that personal information is secure while still providing the aggregate statistics our nation needs.",
        background: 'technology'
      },
      {
        text: "LiJOBS serves many purposes. Government agencies use our data to design better employment policies. Development partners rely on our statistics to target their interventions. Researchers access our data portal for evidence-based analysis. And ordinary Liberians can see how job creation is progressing in their counties and sectors.",
        background: 'office'
      },
      {
        text: "We invite you to explore LiJOBS. Visit our Data Portal to see the latest employment statistics. Check our Reports section for detailed analysis. And if you're an employer or worker, consider registering to contribute to this important national initiative. Together, we are building a more transparent and data-driven approach to job creation in Liberia. Thank you for being part of this journey.",
        background: 'success'
      }
    ]
  },
  {
    id: 'public-features',
    title: 'LiJOBS Features and Capabilities',
    description: 'A tour of the platform features and what you can do',
    targetAudience: 'public',
    duration: '4-5 minutes',
    script: `Let me walk you through the powerful features of the LiJOBS platform.`,
    scenes: [
      {
        text: "Let me walk you through the powerful features of the LiJOBS platform. Starting with our Home Page, you'll immediately see Liberia's employment statistics at a glance. Our hero section displays the total number of active employment spells, registered employers, and county coverage across the nation.",
        background: 'intro'
      },
      {
        text: "Below that, you'll find interactive charts showing employment trends over time, broken down by sector. Whether you're interested in public sector growth, private sector job creation, or the vital contributions of NGOs and informal workers, you can see it all visualized clearly.",
        background: 'data'
      },
      {
        text: "Now let's explore the Data Portal. This is where the real power of LiJOBS becomes apparent. Our interactive dashboards let you filter employment data by county, sector, time period, and more. You can see which counties are creating the most jobs, which sectors are growing fastest, and how employment patterns change throughout the year.",
        background: 'technology'
      },
      {
        text: "The Data Portal includes geographic visualization. Our county map shows employment density across Liberia, with color coding to help you quickly identify areas of high and low employment. Click on any county to drill down into detailed statistics for that region.",
        background: 'map'
      },
      {
        text: "Moving to the Reports section, here you'll find our official publications. We release monthly employment summaries, quarterly sector analyses, and annual comprehensive reports. All reports are available for download in PDF format, making it easy to share with colleagues or include in your own research.",
        background: 'office'
      },
      {
        text: "The Resources page is your learning center. We provide methodology documents explaining how we collect and verify employment data. You'll find frequently asked questions, user guides, and links to related government portals. This section is regularly updated with new materials.",
        background: 'people'
      },
      {
        text: "For registered users, the platform offers even more capabilities. Employers can report their workforce, track their contributions to national employment, and receive verification badges. Government officials can access detailed verification tools. And individual workers can maintain their official employment history.",
        background: 'success'
      },
      {
        text: "Security is built into everything we do. All data transmissions are encrypted. User accounts are protected with strong authentication. And our systems undergo regular security audits. Explore LiJOBS today and discover how our platform is transforming employment data in Liberia.",
        background: 'technology'
      }
    ]
  },
  {
    id: 'public-registration',
    title: 'How to Register on LiJOBS',
    description: 'Step-by-step guide to creating your account',
    targetAudience: 'public',
    duration: '3-4 minutes',
    script: `Ready to join LiJOBS? Let me guide you through the registration process step by step.

First, visit the LiJOBS website and look for the "Get Started" or "Register" button in the top right corner of the page. Click on it to begin your registration journey.

You'll be presented with a choice of account types. Select the one that best describes your role. Are you an employer who wants to report jobs? Choose "Employer" and then select whether you're in the private sector, public sector, or an NGO. Are you an individual worker who wants to track your employment history? Choose "Individual Worker." Government officials and enumerators will have their accounts created by system administrators.

Now let's fill in your information. Enter your first name and last name as they appear on official documents. Provide a valid email address - this will be your login username and where we'll send important notifications. Create a strong password with at least eight characters, including uppercase letters, lowercase letters, and numbers.

If you're registering as an employer, you'll need to provide additional information. Enter your organization's official name. Select your county of primary operation. Provide a business registration number if you have one. The more complete your profile, the faster your verification will be processed.

After filling in all required fields, click the "Create Account" button. You'll see a confirmation message, and we'll send a verification email to your address. Check your inbox and click the verification link to activate your account.

Once your account is activated, log in using your email and password. For employers, your account will be in "pending verification" status until our team reviews your information. This usually takes one to three business days. You'll receive an email when your account is fully verified.

While waiting for verification, you can explore your dashboard, update your profile, and familiarize yourself with the platform. Once verified, employers can begin reporting employment spells immediately.

For individual workers, your account is active right away. You can start adding your employment history, which helps build your official work record in the national system.

Remember to keep your login credentials secure. Enable two-factor authentication if available for extra security. And if you ever forget your password, use the "Forgot Password" link on the login page to reset it.

Welcome to LiJOBS. Your participation helps build a more transparent and accurate picture of employment in Liberia.`
  },

  // ==================== ADMIN VIDEOS ====================
  {
    id: 'admin-overview',
    title: 'System Administration Overview',
    description: 'Complete guide for system administrators',
    targetAudience: 'admin',
    duration: '8-10 minutes',
    script: `Welcome to the LiJOBS System Administration training. As a system administrator, you have the highest level of access to our platform, and with that comes significant responsibility.

Let's start with understanding your role. As an admin, you are responsible for managing user accounts, monitoring system health, overseeing data quality, generating reports, and ensuring the platform operates smoothly for all users across Liberia.

When you log into your admin dashboard, you'll see a comprehensive overview of the entire system. The main statistics panel shows total registered users, active employment spells, pending verifications, and system alerts. Pay attention to the pending verifications number - keeping this low ensures employers can report jobs without delays.

Let's explore user management. Click on the Users section in your navigation menu. Here you can see all registered accounts organized by role. You can filter by account type: administrators, ministry verifiers, employers, county enumerators, and individual workers. The search function lets you quickly find specific users by name, email, or organization.

To create a new user account, click the "Add User" button. Select the appropriate role from the dropdown. For ministry verifiers, assign their specific ministry. For enumerators, assign their county of operation. Fill in their contact information and set a temporary password. The system will prompt them to change this password on first login.

Account verification is a critical function. When new employers register, their accounts appear in your verification queue. Review their submitted documentation, verify their business registration numbers against official records, and either approve or reject their applications. Always include a reason when rejecting an application so users understand what they need to correct.

The Data Management section gives you oversight of all employment spells in the system. You can view, edit, or remove records if necessary. Use this power carefully - all changes are logged in the audit trail. If you need to correct erroneous data, document your reason in the notes field.

System settings allow you to configure platform behavior. You can adjust session timeout durations, enable or disable self-registration, set up automated notifications, and manage system-wide announcements. Before changing any settings, consider the impact on all users.

The Reports section lets you generate administrative reports. Export user statistics, employment data summaries, and system usage metrics. These reports are valuable for monitoring platform adoption and identifying areas that need attention.

Security monitoring is an ongoing responsibility. Regularly review the login audit logs for suspicious activity. Check for failed login attempts, unusual access patterns, or accounts that haven't been used in extended periods. Inactive accounts should be deactivated to maintain security.

When issues arise, use the support ticket system to track and resolve user problems. Prioritize tickets based on their impact - data integrity issues should be addressed before minor display problems.

Remember, as an administrator, you set the tone for how the platform is used. Be responsive to user needs, maintain high data quality standards, and always prioritize security. The integrity of Liberia's employment data depends on your diligence.

Thank you for your service to this important national initiative.`
  },
  {
    id: 'admin-user-management',
    title: 'Managing Users and Permissions',
    description: 'Detailed guide to user account administration',
    targetAudience: 'admin',
    duration: '6-7 minutes',
    script: `This training covers detailed user management procedures for LiJOBS administrators.

Understanding our role-based access system is essential. LiJOBS has five distinct user roles, each with specific permissions. Let me explain each one.

System Administrators like yourself have complete access. You can create and delete accounts, modify any data, change system settings, and access all reports. This role should be limited to trusted IT staff.

Ministry Verifiers work for government ministries. They can verify employment spells within their assigned sector, approve or reject submitted job reports, and generate verification reports. They cannot modify user accounts or system settings.

Employers are organizations that report jobs. Private sector, public sector, and NGO employers each have the same permissions but are categorized differently for reporting purposes. They can submit employment spells, view their own data, and update their organization profiles.

County Enumerators are field workers who collect informal and seasonal employment data. They can submit employment spells for their assigned county only. They cannot access data from other counties.

Individual Workers have the most limited access. They can view and manage their own employment history only. They cannot submit data for other people or access aggregate statistics.

Now let's walk through creating a new user. From your dashboard, navigate to the Users section and click "Add New User." First, select the role. This determines what permissions they'll have and what additional information is required.

For a Ministry Verifier, you'll need to specify which ministry they represent and what sectors they can verify. For an Enumerator, assign their county and supervisor. For employers, the organization details will be provided during their registration.

Fill in the personal information: first name, last name, email address, and phone number. The email must be unique - no two accounts can share an email address.

Generate a temporary password or let the system create one automatically. I recommend automatic generation as it creates stronger passwords. The user will receive this password via email and must change it upon first login.

Review the information and click Create Account. The user receives a welcome email with login instructions.

To modify existing accounts, find the user in your list and click the Edit button. You can update personal information, change role assignments, reset passwords, or deactivate accounts. Note that you cannot delete accounts that have associated data - you can only deactivate them to preserve data integrity.

When an employee leaves an organization or changes roles, update their account accordingly. If they're moving to a different organization, deactivate the old account and create a new one with the new organization details.

Bulk operations are available for common tasks. You can deactivate multiple accounts at once, export user lists to spreadsheets, or send announcements to all users of a specific role.

Keep your user database clean. Review inactive accounts monthly. Accounts with no login activity for six months should be investigated. Contact users to confirm they still need access, and deactivate dormant accounts.

Proper user management ensures that only authorized personnel access sensitive employment data, maintaining the trust Liberians place in our platform.`
  },

  // ==================== MINISTRY VERIFIER VIDEOS ====================
  {
    id: 'ministry-overview',
    title: 'Ministry Verifier Training',
    description: 'Complete guide for ministry verification officers',
    targetAudience: 'ministry',
    duration: '7-8 minutes',
    script: `Welcome to the Ministry Verifier training for LiJOBS. As a verification officer, you play a crucial role in ensuring the accuracy and trustworthiness of Liberia's employment data.

Your primary responsibility is to review and verify employment spells submitted by employers and enumerators. When data is verified, it becomes part of Liberia's official employment statistics. Unverified data is flagged and may not be included in official reports.

Let me show you your verification dashboard. When you log in, you'll see your pending verification queue prominently displayed. The number in red indicates how many submissions are waiting for your review. Our goal is to keep this number low - ideally processing verifications within 48 hours.

The queue is organized by submission date, with the oldest items at the top. You can also filter by sector, county, or employer. Use these filters when you need to focus on specific types of submissions.

Let's walk through a verification. Click on any item in your queue to open the details view. You'll see all the information submitted: employer name, employee details, job title, sector classification, employment dates, and any supporting documentation.

Your first check is the employer. Is this a legitimate registered organization? Look at their verification status and business registration number. If the employer themselves isn't verified yet, you cannot verify their employment submissions.

Next, review the employment details. Does the job title match the sector classification? Does the wage seem reasonable for this type of work? Are the dates logical? Look for obvious errors like end dates before start dates or suspiciously high numbers of employees from small businesses.

For public sector verifications, you may have access to government payroll records for cross-reference. Use these to confirm that the named individuals actually work for the stated ministry or agency.

If everything checks out, click the Verify button. Add a brief note explaining your verification, such as "confirmed against ministry payroll records" or "verified through employer site visit." This creates an audit trail.

If you find problems, click Reject and select a reason from the dropdown. Common rejection reasons include: incomplete information, mismatched sector classification, suspicious data patterns, or unverified employer. Write a detailed explanation so the submitter knows what to correct.

Sometimes you need more information before deciding. Use the Request Information button to send a message to the submitter. Describe exactly what additional documentation or clarification you need. The submission moves to a "pending information" status and your timer pauses.

You can also flag submissions for administrator review if you suspect fraud or encounter situations outside your expertise. Flag sparingly - only for genuinely concerning cases.

Track your performance using the metrics panel. It shows how many verifications you've completed this week, your average processing time, and your approval rate. These metrics help identify areas for improvement and demonstrate the volume of work you're handling.

Best practices for efficient verification: batch similar submissions together, use keyboard shortcuts for common actions, and maintain consistent standards. If you're unsure about a policy, consult your supervisor or the verification guidelines document before making decisions.

Your work directly impacts the quality of Liberia's employment data. Thank you for your commitment to accuracy and integrity.`
  },

  // ==================== EMPLOYER VIDEOS ====================
  {
    id: 'employer-overview',
    title: 'Employer Portal Training',
    description: 'How to report and manage employment data',
    targetAudience: 'employer',
    duration: '8-10 minutes',
    script: `Welcome to the LiJOBS Employer Training. This video will guide you through everything you need to know about reporting employment data for your organization.

As an employer registered on LiJOBS, you have a legal and civic responsibility to report your workforce accurately. This data contributes to national employment statistics and helps the government design better policies for job creation.

Let's start with your employer dashboard. When you log in, you'll see an overview of your organization's employment data. The summary panel shows your total active employees, recently reported employment spells, and any pending verifications. Below that, you can see charts showing your employment trends over time.

Before reporting any jobs, ensure your organization profile is complete and verified. Click on your organization name to view your profile. Verify that your business name, registration number, sector classification, and contact information are correct. If anything is wrong, click Edit to update it. Note that changes to your business registration number will require re-verification.

Now let's report an employment spell. An employment spell represents a period of employment for one worker. It captures when someone started working, their job title, wage, and when they stopped working if applicable.

Click on "Report Jobs" in the navigation menu. You'll see a form to enter the employment details. Start with the employee name - enter their first and last name as it appears on official documents. Next, select the job title from the dropdown or enter a custom title if yours isn't listed.

The sector should match your organization type. If you're a private company, select "private." Public institutions select "public." NGOs and development projects select "NGO."

Choose your county from the dropdown. If your organization operates in multiple counties, select the county where this specific employee works.

Enter the start date - when did this person begin working for you? If the employment has ended, enter the end date as well. Leave the end date empty for current employees.

Enter the wage information. Select whether the wage is daily, weekly, or monthly, then enter the amount in Liberian dollars. This helps us calculate standardized employment statistics.

Review all information carefully before submitting. Click Submit to send the employment spell for verification. You'll receive a confirmation message and the submission will appear in your pending queue.

For organizations with many employees, we offer bulk upload. Click on "Bulk Upload" and download our Excel template. Fill in the template with all your employee data following the column headers exactly. Upload the completed file and the system will validate it before submission.

Common errors to avoid: make sure dates are in the correct format, ensure all required fields are filled, and verify that job titles match sector classifications. The system will highlight any errors for you to correct.

Track your submissions in the "My Reports" section. You can see which employment spells are verified, which are pending, and which were rejected. For rejected submissions, click to see the reason and resubmit with corrections.

Your participation in LiJOBS matters. Accurate employment reporting helps demonstrate your organization's contribution to Liberia's economy and provides valuable data for national planning. Thank you for your commitment to this important initiative.`
  },
  {
    id: 'employer-bulk-upload',
    title: 'Bulk Upload Training for Employers',
    description: 'How to upload multiple employment records at once',
    targetAudience: 'employer',
    duration: '5-6 minutes',
    script: `This training covers the bulk upload feature for employers who need to report many employees at once.

Bulk upload is designed for organizations with more than ten employees. Instead of entering each person individually, you can prepare a spreadsheet and upload it all at once. This saves significant time and reduces data entry errors.

Let's walk through the process step by step.

First, navigate to the Report Jobs section and click on "Bulk Upload." You'll see two options: download a blank template or download a template pre-filled with your existing employees. For your first upload, download the blank template.

Open the template in Excel or another spreadsheet program. You'll see columns for each required field: Employee First Name, Employee Last Name, Job Title, Sector, County, Start Date, End Date, Wage Amount, and Wage Period.

Now fill in your employee data. Each row represents one employment spell. Start with the employee's first name in the first column, last name in the second. Be consistent with name formatting - use proper capitalization and avoid abbreviations.

For job titles, use standard descriptions like "Accountant," "Driver," "Security Guard," or "Administrative Assistant." Consistent job titles help with national statistics.

In the sector column, enter exactly one of these values: private, public, ngo, informal, or seasonal. Use lowercase. Any other value will cause an error.

For counties, spell out the full county name: Montserrado, Margibi, Grand Bassa, and so on. Do not use abbreviations.

Dates must be in the format YYYY-MM-DD. So January 15, 2024 becomes 2024-01-15. This international date format prevents confusion and errors.

Leave the End Date empty for current employees. Only fill it in for employees who have left.

For wages, enter just the number without currency symbols. In the Wage Period column, enter "daily," "weekly," or "monthly" to indicate how often this amount is paid.

After filling in all your data, save the file. Return to LiJOBS and click "Choose File" to select your spreadsheet. The system will process your file and show a validation report.

Review the validation report carefully. Green checkmarks indicate valid rows. Red X marks indicate errors that must be fixed. The report tells you exactly which cell has the problem and what needs to be corrected.

Fix any errors in your spreadsheet and upload again. Repeat until all rows show green checkmarks.

Once validation passes, click "Submit All" to send the data for verification. You'll see a confirmation showing how many employment spells were submitted.

For large organizations, consider organizing your upload by department or location. This makes it easier to track verifications and identify any issues.

Monthly updates are recommended. Each month, download your existing employee template, update any changes like new hires or departures, and re-upload. The system will recognize existing employees and only process the changes.

Bulk upload saves time while maintaining data accuracy. Use it to efficiently fulfill your reporting obligations to LiJOBS.`
  },

  // ==================== ENUMERATOR VIDEOS ====================
  {
    id: 'enumerator-overview',
    title: 'County Enumerator Training',
    description: 'Field data collection for informal and seasonal employment',
    targetAudience: 'enumerator',
    duration: '10-12 minutes',
    script: `Welcome to the LiJOBS County Enumerator Training. As an enumerator, you are the eyes and ears of our employment data system, collecting vital information from workers who might otherwise be invisible in official statistics.

Your role focuses on the informal and seasonal sectors. These are workers who don't have formal employment contracts: market vendors, small-scale farmers, motorcycle taxi drivers, construction day laborers, seasonal agricultural workers, and many others. Their work is real and valuable, but without enumerators like you, it would not be captured in national employment data.

Let me explain your territory. You are assigned to a specific county. All the data you collect must be from workers and businesses operating within that county. If you encounter someone working across county lines, record them in the county where they primarily work.

Your data collection tools include this mobile-friendly platform, paper backup forms for areas without internet, and your official LiJOBS enumerator identification. Always carry your ID when conducting field work.

Let's review the data collection process. You have two approaches: business-based collection and worker-based collection.

For business-based collection, you visit informal businesses like market stalls, small workshops, or farms. Interview the owner or manager to record all people working there. This is efficient for capturing multiple workers at once.

For worker-based collection, you interview individual workers directly. This is necessary for self-employed individuals, day laborers who move between employers, and workers whose employers are uncooperative.

When conducting an interview, introduce yourself and show your ID. Explain that you're collecting employment data for the government to better understand the labor market. Emphasize that participation is voluntary and all personal information is confidential.

The data you collect includes: the worker's name, their occupation or job type, the nature of their work (informal or seasonal), the location where they work, when they started this type of work, their typical earnings, and whether they work full-time or part-time.

Enter this information into your mobile form. The app works offline and will sync when you have internet connection. Each submission creates an employment spell that will be reviewed by ministry verifiers.

Seasonal workers require special attention. Ask when their working season typically runs - for example, agricultural workers might work from May to October during planting and harvest. Record these seasonal patterns in the notes field. Create separate employment spells for each season if the worker returns year after year.

Quality matters more than quantity. Take time to collect accurate information. Double-check names and dates. If something seems inconsistent, politely ask clarifying questions. It's better to submit fewer accurate records than many questionable ones.

Geographic coverage is important. Don't just collect data from easy-to-reach areas. Make efforts to visit remote communities, markets outside the main town, and areas where informal work is concentrated. Your supervisor will provide guidance on coverage targets for different areas of your county.

Safety is paramount. Always let someone know where you're going before field work. Travel with a colleague when visiting unfamiliar areas. Trust your instincts - if a situation feels unsafe, leave and return another time.

Weekly, submit your field report to your supervisor. Include how many workers you interviewed, which areas you covered, any challenges you encountered, and your plans for the following week. Regular communication helps ensure comprehensive county coverage.

Your work directly impacts national policy. When you accurately capture informal employment, you help demonstrate the true size and nature of Liberia's workforce. Policymakers use this data to design programs that benefit all workers, including those in the informal sector.

Thank you for your dedication to this important mission.`
  },
  {
    id: 'enumerator-mobile',
    title: 'Using the Mobile Data Collection App',
    description: 'Technical guide for the mobile application',
    targetAudience: 'enumerator',
    duration: '5-6 minutes',
    script: `This training covers how to use the LiJOBS mobile application for field data collection.

The LiJOBS platform is fully mobile-responsive, meaning you can access it from any smartphone or tablet with a web browser. You don't need to install a separate app - just go to the LiJOBS website and log in.

When you log in on your mobile device, the interface automatically adjusts for your screen size. The navigation menu is accessible through the hamburger icon in the top corner. Tap it to see your options: Dashboard, Report Jobs, My Reports, and Profile.

Let's submit an employment spell from your phone. Tap Report Jobs to open the submission form. The form is designed for easy mobile input. Tap each field to enter information.

For text fields like names, your phone's keyboard will appear. Type the information and tap Next to move to the following field. For dropdown selections like sector and county, tap the field to see your options and select the appropriate choice.

Dates are entered using your phone's date picker. Tap the Start Date field and a calendar will appear. Scroll to find the correct month and tap the date. For end dates, leave it empty if the person is still working.

The wage field accepts numbers only. Your phone will show a numeric keyboard. Enter the amount without commas or currency symbols.

Before submitting, scroll through the form to review all entries. Mistakes are easy to make on small screens, so take an extra moment to verify. When satisfied, tap the Submit button at the bottom.

Now let's discuss offline capability. The LiJOBS mobile interface works offline through your browser's caching system. If you're in an area without internet, you can still view previously loaded pages and fill out forms.

However, submissions require internet connection. If you complete a form while offline, the browser will attempt to submit when connectivity returns. For reliability, I recommend the following workflow:

While in an area with good internet, open the Report Jobs page to ensure it's cached. Then go to your field location and fill out forms for each person you interview. Keep notes of what you submitted. When you return to an area with internet, refresh the page and verify your submissions appear in My Reports.

If a submission fails, you'll see an error message. Don't panic - the form data is usually still in your browser. Try submitting again when you have a stronger connection.

Battery management is important for field work. Lower your screen brightness to conserve power. Close unnecessary browser tabs and apps. Consider carrying a portable battery charger for long days in the field.

Photos are not currently required for employment spell submissions, but you may be asked to document certain situations. Use your phone's camera app separately and note the file name in your submission notes.

For technical problems, try these steps first: refresh the page, clear your browser cache, or try a different browser. If problems persist, contact your supervisor or the LiJOBS help desk.

The mobile interface empowers you to collect data anywhere in your county. Use it effectively to capture employment information that makes a real difference.`
  },

  // ==================== INDIVIDUAL WORKER VIDEOS ====================
  {
    id: 'individual-overview',
    title: 'Individual Worker Guide',
    description: 'Managing your personal employment history',
    targetAudience: 'individual',
    duration: '5-6 minutes',
    script: `Welcome to LiJOBS. This guide is for individual workers who want to track their personal employment history on Liberia's national employment platform.

As an individual worker, LiJOBS gives you a place to record your work history in an official government system. This can be valuable for many reasons: documenting your experience for future employers, maintaining records for social services, and contributing to national employment statistics.

Let's set up your profile. After logging in, click on your name to access your profile page. Here you can update your personal information: name, contact details, and basic demographic information. Keep this information current, as it may be used for verification purposes.

The most important section is your employment history. Click on "Add Employment" to record a job you've held. Enter the employer name - this is the person or business you worked for. If you worked for yourself, enter "Self-employed."

Select your occupation type from the list. This helps categorize your work for statistical purposes. Options include categories like agriculture, manufacturing, services, construction, and more.

Choose the appropriate sector. If you worked for a company with formal registration, select "Private." If you worked for the government, select "Public." If you worked for an NGO or development project, select "NGO." For market vendors, small-scale farmers, or similar work, select "Informal." For work that only happens during certain times of year, select "Seasonal."

Enter your dates of employment. When did you start this job? When did you stop? If you're still working there, leave the end date empty.

The wages field is optional for individual workers. You can enter your typical earnings if you want to track this, or leave it blank for privacy.

Add as many employment records as you have. Your complete work history appears on your dashboard as a timeline. This creates a valuable record of your professional experience.

Some employment entries may be verified by ministry officials or matched against employer submissions. Verified entries appear with a checkmark, indicating official confirmation. Unverified entries are still valuable for your personal records.

You can export your employment history as a document. Click "Download History" to generate a PDF summarizing all your recorded employment. This document can be shared with potential employers, banks, or government agencies that need to verify your work experience.

Privacy controls let you decide what information is visible. By default, your individual data is only used for aggregate statistics - no one can see your specific records without your permission. You can generate shareable links for specific employers or agencies who need to verify your history.

Keep your records up to date. When you start a new job, add it to LiJOBS. When you leave a position, update the end date. An accurate history is more valuable than a partial one.

As a Liberian worker, your participation in LiJOBS helps paint a complete picture of our nation's workforce. Every job matters - from corporate executives to market vendors, from teachers to farmers. By recording your work history, you're contributing to better understanding of our labor market.

Thank you for being part of this national initiative.`
  },
  {
    id: 'individual-self-registration',
    title: 'Self-Registering Your Employment',
    description: 'How to add your work history independently',
    targetAudience: 'individual',
    duration: '4-5 minutes',
    script: `This video shows you how to self-register your employment history on LiJOBS as an individual worker.

Self-registration is available for anyone who works but whose employer hasn't registered them on the platform. This is especially important for informal sector workers, self-employed individuals, and those working for small businesses that don't use LiJOBS.

Start from your dashboard and click "Add My Employment." This opens the self-registration form designed specifically for individual workers.

Begin with your employment type. Are you an employee working for someone else? Select "Employee." Are you self-employed, running your own business or working independently? Select "Self-Employed." Are you working as a day laborer, taking jobs as they come? Select "Casual Worker."

For employees, enter your employer's information. Write the name of the business or person you work for. If it's a small informal business without an official name, describe it - for example, "market stall at Waterside" or "construction work for Mr. Johnson."

For self-employed workers, describe your business activity. What do you sell or what service do you provide? Where do you typically work? This information helps categorize your work appropriately.

Select your primary occupation from the dropdown list. Choose the option that best matches what you do. If nothing fits perfectly, select the closest match and add details in the notes field.

Enter your work location by selecting your county. If you work in multiple locations, choose where you spend the most time. You can add additional employment entries for work in other counties.

Provide the dates of your employment. When did you start doing this work? If you're no longer doing it, when did you stop? Be as accurate as possible, but estimates are acceptable if you don't remember exact dates.

The earnings section is optional but helpful. Select how you're typically paid: daily, weekly, or monthly. Enter your average earnings in that period. This information is kept confidential and only used for aggregate statistics.

Upload any supporting documentation you have. This could be a letter from your employer, a market vendor permit, photos of your workplace, or any other evidence of your work. Documentation helps with verification but is not required.

Review all your information and click Submit. Your employment record is now in the system.

Self-registered employment goes through a verification process. Enumerators or ministry officials may contact you to confirm the information. This helps ensure the accuracy of national data. Be prepared to answer questions about your work.

Once verified, your employment entry appears with a verification badge. Unverified entries remain visible but are noted as self-reported. Both types contribute to your personal employment record.

You can add as many employment entries as needed to document your full work history. Many Liberians have held multiple jobs across different sectors - capture them all to build a complete picture of your working life.

By self-registering, you ensure that your work counts in national statistics. Every informal worker who registers helps demonstrate the true scale of Liberia's labor market.`
  },
  // ==================== COURSE TRAINING VIDEOS ====================
  {
    id: 'course-agriculture',
    title: 'Agriculture & Farming in Liberia - Video Lesson',
    description: 'Learn sustainable farming techniques suited for Liberian soil and climate',
    targetAudience: 'course',
    courseSlug: 'agriculture-farming',
    duration: '5-6 minutes',
    script: `Welcome to the Agriculture and Farming training course. In this video lesson, we will explore modern farming techniques that are helping Liberian farmers increase their yields and build sustainable livelihoods.`,
    scenes: [
      { text: "Welcome to the Agriculture and Farming training course. Liberia's fertile soil and tropical climate make it one of the most promising agricultural regions in West Africa. Whether you are growing rice, cassava, vegetables, or managing a rubber or palm oil plantation, this course will give you practical skills to succeed.", background: 'intro' },
      { text: "Let's start with soil preparation. Good farming begins with healthy soil. In Liberia, our laterite soils benefit greatly from composting and mulching. We'll show you how to create nutrient-rich compost from farm waste, kitchen scraps, and animal manure. This simple practice can double your crop yields without expensive chemical fertilizers.", background: 'people' },
      { text: "Next, we cover planting techniques. Proper spacing, seed selection, and timing your planting with the rainy season are critical for success. For rice farming, we recommend the improved lowland rice varieties developed at the Central Agricultural Research Institute. For cassava, the improved TME varieties resist mosaic disease and produce higher yields.", background: 'liberia' },
      { text: "Pest and disease management is essential. We'll teach you integrated pest management, which combines natural predators, crop rotation, and targeted treatments to protect your crops while keeping your farm safe for your family and the environment.", background: 'technology' },
      { text: "Finally, let's talk about marketing your harvest. Understanding market prices, proper storage to reduce post-harvest losses, and connecting with buyers through agricultural cooperatives can significantly increase your income. The LiJOBS platform can help you find seasonal agricultural employment opportunities across all fifteen counties.", background: 'success' },
      { text: "Complete the written lessons and take the quiz to earn your Agriculture and Farming certificate. This certificate is recognized by the Ministry of Labor and can help you access agricultural programs and employment opportunities across Liberia.", background: 'closing' }
    ]
  },
  {
    id: 'course-auto-mechanics',
    title: 'Auto Mechanics - Video Lesson',
    description: 'Master vehicle maintenance and repair skills for Liberian road conditions',
    targetAudience: 'course',
    courseSlug: 'auto-mechanics',
    duration: '5-6 minutes',
    script: `Welcome to the Auto Mechanics training course. In this video, you will learn essential vehicle maintenance and repair skills adapted for the unique challenges of Liberian road conditions.`,
    scenes: [
      { text: "Welcome to the Auto Mechanics training course. With Liberia's growing transportation sector and challenging road conditions, skilled mechanics are in high demand across all fifteen counties. This course will equip you with the practical knowledge to diagnose, maintain, and repair vehicles.", background: 'intro' },
      { text: "We begin with engine fundamentals. Understanding the four-stroke cycle — intake, compression, power, and exhaust — is the foundation of all engine work. You'll learn how each component works together and how to identify problems by listening to your engine and reading diagnostic signs.", background: 'technology' },
      { text: "Preventive maintenance keeps vehicles running and customers coming back. We'll cover oil changes every five thousand to seven thousand kilometers, air filter replacement, brake inspection, and cooling system maintenance. In Liberia's hot climate, overheating is one of the most common problems, so cooling system care is especially important.", background: 'office' },
      { text: "Electrical systems are increasingly important in modern vehicles. You'll learn to use a multimeter to test batteries, which should read about twelve point six volts when fully charged. We'll cover starter motors, alternators, and the basics of vehicle wiring — skills that set professional mechanics apart.", background: 'data' },
      { text: "Safety is paramount in any workshop. Always use jack stands when working under a vehicle — never rely on a jack alone. Keep your workspace clean, wear protective equipment, and follow proper procedures for handling fluids and batteries.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Auto Mechanics certificate from LiJOBS, recognized by the Ministry of Labor. Skilled mechanics can find employment at garages, dealerships, and fleet operations throughout Liberia.", background: 'success' }
    ]
  },
  {
    id: 'course-carpentry',
    title: 'Carpentry & Woodworking - Video Lesson',
    description: 'Build skills in construction carpentry and furniture making using Liberian hardwoods',
    targetAudience: 'course',
    courseSlug: 'carpentry-woodworking',
    duration: '5-6 minutes',
    script: `Welcome to the Carpentry and Woodworking training course. Learn to work with Liberia's beautiful hardwoods and build a career in one of the country's most essential trades.`,
    scenes: [
      { text: "Welcome to the Carpentry and Woodworking course. Liberia is blessed with some of the finest hardwoods in West Africa, including mahogany, iroko, and niangon. Skilled carpenters are essential for housing construction, furniture making, and the building industry that is growing across all our counties.", background: 'intro' },
      { text: "We start with understanding wood. Different species have different properties — hardness, grain direction, moisture content, and workability. You'll learn to select the right wood for each project, properly season lumber to prevent warping, and understand how Liberia's humidity affects your work.", background: 'people' },
      { text: "Essential joinery techniques form the backbone of quality carpentry. We'll cover mortise and tenon joints, dovetails for drawers and boxes, and modern fastening methods. You'll learn when traditional joints are best and when screws and modern adhesives make more sense for the project.", background: 'technology' },
      { text: "For construction carpentry, you'll learn roof framing, door and window installation, and formwork for concrete. These skills are in high demand as Liberia continues to build and rebuild infrastructure across the country.", background: 'office' },
      { text: "Safety in the workshop is critical. Always wear eye protection when cutting, use push sticks with power tools, keep your blades sharp — a dull blade is more dangerous than a sharp one — and maintain a clean, organized workspace.", background: 'data' },
      { text: "Earn your Carpentry certificate by completing the lessons and passing the quiz. This LiJOBS credential is recognized by the Ministry of Labor and opens doors to employment in construction, furniture workshops, and self-employment across Liberia.", background: 'success' }
    ]
  },
  {
    id: 'course-computer-literacy',
    title: 'Computer Literacy & IT Basics - Video Lesson',
    description: 'Master essential computer skills for the modern Liberian workplace',
    targetAudience: 'course',
    courseSlug: 'computer-literacy',
    duration: '5-6 minutes',
    script: `Welcome to the Computer Literacy and IT Basics training course. Digital skills are becoming essential for employment across all sectors in Liberia.`,
    scenes: [
      { text: "Welcome to Computer Literacy and IT Basics. As Liberia's economy grows and modernizes, computer skills are no longer optional — they are essential. Whether you work in government, business, education, or any other field, knowing how to use a computer will increase your opportunities and earning potential.", background: 'intro' },
      { text: "We begin with computer fundamentals. You'll learn the parts of a computer, how to navigate the operating system, manage files and folders, and perform basic troubleshooting. These foundational skills will give you confidence every time you sit down at a computer.", background: 'technology' },
      { text: "Microsoft Office and similar tools are used in virtually every workplace. We'll cover word processing for creating documents and letters, spreadsheets for organizing data and budgets, and presentation software for meetings and proposals. These three skills alone can qualify you for many office positions.", background: 'office' },
      { text: "Internet and email skills connect you to the world. You'll learn to browse the web safely, use search engines effectively, create and manage email accounts, and understand online safety — including how to recognize scams and protect your personal information.", background: 'data' },
      { text: "Mobile technology is especially important in Liberia, where smartphones are often more accessible than desktop computers. We'll cover mobile office apps, mobile banking basics, and how to use your phone as a productivity tool for your career.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Computer Literacy certificate. This credential demonstrates your digital readiness to employers and is recognized by the Ministry of Labor through the LiJOBS platform.", background: 'success' }
    ]
  },
  {
    id: 'course-cosmetology',
    title: 'Cosmetology & Hairdressing - Video Lesson',
    description: 'Professional beauty and hair care skills for the Liberian market',
    targetAudience: 'course',
    courseSlug: 'cosmetology-hairdressing',
    duration: '5-6 minutes',
    script: `Welcome to the Cosmetology and Hairdressing training course. Build your skills in one of Liberia's fastest-growing service industries.`,
    scenes: [
      { text: "Welcome to the Cosmetology and Hairdressing course. The beauty industry in Liberia is thriving, with salons and barbershops providing essential services in every community. This course will give you professional-level skills in hair care, styling, and salon management.", background: 'intro' },
      { text: "Understanding hair types and textures is fundamental. We'll cover the science of African hair care, including proper washing, conditioning, and moisturizing techniques. You'll learn about common hair conditions, scalp health, and how to recommend the right products for each client.", background: 'people' },
      { text: "Styling techniques range from traditional braiding and threading to modern cuts, relaxers, and coloring. We'll cover protective styles that are popular across West Africa, professional cutting techniques, and how to consult with clients to achieve the look they want.", background: 'technology' },
      { text: "Hygiene and safety in the salon cannot be compromised. Proper sterilization of tools, clean workstations, handling of chemicals like relaxers and dyes, and understanding allergic reactions are all critical professional skills that protect both you and your clients.", background: 'office' },
      { text: "Building a successful beauty business means understanding customer service, pricing your services correctly, managing inventory, and marketing through word of mouth and social media. Many successful salon owners in Liberia started with exactly the skills taught in this course.", background: 'success' },
      { text: "Earn your Cosmetology certificate by completing the lessons and passing the quiz. This LiJOBS credential is recognized by the Ministry of Labor and demonstrates your professional training to clients and employers.", background: 'closing' }
    ]
  },
  {
    id: 'course-electrical',
    title: 'Electrical Installation - Video Lesson',
    description: 'Safe electrical wiring and installation practices for Liberian buildings',
    targetAudience: 'course',
    courseSlug: 'electrical-installation',
    duration: '5-6 minutes',
    script: `Welcome to the Electrical Installation training course. As Liberia expands its electrical grid and more buildings require professional wiring, skilled electricians are in critical demand.`,
    scenes: [
      { text: "Welcome to the Electrical Installation course. Liberia's energy sector is expanding rapidly, with the Liberia Electricity Corporation extending power to more communities each year. Skilled electricians are needed to wire homes, businesses, and public buildings safely and correctly.", background: 'intro' },
      { text: "Electrical safety is our number one priority. You'll learn about voltage, current, and resistance — the three fundamentals of electricity. We'll cover how to use a multimeter, test for live wires, and follow lockout-tagout procedures. Never work on live circuits, and always treat every wire as if it's energized until you verify otherwise.", background: 'technology' },
      { text: "Residential wiring follows specific patterns and codes. You'll learn about circuit breaker panels, proper wire sizing for different loads, grounding and bonding requirements, and how to install outlets, switches, and light fixtures to code. Proper installation prevents fires and protects lives.", background: 'office' },
      { text: "In Liberia, we also work with generators, inverters, and solar power systems alongside grid electricity. Understanding how to safely integrate these power sources, install transfer switches, and wire hybrid systems gives you a competitive advantage in the job market.", background: 'data' },
      { text: "Troubleshooting electrical problems is a valuable skill. We'll teach you systematic approaches to finding faults, reading circuit diagrams, and diagnosing common issues like tripped breakers, flickering lights, and overloaded circuits.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Electrical Installation certificate. This credential is essential for professional electricians and is recognized by the Ministry of Labor through the LiJOBS platform.", background: 'success' }
    ]
  },
  {
    id: 'course-fisheries',
    title: 'Fisheries & Aquaculture - Video Lesson',
    description: 'Sustainable fishing and fish farming practices for Liberian waters',
    targetAudience: 'course',
    courseSlug: 'fisheries-aquaculture',
    duration: '5-6 minutes',
    script: `Welcome to the Fisheries and Aquaculture training course. Liberia's coastline and inland waterways offer tremendous opportunities for sustainable fishing and fish farming.`,
    scenes: [
      { text: "Welcome to the Fisheries and Aquaculture course. With five hundred and seventy-nine kilometers of Atlantic coastline and numerous rivers, Liberia has incredible potential for both ocean fishing and inland aquaculture. This course will teach you modern, sustainable practices for this vital sector.", background: 'intro' },
      { text: "Sustainable fishing practices ensure fish stocks remain healthy for future generations. We'll cover responsible net sizes, seasonal fishing guidelines, species identification, and why protecting breeding grounds and juvenile fish is essential for long-term success in the fishing industry.", background: 'liberia' },
      { text: "Aquaculture — or fish farming — is a growing opportunity in Liberia. You'll learn how to construct fish ponds, select the right species like tilapia and catfish, manage water quality, and feed your fish for optimal growth. A well-managed fish pond can provide both food security and income.", background: 'people' },
      { text: "Post-harvest handling determines the value of your catch. We'll cover proper icing and cold chain management, smoking and drying techniques traditional to Liberia, and how to meet food safety standards that allow you to sell to hotels, restaurants, and markets at premium prices.", background: 'technology' },
      { text: "The business side of fishing is equally important. Understanding market prices, forming fishing cooperatives, maintaining your boats and equipment, and accessing microfinance for expansion are skills that turn fishing from subsistence into a profitable enterprise.", background: 'office' },
      { text: "Earn your Fisheries and Aquaculture certificate by completing the course and passing the quiz. This credential is recognized by the Ministry of Labor and can help you access fisheries programs and employment opportunities.", background: 'success' }
    ]
  },
  {
    id: 'course-hospitality',
    title: 'Hospitality & Catering - Video Lesson',
    description: 'Professional hotel and restaurant service skills for Liberia tourism',
    targetAudience: 'course',
    courseSlug: 'hospitality-catering',
    duration: '5-6 minutes',
    script: `Welcome to the Hospitality and Catering training course. As Liberia's tourism and service industry grows, professional hospitality skills open doors to exciting careers.`,
    scenes: [
      { text: "Welcome to the Hospitality and Catering course. Liberia's hospitality sector is growing with new hotels, restaurants, and tourism services opening across the country. From Monrovia's hotels to eco-lodges in Sapo National Park, trained hospitality professionals are in demand.", background: 'intro' },
      { text: "Customer service excellence is the foundation of hospitality. We'll cover greeting guests professionally, handling complaints with grace, anticipating needs, and creating memorable experiences. In hospitality, every interaction is an opportunity to make a positive impression.", background: 'people' },
      { text: "Food safety and kitchen management are critical skills. You'll learn about food hygiene standards, proper food storage temperatures, safe food handling practices, and kitchen organization. These skills protect your guests and your reputation.", background: 'technology' },
      { text: "Catering and food preparation skills include menu planning, portion control, cooking techniques, and food presentation. We'll focus on both Liberian cuisine — jollof rice, palm butter soup, check rice — and international dishes that hotel guests expect.", background: 'office' },
      { text: "Hotel operations cover front desk management, housekeeping standards, reservation systems, and event coordination. Understanding how all departments work together helps you advance in your hospitality career.", background: 'data' },
      { text: "Complete the lessons and quiz to earn your Hospitality and Catering certificate. This LiJOBS credential is recognized by the Ministry of Labor and demonstrates your readiness for employment in hotels, restaurants, and tourism services across Liberia.", background: 'success' }
    ]
  },
  {
    id: 'course-masonry',
    title: 'Masonry & Building Construction - Video Lesson',
    description: 'Professional building and construction skills for Liberian infrastructure',
    targetAudience: 'course',
    courseSlug: 'masonry-construction',
    duration: '5-6 minutes',
    script: `Welcome to the Masonry and Building Construction training course. Skilled masons are building the future of Liberia, one block at a time.`,
    scenes: [
      { text: "Welcome to the Masonry and Building Construction course. Liberia's construction sector is booming, with housing, commercial buildings, and public infrastructure projects creating demand for skilled masons in every county. This course will give you the professional skills to build strong, lasting structures.", background: 'intro' },
      { text: "Understanding building materials is essential. We'll cover concrete block manufacturing, proper cement mixing ratios, mortar preparation, and how to select quality materials. In Liberia, knowing how to test cement freshness and block strength can mean the difference between a building that lasts decades and one that cracks in the first rainy season.", background: 'technology' },
      { text: "Block laying techniques form the core of masonry work. You'll learn proper foundation preparation, level and plumb techniques, bond patterns for maximum strength, and how to build corners and columns. Precision in these fundamentals is what separates a professional mason from an amateur.", background: 'people' },
      { text: "Plastering and finishing transform rough blockwork into smooth, attractive surfaces. We'll cover sand-cement rendering, float and set techniques, and decorative finishes that add value to any building project.", background: 'office' },
      { text: "Safety on the construction site protects you and your coworkers. Proper scaffolding, personal protective equipment, lifting techniques, and site organization are professional practices that every mason must follow.", background: 'data' },
      { text: "Earn your Masonry and Building Construction certificate by completing the lessons and passing the quiz. This LiJOBS credential is recognized by the Ministry of Labor and opens doors to construction employment across Liberia.", background: 'success' }
    ]
  },
  {
    id: 'course-mobile-repair',
    title: 'Mobile Phone Repair - Video Lesson',
    description: 'Smartphone and mobile device repair skills for the Liberian market',
    targetAudience: 'course',
    courseSlug: 'mobile-phone-repair',
    duration: '5-6 minutes',
    script: `Welcome to the Mobile Phone Repair training course. With millions of mobile phones in use across Liberia, skilled repair technicians are in high demand.`,
    scenes: [
      { text: "Welcome to the Mobile Phone Repair course. Mobile phones are essential tools in Liberia, used for communication, mobile money transfers, and business. With millions of devices in use and limited access to manufacturer service centers, local repair technicians fill a critical need in every community.", background: 'intro' },
      { text: "Understanding phone hardware is your starting point. We'll cover the components inside smartphones — screens, batteries, charging ports, speakers, cameras, and circuit boards. You'll learn to use basic repair tools safely and how to open devices without causing additional damage.", background: 'technology' },
      { text: "Screen replacement is the most common repair. We'll walk you through the process step by step, from heating the adhesive to separating the screen, transferring components, and testing the new display. This single skill can generate steady income for your repair business.", background: 'office' },
      { text: "Battery and charging issues are the second most common problems. You'll learn to diagnose whether the problem is the battery, the charging port, or the charging cable. We'll cover safe battery replacement procedures and how to clean and repair charging ports.", background: 'data' },
      { text: "Software troubleshooting rounds out your skills. Knowing how to factory reset devices, update firmware, remove malware, and recover data makes you a complete mobile technician. We'll also cover responsible data handling and customer privacy.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Mobile Phone Repair certificate. This LiJOBS credential demonstrates your technical skills to customers and is recognized by the Ministry of Labor.", background: 'success' }
    ]
  },
  {
    id: 'course-plumbing',
    title: 'Plumbing & Pipe Fitting - Video Lesson',
    description: 'Water supply and sanitation plumbing skills for Liberian buildings',
    targetAudience: 'course',
    courseSlug: 'plumbing-pipe-fitting',
    duration: '5-6 minutes',
    script: `Welcome to the Plumbing and Pipe Fitting training course. Clean water and proper sanitation are fundamental to public health, and skilled plumbers make it possible.`,
    scenes: [
      { text: "Welcome to the Plumbing and Pipe Fitting course. Access to clean water and proper sanitation is one of Liberia's most important development priorities. Skilled plumbers play a vital role in connecting communities to water supplies, installing sanitation systems, and maintaining the infrastructure that keeps people healthy.", background: 'intro' },
      { text: "Understanding water systems is fundamental. We'll cover how water pressure works, the difference between supply and drainage systems, pipe sizing calculations, and the types of pipes used in Liberia — PVC, galvanized steel, and copper. Each material has its place, and knowing when to use which one is a key professional skill.", background: 'technology' },
      { text: "Pipe cutting, joining, and fitting techniques are the hands-on core of plumbing. You'll learn to cut pipes cleanly, apply solvent cement for PVC joints, thread galvanized pipe, and install fittings like elbows, tees, and valves. Practice these techniques until they become second nature.", background: 'office' },
      { text: "Fixture installation covers toilets, sinks, showers, and water heaters. We'll teach you proper mounting, connection techniques, and how to ensure everything is sealed and leak-free. In Liberia's climate, preventing leaks also means preventing mold and structural damage.", background: 'people' },
      { text: "Drainage and sanitation systems are equally important. You'll learn about proper slope for drain pipes, vent pipe requirements, septic system basics, and how to ensure wastewater flows safely away from living spaces.", background: 'data' },
      { text: "Earn your Plumbing certificate by completing the lessons and passing the quiz. This LiJOBS credential is recognized by the Ministry of Labor and qualifies you for plumbing work on construction projects across Liberia.", background: 'success' }
    ]
  },
  {
    id: 'course-solar',
    title: 'Solar Panel Installation - Video Lesson',
    description: 'Renewable energy installation skills for Liberian communities',
    targetAudience: 'course',
    courseSlug: 'solar-panel-installation',
    duration: '5-6 minutes',
    script: `Welcome to the Solar Panel Installation training course. Solar energy is transforming how Liberian communities access electricity, and trained installers are leading this revolution.`,
    scenes: [
      { text: "Welcome to the Solar Panel Installation course. Liberia receives abundant sunshine year-round, making solar energy one of the most practical solutions for our energy needs. With many communities still awaiting grid connection, solar installations provide immediate access to clean, reliable electricity.", background: 'intro' },
      { text: "Understanding solar fundamentals is essential. We'll cover how photovoltaic cells convert sunlight to electricity, the components of a solar system — panels, charge controllers, batteries, and inverters — and how to calculate the right system size for a home, business, or community facility.", background: 'technology' },
      { text: "Site assessment determines installation success. You'll learn to evaluate roof strength and orientation, identify shading issues, measure available space, and calculate expected energy production based on Liberia's solar irradiance patterns. A proper assessment prevents costly mistakes.", background: 'data' },
      { text: "Installation techniques cover panel mounting, wiring connections, battery bank setup, and inverter configuration. We'll emphasize waterproofing, proper grounding, and cable management — details that determine whether a system lasts five years or twenty-five years.", background: 'office' },
      { text: "Maintenance and troubleshooting keep systems running at peak performance. Regular panel cleaning, battery maintenance, and system monitoring are services that create ongoing income. We'll also cover common problems like corroded connections, charge controller faults, and inverter errors.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Solar Panel Installation certificate. As one of the fastest-growing sectors in Liberia, solar energy offers excellent career prospects. This LiJOBS credential is recognized by the Ministry of Labor.", background: 'success' }
    ]
  },
  {
    id: 'course-tailoring',
    title: 'Tailoring & Fashion Design - Video Lesson',
    description: 'Professional garment construction and fashion design for Liberian markets',
    targetAudience: 'course',
    courseSlug: 'tailoring-fashion-design',
    duration: '5-6 minutes',
    script: `Welcome to the Tailoring and Fashion Design training course. From traditional Liberian garments to modern fashion, skilled tailors are always in demand.`,
    scenes: [
      { text: "Welcome to the Tailoring and Fashion Design course. Liberia has a rich tradition of beautiful clothing, from traditional country cloth to modern African fashion. Skilled tailors and designers are essential in every community, providing custom-made clothing, alterations, and creative designs that celebrate our culture.", background: 'intro' },
      { text: "Mastering the sewing machine is your first step. We'll cover machine setup, threading, tension adjustment, and maintenance. You'll learn different stitch types — straight, zigzag, overlock — and when to use each one. A well-maintained machine and proper technique are the foundation of quality tailoring.", background: 'technology' },
      { text: "Taking accurate measurements and creating patterns separate professional tailors from amateurs. We'll teach you body measurement techniques, basic pattern drafting, and how to modify standard patterns to fit individual body shapes. Precision in measurement means satisfied customers who return again and again.", background: 'people' },
      { text: "Fabric selection and cutting require knowledge and skill. You'll learn about different fabric types — cotton, linen, ankara, lace — their properties, and how to lay out patterns to minimize waste. Proper cutting technique ensures clean edges and makes sewing much easier.", background: 'office' },
      { text: "Garment construction brings everything together. We'll cover assembling garments, installing zippers, sewing buttonholes, hemming, and finishing techniques that give your work a professional look. We'll also touch on design principles and how to develop your own signature style.", background: 'data' },
      { text: "Earn your Tailoring and Fashion Design certificate by completing the lessons and passing the quiz. This LiJOBS credential is recognized by the Ministry of Labor and demonstrates your professional skills to clients and employers.", background: 'success' }
    ]
  },
  {
    id: 'course-welding',
    title: 'Welding & Metal Fabrication - Video Lesson',
    description: 'Professional welding and metalwork skills for Liberian industry',
    targetAudience: 'course',
    courseSlug: 'welding-metal-fabrication',
    duration: '5-6 minutes',
    script: `Welcome to the Welding and Metal Fabrication training course. Welders build the steel structures, gates, and equipment that support Liberia's growing economy.`,
    scenes: [
      { text: "Welcome to the Welding and Metal Fabrication course. From building construction and vehicle repair to gate fabrication and furniture making, welding is one of the most versatile and in-demand trades in Liberia. Skilled welders can find work in construction, manufacturing, and self-employment.", background: 'intro' },
      { text: "Welding safety must always come first. The intense heat, bright arc, harmful fumes, and electrical hazards of welding require strict safety practices. We'll cover proper use of welding helmets, gloves, and protective clothing, adequate ventilation, fire prevention, and electrical safety procedures.", background: 'technology' },
      { text: "Arc welding, also called stick welding, is the most common welding method in Liberia. You'll learn electrode selection for different metals and joint types, proper machine settings, striking and maintaining the arc, and techniques for flat, horizontal, and vertical welding positions.", background: 'office' },
      { text: "Metal fabrication skills complement your welding ability. We'll cover measuring and marking metal, cutting with hacksaws, angle grinders, and oxy-fuel torches, bending and shaping techniques, and how to read basic fabrication drawings. These skills let you create complete projects from start to finish.", background: 'data' },
      { text: "Quality control ensures your welds are strong and reliable. We'll teach you visual inspection techniques, common weld defects and how to avoid them, and basic destructive testing methods. Professional-quality welds protect lives and build your reputation.", background: 'people' },
      { text: "Complete the lessons and quiz to earn your Welding and Metal Fabrication certificate. This LiJOBS credential is recognized by the Ministry of Labor and qualifies you for welding positions in construction, manufacturing, and fabrication across Liberia.", background: 'success' }
    ]
  },
  // ==================== MINISTRY OF LABOR STAFF TRAINING VIDEOS ====================
  {
    id: 'mol-data-collection',
    title: 'Data Collection & Entry Training for MOL Staff',
    description: 'Step-by-step training for Ministry enumerators on collecting and entering employment data in LiJOBS',
    targetAudience: 'ministry',
    duration: '8-10 minutes',
    script: `Welcome to the Ministry of Labor Data Collection and Entry training. As a Ministry enumerator or data entry staff member, your work is the foundation of Liberia's official employment statistics.`,
    scenes: [
      { text: "Welcome to the Ministry of Labor Data Collection and Entry training. As a Ministry enumerator or data entry staff member, your work forms the foundation of Liberia's official employment statistics. Every record you enter into LiJOBS becomes part of the national picture of job creation, used by the Minister, international partners like the ILO and World Bank, and policymakers to make decisions that affect millions of Liberians.", background: 'intro' },
      { text: "Let's start with what an employment spell is. An employment spell is a period of time that a person works for a specific employer in a specific job. It tracks the worker's identity including name, age, gender, county, and district. It records the employer's company name, sector, and registration status. It captures job details like title, ISCO occupation code, and ISIC industry code. And it tracks dates, employment type, and wage information.", background: 'data' },
      { text: "Field collection protocol. When visiting an employer or worksite, first introduce yourself with your Ministry ID and explain the purpose of data collection. Request to speak with the HR manager or business owner. Collect the employer's registration details first. For each worker, record all required fields, never leave fields blank. Cross-check worker counts with payroll records where available. Have the employer sign the verification form. Note any discrepancies or concerns in the comments field.", background: 'people' },
      { text: "Creating employment spells in LiJOBS. Log into LiJOBS with your enumerator credentials. From your dashboard, click Report New Jobs. Enter the worker's full legal name, gender, date of birth, county and district where they work. Then enter employer details, either by searching for an existing employer or creating a new record. Enter job details including the job title, ISCO-08 code using the lookup tool, employment type whether formal or informal, and the monthly wage in the correct currency.", background: 'technology' },
      { text: "Common mistakes to avoid. Never enter approximate dates, always ask for the actual start date. Use the correct ISCO code by referring to the code lookup tool in LiJOBS. Always include both county and district for every record. Confirm whether wages are in Liberian Dollars or US Dollars. Never duplicate records for the same worker at the same employer. If you discover an error, do not create a new record. Find the original record, click Edit, and correct the specific field.", background: 'office' },
      { text: "Data quality is critical. LiJOBS calculates a data quality score for every batch of records based on completeness, consistency, uniqueness, and timeliness. Your goal should be a score above ninety percent for every submission batch. The most common error is duplicate records, which happens when the same worker is entered twice or two enumerators visit the same worksite. Always search for existing records before creating new ones.", background: 'data' },
      { text: "After submission, each record enters the three-layer verification pipeline. First, the employer confirms the worker is employed. Then an enumerator conducts a field verification. Finally, the Director of Statistics gives final approval. This verification process is what gives LiJOBS data its trustworthiness and credibility with international partners.", background: 'government' },
      { text: "Your work directly impacts the quality of Liberia's employment data. Accurate data collection helps the government design better employment policies, helps international partners target their interventions, and helps all Liberians see the true picture of job creation in our country. Thank you for your commitment to accuracy and integrity.", background: 'success' }
    ]
  },
  {
    id: 'mol-statistical-literacy',
    title: 'Statistical Literacy for Ministry Officials',
    description: 'Training on understanding labour market statistics, reading charts, and presenting data to stakeholders',
    targetAudience: 'ministry',
    duration: '8-10 minutes',
    script: `Welcome to Statistical Literacy training for Ministry of Labor officials. As a Ministry official, you will regularly need to understand, explain, and present labour market statistics to the Minister, Cabinet, Parliament, and international partners.`,
    scenes: [
      { text: "Welcome to Statistical Literacy training for Ministry of Labor officials. You will regularly need to understand, explain, and present labour market statistics to the Minister, Cabinet, Parliament, and international partners such as the ILO, World Bank, and UNDP. This training ensures you can do so with confidence and accuracy.", background: 'intro' },
      { text: "Key labour market indicators you must understand. The Employment Rate is the percentage of working-age population that is currently employed. The Unemployment Rate is the percentage of the labour force actively seeking work but unable to find it. The Underemployment Rate captures people working fewer hours than they want or in jobs below their skill level. The Job Creation Rate tracks new employment spells created in a given period. And the Informality Rate measures the percentage of employment that is informal.", background: 'data' },
      { text: "Understanding charts in LiJOBS. Bar charts compare values across categories like employment by county. Always check the y-axis scale. Line charts show trends over time. An upward slope means increasing, downward means decreasing. Sudden spikes or dips deserve investigation. Pie charts show composition, like the percentage of employment in each sector. Scatter plots show relationships between two variables. Points far from clusters are outliers worth investigating.", background: 'technology' },
      { text: "Common mistakes in chart interpretation. Correlation does not mean causation. Just because two things move together does not mean one causes the other. Avoid cherry-picking time periods that make trends look better or worse than reality. Always use consistent time periods. Ignore sample size at your peril. A fifty percent increase from two to three is not meaningful. And remember seasonal effects. Always compare the same month year over year, not consecutive months.", background: 'office' },
      { text: "Presenting data to different audiences. For the Minister, lead with the most important number and keep it to three to five key points. For Parliament, show before-and-after comparisons and county-level breakdowns. For international partners like ILO and World Bank, emphasize methodology, sample sizes, and confidence intervals. Reference the Statistical Rigor section. For media and the public, use simple relatable numbers like one in five Liberians found new employment this year.", background: 'government' },
      { text: "The data story framework. Every presentation should tell a story in three parts. Where we were, the baseline. Where we are, current numbers and trends. And where we are going, projections and policy implications. For example, last year Liberia had forty-five thousand formal employment records. Today we have sixty-two thousand, a thirty-eight percent increase. Based on current trends, we project eighty thousand by next year.", background: 'data' },
      { text: "Using LiJOBS for presentations. Generate export-ready reports by going to Reports, selecting data type, applying county and sector filters, and exporting as Excel or CSV. Use the Labour Market Indicators dashboard for ready-made interactive charts. Use the Statistical Rigor section to reference methodology and confidence intervals. When presenting, state that data comes from verified administrative records with a three-layer verification process.", background: 'technology' },
      { text: "Your ability to accurately interpret and communicate labour market data strengthens Liberia's evidence-based policymaking and builds trust with international development partners. Thank you for investing in your statistical literacy.", background: 'success' }
    ]
  },
  {
    id: 'mol-platform-guide',
    title: 'LiJOBS Complete Platform Guide for MOL Staff',
    description: 'Interactive guide covering every feature of LiJOBS for Ministry of Labor employees',
    targetAudience: 'ministry',
    duration: '10-12 minutes',
    script: `Welcome to the complete LiJOBS platform guide for Ministry of Labor staff. This training covers every feature of the system that you need to know.`,
    scenes: [
      { text: "Welcome to the complete LiJOBS platform guide for Ministry of Labor staff. This training covers every feature of the system you need to know, from the Jobs Observatory and Labour Exchange to Grievances, the Knowledge Base, Reports, and the Director Dashboard. Let us walk through the entire platform.", background: 'intro' },
      { text: "The Jobs Observatory is the heart of LiJOBS. It tracks every employment spell in Liberia, showing who is working, where, for whom, doing what, and for how long. You can browse employment records with filters for county, sector, occupation, and verification status. Each record shows the worker, employer, job details, dates, and trust score. The trust score from zero to one indicates how well-verified a record is.", background: 'data' },
      { text: "The Labour Market Indicators dashboard provides comprehensive analytics across five tabs. Unemployment rates by county with gender and urban-rural breakdowns. Employment statistics with combined bar and line charts. Underemployment analysis. Jobs creation trends showing formal versus informal employment. And job seeker demographics. All data can be exported as CSV for further analysis.", background: 'technology' },
      { text: "The Labour Exchange connects employers and job seekers. Employers post vacancies with job requirements. Job seekers browse and apply. Our matching algorithm scores seekers against vacancies based on skills, location, sector preference, and experience. Ministry staff can view all vacancies and applications to monitor the labour market.", background: 'people' },
      { text: "The Economic Indicators page tracks the Consumer Price Index using a basket of twenty everyday goods across all fifteen counties. It shows cost of living comparisons and wage affordability analysis. The Occupational Economics page provides deep analytics on wages by occupation, demand trends, skills gap analysis, and employment projections. The Statistical Rigor section covers data quality checks, sampling frameworks, seasonal adjustment, and confidence intervals.", background: 'data' },
      { text: "The Grievance System allows citizens to file complaints without needing an account. Categories include wage disputes, unsafe working conditions, child labour, discrimination, and wrongful termination. Each complaint gets a tracking number. Ministry staff can view, investigate, and resolve complaints. The Knowledge Base stores policy documents, research reports, ILO publications, and ministry guidelines.", background: 'government' },
      { text: "The Workplace Safety system enables citizens to report workplace incidents including injuries, fatalities, and near-misses. The safety dashboard shows aggregate statistics by sector and county, helping identify high-risk industries for targeted inspections. Reports and Exports allow you to generate downloadable data in Excel or CSV format for employment spells, vacancies, employers, job seekers, and applications.", background: 'office' },
      { text: "Administrative features available to ministry staff include the verification workflow with three layers: employer sign-off, enumerator field check, and director approval. The Director Dashboard provides system-wide statistics, verification pipeline status, overdue alerts, and officer performance metrics. The Course Catalog offers training courses with lessons, quizzes, and certification for continuous staff development.", background: 'technology' },
      { text: "You now have a complete overview of the LiJOBS platform. Explore each section using the navigation menu. Remember that your role determines which features you can access. For additional help, visit the Methodology page or contact your system administrator. Thank you for being part of Liberia's employment data transformation.", background: 'success' }
    ]
  },
  {
    id: 'mol-verification-procedures',
    title: 'Verification & Trust Score Procedures for MOL Staff',
    description: 'Training on the three-layer employment verification workflow and trust score system',
    targetAudience: 'ministry',
    duration: '8-10 minutes',
    script: `Welcome to the Verification and Trust Score Procedures training. As Ministry of Labor staff, you play a critical role in Liberia's three-layer employment verification system.`,
    scenes: [
      { text: "Welcome to the Verification and Trust Score Procedures training. As Ministry of Labor staff, you play a critical role in Liberia's three-layer employment verification system. This system is what makes LiJOBS data trustworthy and distinguishes it from unverified survey estimates. International partners specifically cite our verification process as best practice.", background: 'intro' },
      { text: "The three layers of verification. Layer one is employer sign-off, where the employer confirms the worker is or was employed with the stated job title and dates. Layer two is enumerator field check, where a county enumerator physically visits the workplace to verify the employment. Layer three is director approval, where the Director of Statistics reviews and gives final sign-off on the verified record.", background: 'government' },
      { text: "Your verification dashboard. When you log in, your pending verification queue is prominently displayed. The number in red indicates submissions waiting for review. The goal is to process verifications within forty-eight hours. The queue is organized by submission date with oldest items first. You can filter by sector, county, or employer to focus on specific types of submissions.", background: 'technology' },
      { text: "Walking through a verification. Click on any item in your queue to open details. Check the employer's legitimacy and registration status. Review whether the job title matches the sector classification. Verify the wage is reasonable for this type of work. Check that dates are logical. Look for suspicious patterns like end dates before start dates or very high employee counts from small businesses. For public sector, cross-reference against government payroll records.", background: 'data' },
      { text: "The Trust Score system. Every employment record receives a trust score between zero and one. The score considers the verification level, whether all three layers are complete. It accounts for employer reputation based on their historical accuracy. Data completeness matters, with more fields filled earning higher scores. Consistency with similar records in the same sector and county is evaluated. And timeliness of reporting affects the score.", background: 'office' },
      { text: "Handling verification decisions. If everything checks out, click Verify and add a brief note explaining your verification, such as confirmed against ministry payroll records. If you find problems, click Reject with a detailed reason so the submitter knows what to correct. If you need more information, use Request Information to ask for documentation. Flag submissions for administrator review only for genuinely concerning cases like suspected fraud.", background: 'people' },
      { text: "Dispute resolution. When an employer or worker disputes a verification decision, follow this process. Review the original submission and your verification notes. Request additional supporting documentation. If needed, schedule a second field visit with a different enumerator. Document the resolution in the system. Escalate unresolved disputes to the Director of Statistics.", background: 'government' },
      { text: "Your verification work directly impacts the credibility of Liberia's employment statistics. Consistent, thorough, and timely verifications build the trust that makes LiJOBS the authoritative source for employment data in Liberia. Track your performance using the metrics panel and aim for processing within forty-eight hours. Thank you for your diligence.", background: 'success' }
    ]
  },
  {
    id: 'mol-economic-analytics',
    title: 'Economic Indicators & Occupational Analytics Training',
    description: 'Advanced training on CPI data, wage affordability, occupational demand trends, and employment projections for senior MOL staff',
    targetAudience: 'ministry',
    duration: '10-12 minutes',
    script: `Welcome to the Economic Indicators and Occupational Analytics training. This advanced course is designed for senior Ministry staff and the Director of Statistics.`,
    scenes: [
      { text: "Welcome to the Economic Indicators and Occupational Analytics training. This advanced course is designed for senior Ministry staff and the Director of Statistics. You will learn how to interpret CPI data, analyze wage affordability, understand occupational demand trends, identify skills gaps, and use employment projections for policy planning.", background: 'intro' },
      { text: "Consumer Price Index and inflation tracking. LiJOBS collects prices for a basket of twenty everyday goods across all fifteen counties every month. The CPI is calculated by comparing current basket costs to a base period. The Economic Indicators page shows national and county-level CPI, allowing you to identify which counties are experiencing higher inflation and how it affects workers.", background: 'data' },
      { text: "Wage affordability analysis. The system compares average wages in each county against the local cost of living basket. The affordability ratio tells you whether wages keep up with prices. A ratio above one means workers can afford the basic basket. Below one means they cannot. This is critical data for minimum wage policy discussions and county-level interventions.", background: 'office' },
      { text: "Occupational Economics provides five analytical tabs. Wage by Occupation shows average salaries broken down by ISCO code and county, revealing which occupations pay best and where. Occupation Demand Trends tracks which occupations are growing or declining based on employment spell creation rates. This helps predict future labour market needs.", background: 'technology' },
      { text: "Skills Gap Analysis compares the skills that job seekers have against the skills that employers demand in their vacancies. This reveals training opportunities. If employers need welding but few seekers have that skill, the Ministry can prioritize welding training programs. Employment Projections use linear trend analysis to forecast future employment by sector and occupation.", background: 'data' },
      { text: "The Injury and Risk by Occupation tab shows workplace safety incident rates by sector and county. High-risk occupations like mining and construction can be identified for targeted safety inspections and policy interventions. Cross-reference this with the Workplace Safety dashboard for detailed incident reports.", background: 'people' },
      { text: "Statistical Rigor for economic analysis. The Statistical Rigor section provides the methodology behind all calculations. Automated quality checks flag duplicates, impossible dates, wage outliers, and unusual headcounts. Sampling frameworks use Cochran's formula for proper sample sizing. Seasonal adjustment removes predictable patterns to reveal underlying trends. Confidence intervals show the reliability of estimates.", background: 'technology' },
      { text: "Using the Data Hub. The Economic Data Hub at the Data Hub page provides centralized access to all economic data. The Geographic Information panel shows county-level statistics on an interactive map. The LRD Inflation Calculator lets you calculate purchasing power changes over time. Latest Numbers shows key indicators at a glance. Use this as your starting point for any economic analysis or presentation.", background: 'data' },
      { text: "You now have the tools to provide sophisticated economic analysis to support Ministry decision-making. Use these analytics to advise on minimum wage policy, target training programs to close skills gaps, identify counties needing economic intervention, and demonstrate evidence-based governance to international partners. Thank you for strengthening Liberia's economic data capacity.", background: 'success' }
    ]
  },
];

export function getScriptsByAudience(audience: VideoScript['targetAudience']): VideoScript[] {
  return videoScripts.filter(script => script.targetAudience === audience);
}

export function getPublicScripts(): VideoScript[] {
  return videoScripts.filter(script => script.targetAudience === 'public');
}

export function getAllScripts(): VideoScript[] {
  return videoScripts;
}

export function getCourseScripts(): VideoScript[] {
  return videoScripts.filter(script => script.targetAudience === 'course');
}

export function getCourseScriptBySlug(courseSlug: string): VideoScript | undefined {
  return videoScripts.find(script => script.targetAudience === 'course' && script.courseSlug === courseSlug);
}
