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

// Sample CV data for template previews
export const sampleCVData: CVData = {
  personal: {
    firstName: "Alexandra",
    lastName: "Mitchell",
    title: "Senior Product Manager",
    location: "London, UK",
    phone: "+44 7700 900123",
    email: "alexandra.mitchell@email.com",
    linkedin: "linkedin.com/in/alexandramitchell",
    portfolio: "alexandramitchell.com",
    summary: "Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative digital products. Proven track record of increasing user engagement by 45% and driving £2M+ in annual revenue growth. Expert in Agile methodologies, data-driven decision making, and stakeholder management.",
  },
  skills: [
    { name: "Product Strategy" },
    { name: "Agile & Scrum" },
    { name: "User Research" },
    { name: "Data Analytics" },
    { name: "Stakeholder Management" },
    { name: "Roadmap Planning" },
    { name: "A/B Testing" },
    { name: "SQL & Tableau" },
  ],
  experience: [
    {
      company: "TechVentures Ltd",
      role: "Senior Product Manager",
      location: "London",
      startDate: "Jan 2021",
      endDate: "Present",
      bullets: [
        "Led product strategy for flagship SaaS platform serving 50,000+ users",
        "Increased user retention by 35% through data-driven feature prioritisation",
        "Managed cross-functional team of 12 engineers, designers, and analysts",
      ],
    },
    {
      company: "Digital Innovations Co",
      role: "Product Manager",
      location: "Manchester",
      startDate: "Mar 2018",
      endDate: "Dec 2020",
      bullets: [
        "Launched 3 successful products generating £1.2M in first-year revenue",
        "Implemented customer feedback loops reducing churn by 25%",
        "Collaborated with C-suite to align product vision with business goals",
      ],
    },
  ],
  education: [
    {
      institution: "University of Cambridge",
      qualification: "MBA, Business Administration",
      startDate: "2016",
      endDate: "2018",
      details: ["Specialisation in Technology Management", "Dean's List Honours"],
    },
    {
      institution: "University of Edinburgh",
      qualification: "BSc Computer Science",
      startDate: "2012",
      endDate: "2016",
      details: ["First Class Honours"],
    },
  ],
};
