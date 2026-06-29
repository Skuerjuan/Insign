import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import styles from "./styles.module.css";
import Foto from "@/components/Foto";
import { getProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function Entrenamiento() {
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

        <nav className={styles.navigation} aria-label="Navegación principal">
          <Link href="/menu" className={styles.inicio}>
            <img src="/casablanco.png" alt="" className={styles.navIcon} />
            Inicio
          </Link>
          <Link href="/entrenamiento" className={styles.train}>
            <img src="/pesa.png" alt="" className={styles.navIcon} />
            Entrenamiento
          </Link>
          <Link href="/progreso" className={styles.progreso}>
            <img src="/premio.png" alt="" className={styles.navIcon} />
            Progreso
          </Link>
          <Link href="/perfil" className={styles.usuario}>
            <img src="/userwhite.png" alt="" className={styles.navIcon} />
            Perfil
          </Link>
          <Link href="/menu" className={styles.source}>
            <img src="/ajustes.png" alt="" className={styles.navIcon} />
            Configuración
          </Link>
        </nav>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.pageTitle}>
            <div className={styles.titleIcon} aria-hidden="true">
              <img src="/pesa.png" alt="" />
            </div>
            <h1>Entrenamiento</h1>
          </div>

          <div className={styles.profileImagePlaceholder}>
            <Foto user={user}></Foto>
          </div>
        </header>

        <main className={styles.trainingMain}>
          <section className={styles.practiceSection}>
            <h2>¡A practicar!</h2>

            <div className={styles.practiceGrid}>
              <article className={`${styles.practiceCard} ${styles.alphabetCard}`}>
                <div
                  className={styles.levelImageSlot}
                  aria-label="Imagen correspondiente al nivel Abecedario"
                >
                  <span>Imagen del nivel</span>
                </div>

                <div className={styles.cardText}>
                  <h3>Abecedario</h3>
                  <p>Aprende las letras del abecedario.</p>
                </div>
                <Link
                  href="/juego-eleccion"
                  className={styles.cardButton}
                  aria-label="Ir a Abecedario"
                >
                  <span aria-hidden="true">›</span>
                </Link>
              </article>

              <article className={`${styles.practiceCard} ${styles.practiceCardGreen}`}>
                <div
                  className={`${styles.levelImageSlot} ${styles.greenImageSlot}`}
                  aria-label="Imagen correspondiente al nivel Practicar"
                >
                  <span>Imagen del nivel</span>
                </div>

                <div className={styles.cardText}>
                  <h3>Practicar</h3>
                  <p>Juega sin temor de hacerlo mal.</p>
                </div>
                <Link
                  href="/juego-memoria"
                  className={`${styles.cardButton} ${styles.greenButton}`}
                  aria-label="Ir a Practicar"
                >
                  <span aria-hidden="true">›</span>
                </Link>
              </article>
            </div>
          </section>

          <section className={styles.streakPanel}>
            <h2>Rachas de días</h2>
          </section>
        </main>
      </div>
    </div>
  );
}
