"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

const games = [
  { title: "Abecedario", copy: "Explorá las letras y descubrí nuevas señas paso a paso.", tone: "blue", image: "/abecedario-sin-borde.png", alt: "Tarjetas con las letras A, B y C" },
  { title: "Memoria", copy: "Encontrá pares, practicá movimientos y entrená jugando.", tone: "green", image: "/memoria-sin-borde.png", alt: "Dos cartas del juego de memoria" },
  { title: "Desafíos", copy: "Sumá estrellas, sostené tu racha y desbloqueá aventuras.", tone: "yellow", image: "/desafios.png", alt: "Koko explorando con sus binoculares" },
] as const;

const familyGames = [
  { ...games[0], eyebrow: "", title: "Acompaña su progreso", copy: "Revisa sus logros, estrellas y rachas de aprendizaje en todo momento." },
  { ...games[1], eyebrow: "", title: "Aprendan juntos", copy: "Compartí la experiencia y practicá las señas en familia." },
  { ...games[2], eyebrow: "", title: "Celebra sus logros", copy: "Cada avance cuenta, motiva su aprendizaje con recompensas." },
] as const;

function GameCards({ items = games }: { items?: ReadonlyArray<(typeof games)[number] | (typeof familyGames)[number]> }) {
  return (
    <div className={styles.gameGrid}>
      {items.map((game) => (
        <article key={game.title} className={`${styles.gameCard} ${styles[game.tone]}`}>
          <div className={styles.cardImage}><Image src={game.image} alt={game.alt} fill sizes="(max-width: 760px) 88vw, 28vw" /></div>
          <div className={styles.cardBody}>
            <span>{"eyebrow" in game ? game.eyebrow : "Jugá y aprendé"}</span><h3>{game.title}</h3><p>{game.copy}</p>
            <a href="/auth/sign-in" aria-label={`Conocer ${game.title}`}>
              <Image src="/flecha-tarjeta.png" alt="" width={27} height={40} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const [scene, setScene] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-scene]");
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setScene((current.target as HTMLElement).dataset.scene ?? "hero");
    }, { threshold: [0.35, 0.55, 0.75] });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!videoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setVideoOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [videoOpen]);

  return (
    <main className={styles.page}>
      <header className={styles.navWrap}>
        <nav className={styles.nav} aria-label="Navegación principal">
          <a className={styles.logo} href="#inicio"><span>In</span><strong>Sign</strong></a>
          <button className={styles.menuButton} type="button" aria-expanded={menuOpen} aria-controls="main-menu" onClick={() => setMenuOpen((value) => !value)}>
            <i /><i /><i /><span className={styles.srOnly}>Abrir menú</span>
          </button>
          <div id="main-menu" className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ""}`}>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
            <a href="#juegos" onClick={() => setMenuOpen(false)}>Juegos</a>
            <a href="#familias" onClick={() => setMenuOpen(false)}>Para familias</a>
          </div>
          <a className={styles.navCta} href="/auth/sign-in">Iniciar sesión</a>
        </nav>
      </header>

      <section id="inicio" data-scene="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <h1>Aprender LSA también puede ser <em>un juego.</em></h1>
            <p className={styles.lead}>Una aventura interactiva para que chicos y chicas aprendan LSA jugando, practicando y celebrando cada logro.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#juegos">Empezar a jugar <span>→</span></a>
              <button className={styles.textButton} type="button" onClick={() => setVideoOpen(true)}><span className={styles.playDot}>▶</span> Ver cómo funciona</button>
            </div>
          </div>
          <div className={styles.heroVisual}><Image className={styles.heroImage} src="/gorila-saludando-inicio-sesion.png" alt="Koko, el gorila de InSign, saludando" width={760} height={760} priority /></div>
        </div>
        <a className={styles.scrollHint} href="#como-funciona"><span>Descubrí la aventura</span><b>⌄</b></a>
      </section>

      <div className={styles.learningJourney}>
        <section id="como-funciona" data-scene="games" className={styles.showcaseSection}>
          <div className={styles.sectionIntro}>
            <h2>Cada seña abre una <span>nueva <em>aventura</em></span></h2>
            <p>Actividades cortas, visuales y divertidas para aprender con confianza</p>
          </div>
          <div id="juegos"><GameCards /></div>
          <a className={styles.sectionScroll} href="#familias">Descubrí la aventura <b>⌄</b></a>
        </section>

        <section id="familias" data-scene="games" className={styles.showcaseSection}>
          <div className={styles.sectionIntro}>
            <h2 className={styles.familyTitle}><em>Para</em> <span>familias</span></h2>
            <p>Acompañando el aprendizaje de LSA con tu hijo/a</p>
          </div>
          <GameCards items={familyGames} />
          <a className={styles.sectionScroll} href="#progreso">Descubrí la aventura <b>⌄</b></a>
        </section>

        <section id="progreso" className={styles.progressSection} data-scene="banana">
          <div className={styles.familyPanel}>
            <div className={styles.familyCopy}>
              <h2>Cada pequeño avance merece celebrarse</h2>
              <p>Aprendé nuevas señas, superá desafíos y avanzá jugando</p>
              <a href="/auth/sign-in">Conocer el progreso <span>→</span></a>
            </div>
            <div className={styles.progressCards}>
              <div className={styles.progressCard}><span>Progreso semanal</span><strong>75%</strong><div className={styles.progressBar}><i /></div><small>¡Vas increíble!</small></div>
              <div className={styles.miniStat}><b>⭐</b><strong>42</strong><span>Estrellas</span></div>
              <div className={styles.miniStat}><b>🔥</b><strong>7</strong><span>Días de racha</span></div>
            </div>
          </div>
        </section>
      </div>

      <aside className={`${styles.travelMascot} ${styles[`scene_${scene}`]}`} aria-hidden="true">
        <Image className={styles.swingMonkeyImage} src="/gorila-columpiandose.png" alt="" width={1000} height={1000} priority />
      </aside>

      <footer className={styles.footer}>
        <a className={styles.logo} href="#inicio"><span>In</span><strong>Sign</strong></a><p>Jugar, aprender y comunicar</p><span>Lengua de señas argentinas - LSA</span>
      </footer>

      {videoOpen && (
        <div className={styles.videoModal} role="dialog" aria-modal="true" aria-label="Video: cómo funciona InSign" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}>
          <div className={styles.videoDialog}>
            <button ref={closeButtonRef} className={styles.videoClose} type="button" aria-label="Cerrar video" onClick={() => setVideoOpen(false)}>×</button>
            <video className={styles.video} controls autoPlay playsInline preload="metadata"><source src="/grabacion-insign.mp4" type="video/mp4" />Tu navegador no puede reproducir este video.</video>
          </div>
        </div>
      )}
    </main>
  );
}
