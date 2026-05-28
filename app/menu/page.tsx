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
       <Link href="./" className={styles.progreso}>
       <img src="premio.png" className={styles.premio}/>
       Progreso
       </Link>
        <Link href="./" className={styles.usuario}>
       <img src="userwhite.png" className={styles.userwhite}/>
       Usuario
       </Link>
       <Link href="./" className={styles.source}>
       <img src="ajustes.png" className={styles.ajustes}/>
       Configuracion
       </Link>
      </aside>
      <header className={styles.header}>
       <p>aieka</p>
      </header>
    </div>
    );
}
