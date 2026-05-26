import Link from "next/link";
import styles from "./styles.module.css";

export default function Home() {
  return (
    <div className={styles.fondo}>
      <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>
      <h2 className={styles.subtitulo}>Juga, aprende y comunica</h2>
      <Link href="/auth/sign-in" className={styles.play}>Jugar</Link>
    </div>
  );
}
