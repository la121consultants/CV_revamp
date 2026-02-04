import type { CVData, CVTheme } from "@/types/cv";
import styles from "./StandardTemplate.module.css";

interface StandardTemplateProps {
  data: CVData;
  theme?: CVTheme;
}

export const StandardTemplate = ({ data, theme }: StandardTemplateProps) => {
  const { personal, skills, experience, education } = data;

  const contactItems = [
    personal.location,
    personal.phone,
    personal.email,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

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
      <header className={styles.header}>
        <div>
          <h1 className={styles.name}>
            {personal.firstName} {personal.lastName}
          </h1>
          <p className={styles.title}>{personal.title}</p>
        </div>
        <div className={styles.headerAccent} />
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Contact</div>
            <div className={styles.contactList}>
              {contactItems.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Skills</div>
            <div className={styles.skillList}>
              {skills.map((skill) => (
                <span key={skill.name}>{skill.name}</span>
              ))}
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Professional Summary</div>
            <p className={styles.summary}>{personal.summary}</p>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Work History</div>
            {experience.map((item, index) => (
              <div key={`exp-${index}`} className={styles.gridItem}>
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
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Education</div>
            {education.map((item, index) => (
              <div key={`edu-${index}`} className={styles.gridItem}>
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
          </section>

          <div className={styles.references}>References available on request</div>
        </main>
      </div>
    </section>
  );
};
