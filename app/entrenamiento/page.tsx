import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.css";
import Foto from "@/components/Foto";
import { getProfile, getSession } from "../../lib/server/profile.actions";

export const dynamic = "force-dynamic";

export default async function Entrenamiento() {
  const user = await getSession();

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
          <Link href="/configuracion" className={styles.source}>
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
                  <Image
                    src="/mono-abecedario.png"
                    alt="Mono saludando"
                    width={208}
                    height={275}
                  />
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
                  <Image
                    src="/mono-practicar.png"
                    alt="Mono cargando un tronco"
                    width={236}
                    height={236}
                  />
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
