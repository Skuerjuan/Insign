import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import Foto from "@/components/Foto";
import ConfiguracionPanel from "@/components/ConfiguracionPanel";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

export default async function Configuracion() {
  const { data: session } = await auth.getSession();

  if (!session?.user) redirect("/auth/sign-in");

  const { user } = session;

  return (
    <div className={styles.fondo}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span className={styles.blanco}>In</span>
          <span className={styles.amarillo}>Sign</span>
        </h1>

        <nav className={styles.navigation} aria-label="Navegación principal">
          <Link href="/menu"><img src="/casablanco.png" alt="" />Inicio</Link>
          <Link href="/entrenamiento"><img src="/pesa.png" alt="" />Entrenamiento</Link>
          <Link href="/progreso"><img src="/premio.png" alt="" />Progreso</Link>
          <Link href="/perfil"><img src="/userwhite.png" alt="" />Perfil</Link>
          <Link href="/configuracion" className={styles.active}><img src="/ajustes.png" alt="" />Configuración</Link>
        </nav>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.pageTitle}>
            <span className={styles.titleIcon}><img src="/ajustes.png" alt="" /></span>
            <h1>Configuración</h1>
          </div>
          <div className={styles.profilePhoto}><Foto user={user} /></div>
        </header>

        <ConfiguracionPanel />
      </div>
    </div>
  );
}
