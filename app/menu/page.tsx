import styles from "./styles.module.css";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Menu() {
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
          <img src="/casa.png" alt="" className={styles.casa} />
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
          <div className={styles.greeting}>
            <h2>Hola {user.name}!</h2>
            <p>Que juego quieres jugar hoy?</p>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <img src="/Star.png" alt="" className={styles.starIcon} />
              <div>
                <strong>0</strong>
                <span>Puntos</span>
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <img src="/Fire.png" alt="" className={styles.fireIcon} />
              <div>
                <strong>0</strong>
                <span>Racha</span>
              </div>
            </div>
          </div>

          <div className={styles.profilePlaceholder}>
            <span>Foto {user.name}</span>
          </div>
        </header>

        <main className={styles.levels}>
          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <span>Foto nivel 1</span>
            </div>

            <div className={styles.levelInfo}>
              <h3>Nivel 1</h3>
              <p>Categoria: Eleccion</p>
              <div className={styles.progressWrap}>
                <img src="/Star.png" alt="" className={styles.progressStar} />
                <div className={styles.progressBar} />
              </div>
            </div>

            <Link href="/juego-eleccion" className={styles.playButton}>
              <span className={styles.playIcon} aria-hidden="true" />
              Jugar
            </Link>
          </section>

          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <span>Foto nivel 2</span>
            </div>

            <div className={styles.levelInfo}>
              <h3>Nivel 2</h3>
              <p>Categoria: Memoria</p>
              <div className={styles.progressWrap}>
                <img src="/Star.png" alt="" className={styles.progressStar} />
                <div className={styles.progressBar} />
              </div>
            </div>

            <Link href="/juego-memoria" className={styles.playButton}>
              <span className={styles.playIcon} aria-hidden="true" />
              Jugar
            </Link>
          </section>

          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <span>Foto nivel 3</span>
            </div>

            <div className={styles.levelInfo}>
              <h3>Nivel 3</h3>
              <p>Categoria: Velocidad</p>
              <div className={styles.progressWrap}>
                <img src="/Star.png" alt="" className={styles.progressStar} />
                <div className={styles.progressBar} />
              </div>
            </div>

            <Link href="./" className={styles.playButton}>
              <span className={styles.playIcon} aria-hidden="true" />
              Jugar
            </Link>
          </section>

          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <span>Foto nivel 4</span>
            </div>

            <div className={styles.levelInfo}>
              <h3>Nivel 4</h3>
              <p>Categoria: Desafio</p>
              <div className={styles.progressWrap}>
                <img src="/Star.png" alt="" className={styles.progressStar} />
                <div className={styles.progressBar} />
              </div>
            </div>

            <Link href="./" className={styles.playButton}>
              <span className={styles.playIcon} aria-hidden="true" />
              Jugar
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
