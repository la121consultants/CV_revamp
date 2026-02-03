import { useMemo, useState } from "react";
import type { CVData } from "@/types/cv";
import { StandardTemplate } from "@/templates/StandardTemplate";
import { AestheticTemplate } from "@/templates/AestheticTemplate";
import { BoujeeTemplate } from "@/templates/BoujeeTemplate";
import { TemplateSwitcher, TemplateName } from "@/components/TemplateSwitcher";
import { exportToPDF } from "@/utils/exportToPDF";
import { exportToDOCX } from "@/utils/exportToDOCX";
import styles from "./App.module.css";

const sampleCVData: CVData = {
  personal: {
    firstName: "Marion",
    lastName: "Brando",
    title: "Senior Product & Delivery Lead",
    location: "London, UK",
    phone: "+44 7000 000 000",
    email: "marion.brando@email.com",
    linkedin: "linkedin.com/in/marionbrando",
    portfolio: "marionbrando.com",
    summary:
      "A highly proactive individual with 10 years of experience in product delivery and transformation across regulated industries. Trusted by stakeholders to turn complex requirements into scalable roadmaps, Marion blends analytical rigor with a people-first approach. Known for shaping multi-million-pound programmes, translating strategy into measurable outcomes, and coaching cross-functional squads to perform at their best. Adept at balancing business priorities with customer experience, while maintaining clear documentation and risk controls. Skilled in Agile delivery, portfolio planning, and stakeholder engagement, with a proven track record of improving operational efficiency, product adoption, and customer satisfaction metrics.",
    photoUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=320&h=320&q=80",
  },
  skills: [
    { name: "Product Strategy", proficiency: 5 },
    { name: "Delivery Management", proficiency: 5 },
    { name: "Stakeholder Engagement", proficiency: 4 },
    { name: "Agile & Scrum", proficiency: 4 },
    { name: "Data Storytelling", proficiency: 4 },
    { name: "Risk Management", proficiency: 3 },
  ],
  experience: [
    {
      company: "Northbridge Digital",
      role: "Senior Product Manager",
      location: "London",
      startDate: "2020",
      endDate: "Present",
      bullets: [
        "Led a £6M digital transformation programme delivering a unified customer portal across three business units.",
        "Optimised backlog prioritisation using KPI-driven scorecards, improving release predictability by 28%.",
        "Partnered with engineering and design to launch a subscription model that increased ARR by 18%.",
      ],
    },
    {
      company: "Harborline Financial",
      role: "Delivery Lead",
      location: "Manchester",
      startDate: "2016",
      endDate: "2020",
      bullets: [
        "Coordinated a multi-vendor migration to cloud infrastructure with zero downtime during cutover.",
        "Introduced governance rhythms that reduced delivery risk by 22% and improved stakeholder confidence.",
        "Mentored 12 analysts and delivery managers through Agile certification pathways.",
      ],
    },
  ],
  education: [
    {
      institution: "University of Warwick",
      qualification: "MSc, Information Systems Management",
      startDate: "2014",
      endDate: "2015",
      details: ["Distinction", "Dissertation on data-driven product strategy"],
    },
    {
      institution: "University of Leeds",
      qualification: "BA, Business Management",
      startDate: "2010",
      endDate: "2013",
      details: ["First Class Honours", "President of Women in Business Society"],
    },
  ],
  certifications: [
    { name: "PRINCE2 Practitioner", issuer: "AXELOS", year: "2021" },
    { name: "Certified Scrum Product Owner", issuer: "Scrum Alliance", year: "2019" },
  ],
  projects: [
    {
      name: "Open Banking Insights",
      link: "github.com/marionbrando/open-banking",
      bullets: [
        "Built an analytics dashboard for open banking API usage and compliance monitoring.",
        "Designed an alerting workflow that reduced incident response times by 35%.",
      ],
    },
  ],
  languages: [
    { name: "English", level: "Native" },
    { name: "French", level: "Professional" },
  ],
  hobbies: ["Editorial styling", "Pilates", "Travel storytelling", "Mentoring"],
};

const App = () => {
  const [template, setTemplate] = useState<TemplateName>("standard");

  const templateComponent = useMemo(() => {
    if (template === "aesthetic") {
      return <AestheticTemplate data={sampleCVData} />;
    }
    if (template === "boujee") {
      return <BoujeeTemplate data={sampleCVData} />;
    }
    return <StandardTemplate data={sampleCVData} />;
  }, [template]);

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <TemplateSwitcher value={template} onChange={setTemplate} />
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={() => exportToPDF("cv-preview")}>
            Export PDF
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            type="button"
            onClick={() => exportToDOCX(sampleCVData, template)}
          >
            Export DOCX
          </button>
        </div>
      </div>
      <div id="cv-preview" className={styles.preview}>
        {templateComponent}
      </div>
    </div>
  );
};

export default App;
