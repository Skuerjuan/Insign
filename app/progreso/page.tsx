import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import styles from "./styles.module.css";
import Foto from "@/components/Foto";

export const dynamic = "force-dynamic";

export default async function Progreso() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { user } = session;
  const userProgress = user as typeof user & {
    puntos?: string | number | null;
    aprendidas?: string | number | null;
    poraprender?: string | number | null;
    juego?: string | number | null;
    tiempo?: string | number | null;
    dias?: string | number | null;
  };

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
            <div className={styles.smallImagePlaceholder} aria-label="Ícono de progreso">
              <img src="/copaprogreso.png" alt="" />
            </div>
            <h1>Progreso</h1>
          </div>

          <div className={styles.profileImagePlaceholder}>
            <Foto user={user} />
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

                <p className={styles.points}>{userProgress.puntos ?? 0}</p>
              </div>
            </div>
          </section>

          <section className={styles.learnedSection}>
            <h2>Señas aprendidas</h2>

            <div className={styles.learnedContent}>
              <div className={styles.chartPlaceholder}>
                <span>Espacio para gráfico o imagen</span>
              </div>

              <div className={styles.legend}>
                <div className={styles.legendRow}>
                  <span className={`${styles.legendDot} ${styles.learnedDot}`} />
                  <span>Aprendidas</span>
                  <strong>{userProgress.aprendidas ?? 0}</strong>
                </div>
                <div className={styles.legendRow}>
                  <span className={`${styles.legendDot} ${styles.pendingDot}`} />
                  <span>Por aprender</span>
                  <strong>{userProgress.poraprender ?? 0}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.summarySection}>
            <h2>Resumen general</h2>

            <div className={styles.summaryGrid}>
              <article className={styles.summaryItem}>
                <img
                  src="/Joystick.png"
                  alt="Joystick"
                  className={styles.summaryIcon}
                />
                <strong>{userProgress.juego ?? 0}</strong>
                <span>Juegos jugados</span>
              </article>

              <article className={styles.summaryItem}>
                <img
                  src="/Reloj.png"
                  alt="Reloj"
                  className={styles.summaryIcon}
                />
                <strong>{userProgress.tiempo ?? 0}</strong>
                <span>Tiempo de juego</span>
              </article>

              <article className={styles.summaryItem}>
                <img
                  src="/Calendario.png"
                  alt="Calendario"
                  className={styles.summaryIcon}
                />
                <strong>{userProgress.dias ?? 0}</strong>
                <span>Días activos</span>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
