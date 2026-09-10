import { db } from "./db";
import { vacancies, employers, jobSeekerProfiles, persons, personSkills, skills } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

interface MatchScore {
  vacancyId: string;
  vacancyTitle: string;
  employerName: string;
  sector: string;
  county: string | null;
  contractType: string;
  score: number;
  matchReasons: string[];
}

interface SeekerMatchScore {
  personId: string;
  personUid: string;
  headline: string | null;
  county: string | null;
  highestEducation: string | null;
  yearsExperience: string | null;
  score: number;
  matchReasons: string[];
}

const EDUCATION_LEVELS: Record<string, number> = {
  none: 0,
  primary: 1,
  secondary: 2,
  vocational: 3,
  tertiary: 4,
  postgraduate: 5,
};

export async function matchJobSeekerToVacancies(personId: string): Promise<MatchScore[]> {
  const [profile] = await db
    .select()
    .from(jobSeekerProfiles)
    .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id))
    .where(eq(jobSeekerProfiles.personId, personId));

  if (!profile) {
    return [];
  }

  const seekerSkills = await db
    .select({ skillName: skills.name })
    .from(personSkills)
    .innerJoin(skills, eq(personSkills.skillId, skills.id))
    .where(eq(personSkills.personId, personId));

  const skillNames = seekerSkills.map((s) => s.skillName.toLowerCase());

  const openVacancies = await db
    .select({
      id: vacancies.id,
      title: vacancies.title,
      employerName: employers.legalName,
      sector: employers.sector,
      county: vacancies.county,
      contractType: vacancies.contractType,
      requiredEducation: vacancies.requiredEducation,
      requiredExperience: vacancies.requiredExperience,
      requiredSkills: vacancies.requiredSkills,
    })
    .from(vacancies)
    .innerJoin(employers, eq(vacancies.employerId, employers.id))
    .where(eq(vacancies.status, "open"));

  const matches: MatchScore[] = [];

  for (const vacancy of openVacancies) {
    let score = 0;
    const matchReasons: string[] = [];

    if (
      profile.job_seeker_profiles.preferredSectors &&
      profile.job_seeker_profiles.preferredSectors.includes(vacancy.sector)
    ) {
      score += 25;
      matchReasons.push("Preferred sector match");
    }

    if (vacancy.county && profile.persons.county === vacancy.county) {
      score += 20;
      matchReasons.push("Location match");
    } else if (
      vacancy.county &&
      profile.job_seeker_profiles.preferredCounties?.includes(vacancy.county)
    ) {
      score += 15;
      matchReasons.push("Preferred location");
    } else if (profile.job_seeker_profiles.willingToRelocate) {
      score += 5;
      matchReasons.push("Willing to relocate");
    }

    if (vacancy.requiredEducation && profile.job_seeker_profiles.highestEducation) {
      const requiredLevel = EDUCATION_LEVELS[vacancy.requiredEducation] || 0;
      const seekerLevel = EDUCATION_LEVELS[profile.job_seeker_profiles.highestEducation] || 0;
      if (seekerLevel >= requiredLevel) {
        score += 20;
        matchReasons.push("Education requirement met");
      }
    }

    if (vacancy.requiredExperience !== null && profile.job_seeker_profiles.yearsExperience) {
      const seekerExp = parseFloat(profile.job_seeker_profiles.yearsExperience);
      if (seekerExp >= vacancy.requiredExperience) {
        score += 15;
        matchReasons.push("Experience requirement met");
      }
    }

    if (vacancy.requiredSkills && vacancy.requiredSkills.length > 0) {
      const requiredSkillsLower = vacancy.requiredSkills.map((s) => s.toLowerCase());
      const matchedSkills = requiredSkillsLower.filter((rs) =>
        skillNames.some((sn) => sn.includes(rs) || rs.includes(sn))
      );
      if (matchedSkills.length > 0) {
        const skillScore = Math.min(20, (matchedSkills.length / requiredSkillsLower.length) * 20);
        score += skillScore;
        matchReasons.push(`${matchedSkills.length}/${requiredSkillsLower.length} skills matched`);
      }
    }

    if (score > 0) {
      matches.push({
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        employerName: vacancy.employerName,
        sector: vacancy.sector,
        county: vacancy.county,
        contractType: vacancy.contractType,
        score: Math.min(100, score),
        matchReasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

export async function matchVacancyToSeekers(vacancyId: string): Promise<SeekerMatchScore[]> {
  const [vacancy] = await db
    .select({
      id: vacancies.id,
      sector: employers.sector,
      county: vacancies.county,
      requiredEducation: vacancies.requiredEducation,
      requiredExperience: vacancies.requiredExperience,
      requiredSkills: vacancies.requiredSkills,
    })
    .from(vacancies)
    .innerJoin(employers, eq(vacancies.employerId, employers.id))
    .where(eq(vacancies.id, vacancyId));

  if (!vacancy) {
    return [];
  }

  const seekers = await db
    .select({
      personId: persons.id,
      personUid: persons.personUid,
      county: persons.county,
      headline: jobSeekerProfiles.headline,
      highestEducation: jobSeekerProfiles.highestEducation,
      yearsExperience: jobSeekerProfiles.yearsExperience,
      preferredSectors: jobSeekerProfiles.preferredSectors,
      preferredCounties: jobSeekerProfiles.preferredCounties,
      willingToRelocate: jobSeekerProfiles.willingToRelocate,
    })
    .from(jobSeekerProfiles)
    .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id))
    .where(eq(jobSeekerProfiles.isOpenToWork, true));

  const allPersonSkills = await db
    .select({
      personId: personSkills.personId,
      skillName: skills.name,
    })
    .from(personSkills)
    .innerJoin(skills, eq(personSkills.skillId, skills.id));

  const skillsByPerson = new Map<string, string[]>();
  for (const ps of allPersonSkills) {
    if (!skillsByPerson.has(ps.personId)) {
      skillsByPerson.set(ps.personId, []);
    }
    skillsByPerson.get(ps.personId)!.push(ps.skillName.toLowerCase());
  }

  const matches: SeekerMatchScore[] = [];

  for (const seeker of seekers) {
    let score = 0;
    const matchReasons: string[] = [];

    if (seeker.preferredSectors && seeker.preferredSectors.includes(vacancy.sector)) {
      score += 25;
      matchReasons.push("Sector preference match");
    }

    if (vacancy.county && seeker.county === vacancy.county) {
      score += 20;
      matchReasons.push("Location match");
    } else if (vacancy.county && seeker.preferredCounties?.includes(vacancy.county)) {
      score += 15;
      matchReasons.push("Preferred location match");
    } else if (seeker.willingToRelocate) {
      score += 5;
      matchReasons.push("Willing to relocate");
    }

    if (vacancy.requiredEducation && seeker.highestEducation) {
      const requiredLevel = EDUCATION_LEVELS[vacancy.requiredEducation] || 0;
      const seekerLevel = EDUCATION_LEVELS[seeker.highestEducation] || 0;
      if (seekerLevel >= requiredLevel) {
        score += 20;
        matchReasons.push("Education qualified");
      }
    }

    if (vacancy.requiredExperience !== null && seeker.yearsExperience) {
      const seekerExp = parseFloat(seeker.yearsExperience);
      if (seekerExp >= vacancy.requiredExperience) {
        score += 15;
        matchReasons.push("Experience qualified");
      }
    }

    const seekerSkills = skillsByPerson.get(seeker.personId) || [];
    if (vacancy.requiredSkills && vacancy.requiredSkills.length > 0 && seekerSkills.length > 0) {
      const requiredSkillsLower = vacancy.requiredSkills.map((s) => s.toLowerCase());
      const matchedSkills = requiredSkillsLower.filter((rs) =>
        seekerSkills.some((sn) => sn.includes(rs) || rs.includes(sn))
      );
      if (matchedSkills.length > 0) {
        const skillScore = Math.min(20, (matchedSkills.length / requiredSkillsLower.length) * 20);
        score += skillScore;
        matchReasons.push(`${matchedSkills.length}/${requiredSkillsLower.length} skills matched`);
      }
    }

    if (score > 0) {
      matches.push({
        personId: seeker.personId,
        personUid: seeker.personUid,
        headline: seeker.headline,
        county: seeker.county,
        highestEducation: seeker.highestEducation,
        yearsExperience: seeker.yearsExperience,
        score: Math.min(100, score),
        matchReasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

export async function getTopMatchesForAllSeekers(limit: number = 5): Promise<{
  personId: string;
  personUid: string;
  matches: MatchScore[];
}[]> {
  const seekers = await db
    .select({ personId: jobSeekerProfiles.personId })
    .from(jobSeekerProfiles)
    .innerJoin(persons, eq(jobSeekerProfiles.personId, persons.id))
    .where(eq(jobSeekerProfiles.isOpenToWork, true))
    .limit(50);

  const results: { personId: string; personUid: string; matches: MatchScore[] }[] = [];

  for (const seeker of seekers) {
    const matches = await matchJobSeekerToVacancies(seeker.personId);
    const [person] = await db.select().from(persons).where(eq(persons.id, seeker.personId));
    if (matches.length > 0 && person) {
      results.push({
        personId: seeker.personId,
        personUid: person.personUid,
        matches: matches.slice(0, limit),
      });
    }
  }

  return results;
}
