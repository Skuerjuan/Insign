import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Foto from "@/components/Foto";
import { getLevel } from "@/lib/levels";
import { getCompletedGames, getProfile, getSession, type GameName } from "@/lib/server/profile.actions";
import { getWeeklyActivity } from "@/lib/server/streak";
import styles from "./styles.module.css";

export const dynamic = "force-dynamic";

const games: Array<{ name: GameName; label: string; href: string; image?: string }> = [
  { name: "memoria", label: "Memoria", href: "/juego-memoria", image: "/juego-memoria.png" },
  { name: "eleccion", label: "Elección", href: "/juego-eleccion", image: "/juego-eleccion.png" },
  { name: "completar", label: "Completar", href: "/Juego-completar", image: "/juego-completar.png" },
  { name: "adivinar", label: "Múltiple elección", href: "/Juego-adivinar", image: "/juego-multiple-eleccion.png" },
];

export default async function LevelGamesPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel: rawLevel } = await params;
  const levelId = Number(rawLevel);
  const level = getLevel(levelId);

  if (!level) notFound();

  const user = await getSession();
  const profile = await getProfile(user.id);

  if (level.id > 1 && profile.nivel < level.id) redirect("/menu");

  const completedGames = new Set(await getCompletedGames(user.id, level.id));
  const streak = getWeeklyActivity(profile.racha, profile.ultimo_dia_activo).count;
  const levelStyle = { "--level-color": level.color } as CSSProperties;

  return (
    <div className={styles.page} style={levelStyle}>
      <aside className={styles.aside}>
        <h1 className={styles.logo}>
          <span>In</span><strong>Sign</strong>
        </h1>
        <nav className={styles.navigation} aria-label="Navegación principal">
          <Link href="/menu" className={styles.activeLink}><Image src="/casablanco.png" alt="" width={40} height={40} />Inicio</Link>
          <Link href="/entrenamiento"><Image src="/pesa.png" alt="" width={40} height={40} />Entrenamiento</Link>
          <Link href="/progreso"><Image src="/premio.png" alt="" width={40} height={40} />Progreso</Link>
          <Link href="/perfil"><Image src="/userwhite.png" alt="" width={40} height={40} />Perfil</Link>
          <Link href="/configuracion"><Image src="/ajustes.png" alt="" width={40} height={40} />Configuración</Link>
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.greeting}>
            <h2>¡Hola, {user.name}!</h2>
            <p>¿Qué juego quieres jugar hoy?</p>
          </div>
          <div className={styles.stats} aria-label="Estadísticas">
            <div><Image src="/Star.png" alt="" width={46} height={46} /><span><strong>{profile.puntos ?? 0}</strong>Puntos</span></div>
            <i aria-hidden="true" />
            <div><Image src="/Fire.png" alt="" width={42} height={48} /><span><strong>{streak}</strong>Racha</span></div>
          </div>
          <div className={styles.avatar}><Foto user={user} width={74} height={74} /></div>
        </header>

        <main className={styles.main}>
          <section className={styles.levelBanner} aria-labelledby="level-title">
            <Link href="/menu" className={styles.backButton} aria-label="Volver a los niveles">
              <Image
                src="/flecha-tarjeta.png"
                alt=""
                width={38}
                height={38}
                className={styles.backArrowIcon}
              />
            </Link>
            <Image src="/mono-seccion.png" alt="" width={142} height={142} className={styles.monkey} />
            <div>
              <h1 id="level-title">{level.title}</h1>
              <p>{level.description}</p>
            </div>
          </section>

          <h2 className={styles.gamesTitle}>Juegos</h2>
          <section className={styles.gamesGrid} aria-label={`Juegos de ${level.title}`}>
            {games.map((game) => {
              const completed = completedGames.has(game.name);
              return (
                <a
                  key={game.name}
                  href={`${game.href}?nivel=${level.id}`}
                  className={styles.gameCard}
                  aria-label={`${game.label}${completed ? ", completado" : ""}`}
                >
                  <div className={styles.cardBody}>
                    {game.image && <Image src={game.image} alt="" width={180} height={150} className={styles.gameImage} />}
                  </div>
                  <div className={`${styles.cardFooter} ${completed ? styles.completed : ""}`}>
                    <span>{game.label}</span>
                    <Image
                      src="/arrow-right-circle.svg"
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
        </main>
      </div>
    </div>
  );
}
