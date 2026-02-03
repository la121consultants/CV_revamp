import type { CVData } from "@/types/cv";
import styles from "./AestheticTemplate.module.css";

interface AestheticTemplateProps {
  data: CVData;
}

export const AestheticTemplate = ({ data }: AestheticTemplateProps) => {
  const { personal, skills, experience, education, certifications, projects, languages, hobbies } = data;

  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {personal.photoUrl && (
            <img src={personal.photoUrl} alt={`${personal.firstName} ${personal.lastName}`} className={styles.photo} />
          )}
          <h1 className={styles.name}>
            {personal.firstName} {personal.lastName}
          </h1>
          <p className={styles.title}>{personal.title}</p>
          <div className={styles.contactList}>
            <span>{personal.location}</span>
            <span>{personal.phone}</span>
            <span>{personal.email}</span>
            <span>{personal.linkedin}</span>
            <span>{personal.portfolio}</span>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Skills</div>
            {skills.map((skill) => (
              <div key={skill.name} className={styles.skillRow}>
                <span>{skill.name}</span>
                <span className={styles.dots}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={`${skill.name}-${index}`}
                      className={`${styles.dot} ${
                        (skill.proficiency ?? 3) > index ? styles.dotActive : ""
                      }`}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>

          {(languages?.length ?? 0) > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Languages</div>
              {languages?.map((language) => (
                <div key={language.name} className={styles.itemSub}>
                  {language.name} • {language.level}
                </div>
              ))}
            </div>
          )}

          {(hobbies?.length ?? 0) > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Interests</div>
              {hobbies?.map((hobby) => (
                <div key={hobby} className={styles.itemSub}>
                  {hobby}
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className={styles.main}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Professional Summary</div>
            <p className={styles.summary}>{personal.summary}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Experience</div>
            {experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className={styles.section}>
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
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Education</div>
            {education.map((item) => (
              <div key={`${item.institution}-${item.qualification}`} className={styles.section}>
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
          </div>

          {(projects?.length ?? 0) > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Projects</div>
              {projects?.map((project) => (
                <div key={project.name} className={styles.section}>
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
            </div>
          )}

          {(certifications?.length ?? 0) > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Certifications</div>
              {certifications?.map((cert) => (
                <div key={cert.name} className={styles.itemSub}>
                  {cert.name} • {cert.issuer} • {cert.year}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
};
