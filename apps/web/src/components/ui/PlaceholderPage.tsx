import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: string;
}

export function PlaceholderPage({ title, description, icon = '◧' }: PlaceholderPageProps) {
  return (
    <div className={styles.page}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <span className={styles.tag}>Coming in a future phase</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}
