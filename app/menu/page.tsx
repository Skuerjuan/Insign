import styles from "./styles.module.css";
import Link from "next/link";
import Image from "next/image";
import Foto from "@/components/Foto"
import { getProfile, getSession } from "../../lib/server/profile.actions";
import { getWeeklyActivity } from "../../lib/server/streak";
import { LEVELS } from "@/lib/levels";

export const dynamic = "force-dynamic";

export default async function Menu() {
  const user = await getSession();

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
            <h2>Hola, {user.name}!</h2>
            <p>Que juego quieres jugar hoy?</p>
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
            const isLocked = level.id > 1 && nivel < level.id;

            return (
              <section
                key={level.title}
                className={`${styles.levelCard} ${styles[level.colorClass]} ${isLocked ? styles.locked : ""}`}
              >
                <div className={styles.levelImagePlaceholder}>
                  <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
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
                  <Link href={`/nivel/${level.id}`} className={styles.levelArrow} aria-label={`Ver juegos de ${level.title}`}>
                    <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
                  </Link>
                )}
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
