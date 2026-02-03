import type { CVData } from "@/types/cv";
import styles from "./BoujeeTemplate.module.css";

interface BoujeeTemplateProps {
  data: CVData;
}

export const BoujeeTemplate = ({ data }: BoujeeTemplateProps) => {
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
          <div className={styles.contact}>
            <span>{personal.location}</span>
            <span>{personal.phone}</span>
            <span>{personal.email}</span>
            <span>{personal.linkedin}</span>
            <span>{personal.portfolio}</span>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Skills</div>
            <div className={styles.badgeList}>
              {skills.map((skill) => (
                <span key={skill.name} className={styles.badge}>
                  {skill.name}
                </span>
              ))}
            </div>
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
              <div className={styles.badgeList}>
                {hobbies?.map((hobby) => (
                  <span key={hobby} className={styles.badge}>
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Profile</div>
            <p className={styles.summary}>{personal.summary}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Experience</div>
            {experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className={styles.timelineItem}>
                <div className={styles.datePill}>
                  {item.startDate} - {item.endDate}
                </div>
                <div>
                  <div className={styles.itemHeader}>{item.role}</div>
                  <div className={styles.itemSub}>
                    {item.company} • {item.location}
                  </div>
                  <ul className={styles.bullets}>
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Education</div>
            {education.map((item) => (
              <div key={`${item.institution}-${item.qualification}`} className={styles.timelineItem}>
                <div className={styles.datePill}>
                  {item.startDate} - {item.endDate}
                </div>
                <div>
                  <div className={styles.itemHeader}>{item.qualification}</div>
                  <div className={styles.itemSub}>{item.institution}</div>
                  <ul className={styles.bullets}>
                    {item.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {(projects?.length ?? 0) > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Projects</div>
              {projects?.map((project) => (
                <div key={project.name} className={styles.timelineItem}>
                  <div className={styles.datePill}>Project</div>
                  <div>
                    <div className={styles.itemHeader}>{project.name}</div>
                    {project.link && <div className={styles.itemSub}>{project.link}</div>}
                    <ul className={styles.bullets}>
                      {project.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
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
