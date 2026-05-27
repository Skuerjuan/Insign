import styles from "./styles.module.css";
import Link from "next/link";
import Input from "@/components/input";


export default function Menu() {
  return (
    <div className={styles.fondo}>
      <aside className={styles.aside}>
       <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>
       <Link href="./" className={styles.inicio}>
       <img src="casa.png" className={styles.casa} />
       Inicio
       </Link>
       <Link href="./" className={styles.train}>
       <img src="pesa.png" className={styles.pesa}/>
       Entrenamiento
       </Link> 
      </aside>
    </div>
    );
}
