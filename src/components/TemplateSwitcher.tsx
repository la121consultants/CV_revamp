import styles from "./TemplateSwitcher.module.css";
import type { CVStyle } from "@/types";

interface TemplateSwitcherProps {
  value: CVStyle;
  onChange: (value: CVStyle) => void;
}

export const TemplateSwitcher = ({ value, onChange }: TemplateSwitcherProps) => {
  const options: { label: string; value: CVStyle }[] = [
    { label: "Standard", value: "standard" },
    { label: "Aesthetic", value: "aesthetic" },
    { label: "Signature", value: "signature" },
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
