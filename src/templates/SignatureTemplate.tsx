import type { CVData, CVTheme } from "@/types/cv";
import styles from "./SignatureTemplate.module.css";

interface SignatureTemplateProps {
  data: CVData;
  theme?: CVTheme;
}

export const SignatureTemplate = ({ data, theme }: SignatureTemplateProps) => {
  const { personal, skills, experience, education, projects } = data;


  return (
    <section
      className={styles.page}
      style={
        theme
          ? {
              ["--cv-primary" as string]: theme.primary,
              ["--cv-primary-contrast" as string]: theme.primaryContrast,
              ["--cv-accent" as string]: theme.muted,
              ["--cv-muted" as string]: theme.muted,
              ["--cv-border" as string]: theme.border,
            }
          : undefined
      }
    >
      {/* 1. Header – Dark banner */}
      <header className={styles.header}>
        <h1 className={styles.name}>
          {personal.firstName} {personal.lastName}
        </h1>
        {personal.title && <p className={styles.title}>{personal.title}</p>}
      </header>

      {/* Contact bar */}
      <div className={styles.contactBar}>
        {personal.email && <span>{personal.email}</span>}
        {personal.phone && <span>{personal.phone}</span>}
        {personal.location && <span>{personal.location}</span>}
        {personal.linkedin && (
          <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
            {personal.linkedin}
          </a>
        )}
        {personal.portfolio && <span>{personal.portfolio}</span>}
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* 2. Professional Summary */}
        {personal.summary && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Professional Summary</div>
            <p className={styles.summary}>{personal.summary}</p>
          </section>
        )}

        {/* 3. Key Skills */}
        {skills.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Key Skills</div>
            <div className={styles.skillGrid}>
              {skills.map((skill) => (
                <span key={skill.name}>{skill.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Experience */}
        {experience.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Work Experience</div>
            {experience.map((item, index) => (
              <div key={`exp-${index}`} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span>{item.role}</span>
                  <span>
                    {item.startDate} – {item.endDate}
                  </span>
                </div>
                <div className={styles.itemSub}>
                  {item.company}
                  {item.location && ` · ${item.location}`}
                </div>
                {item.bullets.length > 0 && (
                  <ul className={styles.bullets}>
                    {item.bullets.map((bullet, bi) => (
                      <li key={bi}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* 5. Education */}
        {education.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Education</div>
            {education.map((item, index) => (
              <div key={`edu-${index}`} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span>{item.qualification}</span>
                  <span>
                    {item.startDate} – {item.endDate}
                  </span>
                </div>
                <div className={styles.itemSub}>{item.institution}</div>
                {item.details && item.details.length > 0 && (
                  <ul className={styles.bullets}>
                    {item.details.map((detail, di) => (
                      <li key={di}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* 6. Projects */}
        {projects.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Projects</div>
            {projects.map((project, index) => (
              <div key={`proj-${index}`} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span>{project.title}</span>
                </div>
                {project.description && (
                  <p style={{ fontSize: "10.5pt", margin: "0 0 2pt 0" }}>{project.description}</p>
                )}
                {project.contribution && (
                  <p style={{ fontSize: "10.5pt", margin: "0 0 2pt 0", fontStyle: "italic" }}>{project.contribution}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* 7. References – always last */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>References</div>
          <p className={styles.references}>References available on request</p>
        </section>
      </div>
    </section>
  );
};
