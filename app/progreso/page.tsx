import styles from "./styles.module.css";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { user } = session;

  return (
    <div className={styles.fondo}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span className={styles.blanco}>In</span>
          <span className={styles.amarillo}>Sign</span>
        </h1>

        <Link href="/menu" className={styles.inicio}>
          <img src="/casablanco.png" alt="" className={styles.casa} />
          Inicio
        </Link>
        <Link href="/menu" className={styles.train}>
          <img src="/pesa.png" alt="" className={styles.pesa} />
          Entrenamiento
        </Link>
        <Link href="/progreso" className={styles.progreso}>
          <img src="/premio.png" alt="" className={styles.premio} />
          Progreso
        </Link>
        <Link href="/perfil" className={styles.usuario}>
          <img src="/userwhite.png" alt="" className={styles.userwhite} />
          Perfil
        </Link>
        <Link href="/menu" className={styles.source}>
          <img src="/ajustes.png" alt="" className={styles.ajustes} />
          Configuracion
        </Link>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.profileTitle}>
            <div className={styles.profileTitleIcon}>
              <img src="/user.png" alt="" />
            </div>
            <h2>Progreso</h2>
          </div>

          <div className={styles.profilePhotoSmall}>
            <span>Foto {user.name}</span>
          </div>
        </header>

        <main className={styles.profileMain}>
          <section className={styles.userCard}>
            <button className={styles.editButton} aria-label="Editar perfil">
              <span aria-hidden="true">✎</span>
            </button>

            <div className={styles.userAvatar}>Foto {user.name}</div>

            <div className={styles.userInfo}>
              <h1>Nivel actual</h1>
            </div>
          </section>

          <section className={styles.panel}>
            <details className={styles.achievementsDetails}>
              <summary className={styles.panelHeader}>
                <h2>Mis logros</h2>
                <span>Ver todos</span>
              </summary>
            </details>
          </section>

          <section className={styles.panelSmall}>
            <h2>Rachas de dias</h2>
          </section>
        </main>
      </div>
    </div>
  );
}
