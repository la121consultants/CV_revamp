import type { CVData } from "@/types/cv";
import styles from "./StandardTemplate.module.css";

interface StandardTemplateProps {
  data: CVData;
}

export const StandardTemplate = ({ data }: StandardTemplateProps) => {
  const { personal, skills, experience, education } = data;

  const contactItems = [
    personal.location,
    personal.phone,
    personal.email,
    personal.linkedin,
    personal.portfolio,
  ].filter(Boolean);

  return (
    <section className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.name}>
          {personal.firstName} {personal.lastName}
        </h1>
        <p className={styles.title}>{personal.title}</p>
        <div className={styles.contact}>
          {contactItems.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </header>

      {/* Professional Summary */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Professional Summary</div>
        <p className={styles.summary}>{personal.summary}</p>
      </section>

      {/* Skills */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Key Skills</div>
        <div className={styles.skillList}>
          {skills.map((skill) => (
            <span key={skill.name}>{skill.name}</span>
          ))}
        </div>
      </section>

      {/* Professional Experience */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Professional Experience</div>
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

      {/* Education */}
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

      {/* References */}
      <div className={styles.references}>
        References available on request
      </div>
    </section>
  );
};
