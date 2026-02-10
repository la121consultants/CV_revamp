// CV Data Model - MANDATORY fields for all templates

export interface SkillItem {
  name: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  qualification: string;
  startDate: string;
  endDate: string;
  details?: string[];
}

export interface CVData {
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    location: string;
    phone: string;
    email: string;
    linkedin?: string;
    portfolio?: string;
    summary: string;
  };
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export interface CVTheme {
  primary: string;
  primaryContrast: string;
  primaryLight: string;
  sidebar: string;
  sidebarText: string;
  border: string;
  muted: string;
}

// sampleCVData removed — use parseCVDataFromMarkdown or emptyCVData from @/utils/parseCVData
