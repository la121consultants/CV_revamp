export interface SkillItem {
  name: string;
  proficiency?: 1 | 2 | 3 | 4 | 5;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  qualification: string;
  startDate: string;
  endDate: string;
  details: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  year: string;
}

export interface ProjectItem {
  name: string;
  link?: string;
  bullets: string[];
}

export interface LanguageItem {
  name: string;
  level: string;
}

export interface CVData {
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    portfolio: string;
    summary: string;
    photoUrl?: string;
  };
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications?: CertificationItem[];
  projects?: ProjectItem[];
  languages?: LanguageItem[];
  hobbies?: string[];
}
