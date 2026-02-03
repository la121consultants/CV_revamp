import styles from "./TemplateSwitcher.module.css";

export type TemplateName = "standard" | "aesthetic" | "boujee";

interface TemplateSwitcherProps {
  value: TemplateName;
  onChange: (value: TemplateName) => void;
}

export const TemplateSwitcher = ({ value, onChange }: TemplateSwitcherProps) => {
  const options: { label: string; value: TemplateName }[] = [
    { label: "Standard", value: "standard" },
    { label: "Aesthetic", value: "aesthetic" },
    { label: "Boujee", value: "boujee" },
  ];

  return (
    <div className={styles.switcher}>
      <span className={styles.label}>Template</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${styles.button} ${value === option.value ? styles.buttonActive : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
