import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

export default async function Progreso() {
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
          <Link href="/menu" className={styles.train}>
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
            <div className={styles.smallImagePlaceholder} aria-label="Espacio para ícono" />
            <h1>Progreso</h1>
          </div>

          <div className={styles.profileImagePlaceholder}>
            <span>Imagen.{user.name}</span>
          </div>
        </header>

        <main className={styles.progressMain}>
          <section className={styles.levelSection}>
            <h2>Tu nivel actual</h2>

            <div className={styles.levelContent}>
              <div className={styles.levelImagePlaceholder}>
                <span>Imagen de nivel</span>
              </div>

              <div className={styles.levelInformation}>
                <h3>Nivel 1</h3>
                <p className={styles.levelName}>Aprendiz</p>

                <div
                  className={styles.progressBar}
                  role="progressbar"
                  aria-label="Progreso del nivel"
                  aria-valuemin={0}
                  aria-valuemax={1000}
                  aria-valuenow={100}
                >
                  <span />
                </div>

                <p className={styles.points}>100 / 1000 puntos</p>
              </div>
            </div>
          </section>

          <section className={styles.learnedSection}>
            <h2>Señas aprendidas</h2>

            <div className={styles.learnedContent}>
              <div className={styles.chartPlaceholder}>
                <strong>50%</strong>
                <span>Espacio para gráfico o imagen</span>
              </div>

              <div className={styles.legend}>
                <div className={styles.legendRow}>
                  <span className={`${styles.legendDot} ${styles.learnedDot}`} />
                  <span>Aprendidas</span>
                  <strong>25 / 50</strong>
                </div>
                <div className={styles.legendRow}>
                  <span className={`${styles.legendDot} ${styles.pendingDot}`} />
                  <span>Por aprender</span>
                  <strong>25 / 50</strong>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.summarySection}>
            <h2>Resumen general</h2>

            <div className={styles.summaryGrid}>
              <article className={styles.summaryItem}>
              <img src="./Joystick.png"/>
                <strong>2</strong>
                <span>Juegos jugados</span>
              </article>

              <article className={styles.summaryItem}>
                <img src="./Reloj.png"/>
                <strong>3h 30m</strong>
                <span>Tiempo de juego</span>
              </article>

              <article className={styles.summaryItem}>
                <img src="./Calendario.png" alt="" />
                <strong>5</strong>
                <span>Días activos</span>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
