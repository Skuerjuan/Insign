import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Foto from "@/components/Foto";
import { getLevel } from "@/src/diccionario/diccionario";
import { getCompletedGames, getProfile, getSession, type GameName } from "@/lib/server/profile.actions";
import { getWeeklyActivity } from "@/lib/server/streak";
import { getLevelSignProgress } from "@/lib/sign-progress";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

const games: Array<{ name: GameName; label: string; href: string; image?: string }> = [
  { name: "memoria", label: "Memoria", href: "/juego-memoria", image: "/juego-memoria.webp" },
  { name: "eleccion", label: "Elección", href: "/juego-eleccion", image: "/juego-eleccion.webp" },
  { name: "completar", label: "Completar", href: "/Juego-completar", image: "/completar-mango.webp" },
  { name: "adivinar", label: "Múltiple elección", href: "/Juego-adivinar", image: "/loro-pensando.webp" },
];

export default async function LevelGamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ nivel: string }>;
  searchParams: Promise<{ origen?: string }>;
}) {
  const practice = (await searchParams).origen === "entrenamiento";
  const { nivel: rawLevel } = await params;
  const levelId = Number(rawLevel);
  const level = getLevel(levelId);

  if (!level) notFound();

  const user = await getSession();
  const profile = await getProfile(user.id);

  if (!practice && level.id > 1 && profile.nivel < level.id) redirect("/menu");

  const completedGames = new Set(await getCompletedGames(user.id, level.id));
  const examReady = games.every((game) => completedGames.has(game.name));
  const examPassed = profile.examenes_aprobados.includes(level.id);
  const signProgress = getLevelSignProgress(level.id, profile.senas_aprendidas);
  const streak = getWeeklyActivity(profile.racha, profile.ultimo_dia_activo).count;
  const levelStyle = { "--level-color": level.color } as CSSProperties;

  return (
    <div className={styles.page} style={levelStyle}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span>In</span><strong>Sign</strong>
        </h1>
        <nav className={styles.navigation} aria-label="Navegación principal">
          <Link href={practice ? "/menu?origen=entrenamiento" : "/menu"} className={styles.activeLink}><Image src="/casablanco.webp" alt="" width={40} height={40} />Inicio</Link>
          <Link href="/entrenamiento"><Image src="/pesa.webp" alt="" width={40} height={40} />Entrenamiento</Link>
          <Link href="/progreso"><Image src="/premio.webp" alt="" width={40} height={40} />Progreso</Link>
          <Link href="/perfil"><Image src="/userwhite.webp" alt="" width={40} height={40} />Perfil</Link>
          <Link href="/configuracion"><Image src="/ajustes.webp" alt="" width={40} height={40} />Configuración</Link>
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.greeting}>
            <h2>¡Hola, {user.name}!</h2>
            <p>¿Qué juego quieres jugar hoy?</p>
          </div>
          <div className={styles.stats} aria-label="Estadísticas">
            <div><Image src="/Star.webp" alt="" width={46} height={46} /><span><strong>{profile.puntos ?? 0}</strong>Puntos</span></div>
            <i aria-hidden="true" />
            <div><Image src="/Fire.webp" alt="" width={42} height={48} /><span><strong>{streak}</strong>Racha</span></div>
          </div>
          <div className={styles.avatar}><Foto user={user} width={74} height={74} /></div>
        </header>

        <main className={styles.main}>
          <section className={styles.levelBanner} aria-labelledby="level-title">
            <Link href={practice ? "/menu?origen=entrenamiento" : "/menu"} className={styles.backButton} aria-label="Volver a los niveles">
              <Image
                src="/flecha-tarjeta.webp"
                alt=""
                width={38}
                height={38}
                className={styles.backArrowIcon}
              />
            </Link>
            <Image src="/loro-mango.webp" alt="" width={142} height={142} className={styles.monkey} />
            <div>
              <h1 id="level-title">{level.title}</h1>
              <p>{practice ? "Modo practicar · Sin puntos" : level.description}</p>
              {!practice && <p>Señas vistas: {signProgress.learned} de {signProgress.total}. Para avanzar, aprobá el examen final con todas las señas sin errores.</p>}
            </div>
          </section>

          <h2 className={styles.gamesTitle}>Juegos</h2>
          <section className={styles.gamesGrid} aria-label={`Juegos de ${level.title}`}>
            {games.map((game) => {
              const completed = completedGames.has(game.name);
              return (
                <a
                  key={game.name}
                  href={`${game.href}?nivel=${level.id}${practice ? "&origen=entrenamiento" : ""}`}
                  className={styles.gameCard}
                  aria-label={`${game.label}${completed ? ", completado" : ""}`}
                >
                  <div className={styles.cardBody}>
                    {game.image && <Image src={game.image} alt="" width={180} height={150} className={styles.gameImage} />}
                  </div>
                  <div className={styles.cardFooter}>
                    <span>{game.label}</span>
                    <Image
                      src="/arrow-right-circle.webp"
                      alt=""
                      width={36}
                      height={36}
                      className={styles.cardArrow}
                      aria-hidden="true"
                    />
                  </div>
                </a>
              );
            })}
          </section>
          {!practice && (
            <section className={styles.examSection} aria-label="Examen final">
              {examReady ? (
                <Link href={`/examen-final/${level.id}`} className={`${styles.examBar} ${examPassed ? styles.examPassed : ""}`}>
                  <span>Examen final{examPassed ? " · Aprobado ✓" : ""}<small>Tres juegos · Todas las señas · Sin errores</small></span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <div className={`${styles.examBar} ${styles.examLocked}`} aria-disabled="true">
                  <span>Examen final<small>Completá los cuatro juegos para habilitarlo ({completedGames.size}/4)</small></span>
                  <Image src="/lock.webp" alt="Bloqueado" width={32} height={32} />
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
