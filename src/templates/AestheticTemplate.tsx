import type { CVData, CVTheme } from "@/types/cv";
import styles from "./AestheticTemplate.module.css";

interface AestheticTemplateProps {
  data: CVData;
  theme?: CVTheme;
}

export const AestheticTemplate = ({ data, theme }: AestheticTemplateProps) => {
  const { personal, skills, experience, education, training, projects } = data;

  return (
    <section
      className={styles.page}
      style={
        theme
          ? {
              ["--cv-primary" as string]: theme.primary,
              ["--cv-primary-contrast" as string]: theme.primaryContrast,
              ["--cv-primary-light" as string]: theme.primaryLight,
              ["--cv-sidebar" as string]: theme.sidebar,
              ["--cv-sidebar-text" as string]: theme.sidebarText,
              ["--cv-border" as string]: theme.border,
              ["--cv-muted" as string]: theme.muted,
            }
          : undefined
      }
    >
      <div className={styles.layout}>
        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebar}>
          <h1 className={styles.name}>
            {personal.firstName}
            <br />
            {personal.lastName}
          </h1>
          {personal.title && <p className={styles.title}>{personal.title}</p>}

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Contact</div>
            <div className={styles.contactList}>
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
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Key Skills</div>
            <div className={styles.skillList}>
              {skills.map((skill, index) => (
                <div key={index} className={styles.skillItem}>
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className={styles.main}>
          {/* 2. Professional Summary */}
          {personal.summary && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Professional Summary</div>
              <p className={styles.summary}>{personal.summary}</p>
            </div>
          )}

          {/* 4. Work Experience */}
          {experience.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Work Experience</div>
              {experience.map((item, index) => (
                <div key={index} className={styles.experienceItem}>
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
            </div>
          )}

          {/* 5. Education */}
          {education.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Education</div>
              {education.map((item, index) => (
                <div key={index} className={styles.experienceItem}>
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
          </div>
          )}

          {/* 5b. Training */}
          {training.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Training</div>
              {training.map((item, index) => (
                <div key={index} className={styles.experienceItem}>
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
            </div>
          )}

          {/* 6. Projects */}
          {projects.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Projects</div>
              {projects.map((project, index) => (
                <div key={index} className={styles.experienceItem}>
                  <div className={styles.itemHeader}>
                    <span>{project.title}</span>
                  </div>
                  {project.description && (
                    <p style={{ fontSize: "10pt", margin: "0 0 2pt 0" }}>{project.description}</p>
                  )}
                  {project.contribution && (
                    <p style={{ fontSize: "10pt", margin: "0 0 2pt 0", fontStyle: "italic" }}>{project.contribution}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 7. References – always last */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>References</div>
            <p className={styles.references}>References available on request</p>
          </div>
        </main>
      </div>
    </section>
  );
};
