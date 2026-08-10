import styles from "./styles.module.css";
import Link from "next/link";
import Image from "next/image";
import Foto from "@/components/Foto"
import { getProfile, getSession } from "../../lib/server/profile.actions";
import { decodeStreak } from "../../lib/server/streak";
import BotonJugar from "@/components/BotonJugar"

export const dynamic = "force-dynamic";

export default async function Menu() {
  const user = await getSession();

    const { puntos, racha } = await getProfile(user.id);
    const rachaActual = decodeStreak(racha).count;

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
          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/gorila-niveles.png" alt="Explorador de nivel 1" width={436} height={475} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Nivel 1</h3>
              <p>Categoria: Eleccion</p>
              <div className={styles.progressWrap}>
                <img src="/Star.png" alt="" className={styles.progressStar} />
                <div className={styles.progressBar} />
              </div>
            </div>
            <BotonJugar styleButton={styles.playButton} styleIcon={styles.playIcon} juego={"/juego-eleccion"} />
          </section>

          <section className={styles.levelCard}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/gorila-niveles.png" alt="Explorador de nivel 2" width={436} height={475} className={styles.levelImage} />
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
              <Image src="/gorila-niveles.png" alt="Explorador de nivel 3" width={436} height={475} className={styles.levelImage} />
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
              <Image src="/gorila-niveles.png" alt="Explorador de nivel 4" width={436} height={475} className={styles.levelImage} />
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
