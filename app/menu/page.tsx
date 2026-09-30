import styles from "./styles.module.css";
import Link from "next/link";
import Image from "next/image";
import Foto from "@/components/Foto"
import { getProfile, getSession } from "../../lib/server/profile.actions";
import { getWeeklyActivity } from "../../lib/server/streak";

export const dynamic = "force-dynamic";

export default async function Menu() {
  const user = await getSession();

    const { puntos, racha, ultimo_dia_activo } = await getProfile(user.id);
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
          <section className={`${styles.levelCard} ${styles.presentationOne}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Presentación 1</h3>
              <p>Aprende a saludar presentarte y conocer expresiones básicas</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Presentación 1">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.presentationTwo}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Presentación 2</h3>
              <p>Preséntate y saluda de otros y preguntas básicas</p>
            </div>

            <Link href="/juego-memoria" className={styles.levelArrow} aria-label="Jugar Presentación 2">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.familyAndFriends}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Familia y amigos</h3>
              <p>Conoce los miembros de la familia y otros</p>
            </div>

            <Link href="/Juego-adivinar" className={styles.levelArrow} aria-label="Jugar Familia y amigos">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.numbers}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Números</h3>
              <p>Aprende de los números en LSA de forma fácil y divertida</p>
            </div>

            <Link href="/Juego-completar" className={styles.levelArrow} aria-label="Jugar Números">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.school}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Colegio</h3>
              <p>Aprende las señas básicas sobre el colegio y los útiles escolares.</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Colegio">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.weather}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Clima</h3>
              <p>Aprende sobre los distintos tipos de clima.</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Clima">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.houseParts}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Partes de la casa</h3>
              <p>Conoce las partes de la casa y sus objetos principales.</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Partes de la casa">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.questions}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Preguntas</h3>
              <p>Aprendé preguntas y respuestas sobre orientación en LSA.</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Preguntas">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>

          <section className={`${styles.levelCard} ${styles.shopping}`}>
            <div className={styles.levelImagePlaceholder}>
              <Image src="/mono-seccion.png" alt="" width={179} height={180} className={styles.levelImage} />
            </div>

            <div className={styles.levelInfo}>
              <h3>Compras</h3>
              <p>Aprendé a pedir, elegir y comprar diferentes productos.</p>
            </div>

            <Link href="/juego-eleccion" className={styles.levelArrow} aria-label="Jugar Compras">
              <Image src="/flecha-seccion.png" alt="" width={87} height={87} aria-hidden="true" />
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
