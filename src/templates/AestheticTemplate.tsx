import type { CVData, CVTheme } from "@/types/cv";
import styles from "./AestheticTemplate.module.css";

interface AestheticTemplateProps {
  data: CVData;
  theme?: CVTheme;
}

export const AestheticTemplate = ({ data, theme }: AestheticTemplateProps) => {
  const { personal, skills, experience, education } = data;

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
        {/* LEFT SIDEBAR - Contact, Skills, Links */}
        <aside className={styles.sidebar}>
          <h1 className={styles.name}>
            {personal.firstName} {personal.lastName}
          </h1>
          <p className={styles.title}>{personal.title}</p>

          {/* Contact Details */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Contact</div>
            <div className={styles.contactList}>
              <span>{personal.location}</span>
              <span>{personal.phone}</span>
              <span>{personal.email}</span>
              {personal.linkedin && <span>{personal.linkedin}</span>}
              {personal.portfolio && <span>{personal.portfolio}</span>}
            </div>
          </div>

          {/* Skills */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Skills</div>
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
          {/* Professional Summary */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Professional Summary</div>
            <p className={styles.summary}>{personal.summary}</p>
          </div>

          {/* Work Experience */}
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
                  {item.location && ` • ${item.location}`}
                </div>
                {item.bullets.length > 0 && (
                  <ul className={styles.bullets}>
                    {item.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Education */}
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
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* References */}
          <div className={styles.references}>
            References available on request
          </div>
        </main>
      </div>
    </section>
  );
};
