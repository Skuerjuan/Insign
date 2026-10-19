import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.css";
import Foto from "@/components/Foto";
import { getAchievementProgress, getProfile, getSession } from "@/lib/server/profile.actions";

export const dynamic = "force-dynamic";

export default async function Progreso() {
  const user = await getSession();
  const profile = await getProfile(user.id)
  const achievementProgress = await getAchievementProgress(user.id);
  const totalMinutes = Math.floor(profile.tiempo_total_segundos / 60);
  const currentLevel = Math.min(9, Math.max(1, profile.nivel ?? 1));
  const experience = Math.max(0, profile.experiencia ?? profile.puntos ?? 0);
  const levelExperience = experience % 1000;
  const progressPercent = Math.min(100, levelExperience / 10);

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
            <h2>Experiencia</h2>

            <div className={styles.levelContent}>
              <div className={styles.levelBadge}>
                <Image
                  src={`/niveles/nivel-${currentLevel}.png`}
                  alt={`Insignia del nivel ${currentLevel}`}
                  width={150}
                  height={150}
                  priority
                />
              </div>

              <div className={styles.levelInformation}>
                <h3>Nivel {currentLevel}</h3>

                <div
                  className={styles.progressBar}
                  role="progressbar"
                  aria-label="Progreso del nivel"
                  aria-valuemin={0}
                  aria-valuemax={1000}
                  aria-valuenow={levelExperience}
                >
                  <span style={{ width: `${progressPercent}%` }} />
                </div>

                <p className={styles.points}>{profile.puntos ?? 0} puntos</p>
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
                  <strong>{achievementProgress.learnedSigns}</strong>
                </div>
                <div className={styles.legendRow}>
                  <span className={`${styles.legendDot} ${styles.pendingDot}`} />
                  <span>Por aprender</span>
                  <strong>{Math.max(0, achievementProgress.totalSigns - achievementProgress.learnedSigns)}</strong>
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
                <strong>{profile.juegos_jugados}</strong>
                <span>Juegos jugados</span>
              </article>

              <article className={styles.summaryItem}>
                <img
                  src="/Reloj.png"
                  alt="Reloj"
                  className={styles.summaryIcon}
                />
                <strong>{totalMinutes} min</strong>
                <span>Tiempo de juego</span>
              </article>

              <article className={styles.summaryItem}>
                <img
                  src="/Calendario.png"
                  alt="Calendario"
                  className={styles.summaryIcon}
                />
                <strong>{profile.dias_activos}</strong>
                <span>Días activos</span>
              </article>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
