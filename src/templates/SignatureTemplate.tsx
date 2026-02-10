import type { CVData, CVTheme } from "@/types/cv";
import styles from "./SignatureTemplate.module.css";

interface SignatureTemplateProps {
  data: CVData;
  theme?: CVTheme;
}

export const SignatureTemplate = ({ data, theme }: SignatureTemplateProps) => {
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
              ["--cv-accent" as string]: theme.muted,
              ["--cv-muted" as string]: theme.muted,
              ["--cv-border" as string]: theme.border,
            }
          : undefined
      }
    >
      {/* Dark header banner */}
      <header className={styles.header}>
        <h1 className={styles.name}>
          {personal.firstName} {personal.lastName}
        </h1>
        <p className={styles.title}>{personal.title}</p>
      </header>

      {/* Contact bar */}
      <div className={styles.contactBar}>
        {contactItems.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Profile</div>
          <p className={styles.summary}>{personal.summary}</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Expertise</div>
          <div className={styles.skillGrid}>
            {skills.map((skill) => (
              <span key={skill.name}>{skill.name}</span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Experience</div>
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

        <div className={styles.references}>References available on request</div>
      </div>
    </section>
  );
};
