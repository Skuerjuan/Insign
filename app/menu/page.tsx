import styles from "./styles.module.css";
import Link from "next/link";
import Image from "next/image";
import Foto from "@/components/Foto"
import { getProfile, getSession } from "../../lib/server/profile.actions";
import { getWeeklyActivity } from "../../lib/server/streak";
import { LEVELS } from "@/src/diccionario/diccionario";
export const dynamic = "force-dynamic";

export default async function Menu({ searchParams }: { searchParams: Promise<{ origen?: string }> }) {
  const practice = (await searchParams).origen === "entrenamiento";
  const user = await getSession();
  const surveyUrl = "https://forms.gle/4jvd8xA6PrMveW87A";

    const { puntos, racha, ultimo_dia_activo, nivel } = await getProfile(user.id);
    const rachaActual = getWeeklyActivity(racha, ultimo_dia_activo).count;

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
        <Link href="/entrenamiento" className={styles.train}>
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
        <Link href="/configuracion" className={styles.source}>
          <img src="/ajustes.png" alt="" className={styles.ajustes} />
          Configuracion
        </Link>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.greeting}>
            <h2>{practice ? "Modo practicar" : `Hola, ${user.name}!`}</h2>
            <p>{practice ? "Elegí cualquier nivel. Practicá sin sumar puntos." : "Que juego quieres jugar hoy?"}</p>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <img src="/Star.png" alt="" className={styles.starIcon} />
              <div>
                <strong>{puntos ?? 0}</strong>
                <span>Puntos</span>
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <img src="/Fire.png" alt="" className={styles.fireIcon} />
              <div>
                <strong>{rachaActual}</strong>
                <span>Racha</span>
              </div>
            </div>
          </div>

          <div className={styles.profilePlaceholder} >
            <Foto user={user}  />
          </div>
        </header>

        <main className={styles.levels}>
        {LEVELS.map((level) => {
            const isLocked = !practice && level.id > 1 && nivel < level.id;


            return (
              <section
                key={level.title}
                className={`${styles.levelCard} ${styles[level.colorClass]} ${isLocked ? styles.locked : ""}`}
              >
                <div className={styles.levelImagePlaceholder}>
                  <Image src="/loro-mango.png" alt="" width={179} height={180} className={styles.levelImage} />
                  {isLocked && (
                    <Image
                      src="/lock.png"
                      alt="Nivel bloqueado"
                      width={54}
                      height={54}
                      className={styles.levelLock}
                    />
                  )}
                </div>

                <div className={styles.levelInfo}>
                  <h3>{level.title}</h3>
                  <p>{level.description}</p>
                </div>

                {isLocked ? (
                  <span className={`${styles.levelArrow} ${styles.disabledArrow}`} aria-hidden="true">
                    <Image src="/flecha-seccion.png" alt="" width={87} height={87} />
                  </span>
                ) : (
                  <Link href={`/nivel/${level.id}${practice ? "?origen=entrenamiento" : ""}`} className={styles.levelArrow} aria-label={`Jugar ${level.title}`}>
                    <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
                  </Link>
                )}
              </section>
            );
          })}
        </main>
      </div>
      <a
        href={surveyUrl}
        className={styles.surveyButton}
        aria-label="Completar encuesta (se abre en otra pestaña)"
        title="Completar encuesta"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <rect x="9" y="2" width="6" height="4" rx="1" fill="#ffd32a" />
          <path d="m8 11 1 1 2-2M13 11h3m-8 5 1 1 2-2m2 1h3" />
        </svg>
      </a>
    </div>
  );
}
