import type { CVData } from "@/types/cv";
import styles from "./StandardTemplate.module.css";

interface StandardTemplateProps {
  data: CVData;
}

export const StandardTemplate = ({ data }: StandardTemplateProps) => {
  const { personal, skills, experience, education, certifications, projects, languages, hobbies } = data;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.name}>
          {personal.firstName} {personal.lastName}
        </h1>
        <p className={styles.title}>{personal.title}</p>
        <div className={styles.contact}>
          <span>{personal.location}</span>
          <span>{personal.phone}</span>
          <span>{personal.email}</span>
          <span>{personal.linkedin}</span>
          <span>{personal.portfolio}</span>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Professional Summary</div>
        <p className={styles.summary}>{personal.summary}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Key Skills</div>
        <div className={styles.skillList}>
          {skills.map((skill) => (
            <span key={skill.name}>{skill.name}</span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Work Experience</div>
        {experience.map((item) => (
          <div key={`${item.company}-${item.role}`} className={styles.gridItem}>
            <div className={styles.itemHeader}>
              <span>{item.role}</span>
              <span>
                {item.startDate} - {item.endDate}
              </span>
            </div>
            <div className={styles.itemSub}>
              {item.company} • {item.location}
            </div>
            <ul className={styles.bullets}>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Education</div>
        {education.map((item) => (
          <div key={`${item.institution}-${item.qualification}`} className={styles.gridItem}>
            <div className={styles.itemHeader}>
              <span>{item.qualification}</span>
              <span>
                {item.startDate} - {item.endDate}
              </span>
            </div>
            <div className={styles.itemSub}>{item.institution}</div>
            <ul className={styles.bullets}>
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {(projects?.length ?? 0) > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Projects</div>
          {projects?.map((project) => (
            <div key={project.name} className={styles.gridItem}>
              <div className={styles.itemHeader}>
                <span>{project.name}</span>
                {project.link && <span>{project.link}</span>}
              </div>
              <ul className={styles.bullets}>
                {project.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className={styles.twoColumn}>
        {(certifications?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Certifications</div>
            {certifications?.map((cert) => (
              <div key={cert.name} className={styles.itemSub}>
                {cert.name} • {cert.issuer} • {cert.year}
              </div>
            ))}
          </section>
        )}

        {(languages?.length ?? 0) > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>Languages</div>
            {languages?.map((language) => (
              <div key={language.name} className={styles.itemSub}>
                {language.name} • {language.level}
              </div>
            ))}
          </section>
        )}
      </div>

      {(hobbies?.length ?? 0) > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Interests</div>
          <div className={styles.skillList}>
            {hobbies?.map((hobby) => (
              <span key={hobby}>{hobby}</span>
            ))}
          </div>
        </section>
      )}
    </section>
  );
};
