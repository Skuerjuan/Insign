import Link from "next/link";
import Foto from "@/components/Foto";
import ConfiguracionPanel from "@/components/ConfiguracionPanel";
import styles from "./styles.module.css";
import { getSession } from "@/lib/server/profile.actions";

export const dynamic = "force-dynamic";

export default async function Configuracion() {
  const user = await getSession();

  return (
    <div className={styles.fondo}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span className={styles.blanco}>In</span>
          <span className={styles.amarillo}>Sign</span>
        </h1>

        <nav className={styles.navigation} aria-label="Navegación principal">
          <Link href="/menu"><img src="/casablanco.webp" alt="" />Inicio</Link>
          <Link href="/entrenamiento"><img src="/pesa.webp" alt="" />Entrenamiento</Link>
          <Link href="/progreso"><img src="/premio.webp" alt="" />Progreso</Link>
          <Link href="/perfil"><img src="/userwhite.webp" alt="" />Perfil</Link>
          <Link href="/configuracion" className={styles.active}><img src="/ajustes.webp" alt="" />Configuración</Link>
        </nav>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.pageTitle}>
            <span className={styles.titleIcon}><img src="/ajustes.webp" alt="" /></span>
            <h1>Configuración</h1>
          </div>
          <div className={styles.profilePhoto}><Foto user={user} /></div>
        </header>

        <ConfiguracionPanel />
      </div>
    </div>
  );
}
