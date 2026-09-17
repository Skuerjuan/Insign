"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/app/configuracion/styles.module.css";
import cerrarSesion from "@/lib/client/cerrarSesion";
import Link from "next/link";

export default function ConfiguracionPanel() {
  const [tema, setTema] = useState("claro");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sincronizarTema = () => {
      const temaGuardado = localStorage.getItem("insign-theme");
      setTema(temaGuardado === "oscuro" ? "oscuro" : "claro");
    };

    const frame = requestAnimationFrame(sincronizarTema);
    window.addEventListener("storage", sincronizarTema);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", sincronizarTema);
    };
  }, []);

  const cambiarTema = (nuevoTema) => {
    setTema(nuevoTema);
    localStorage.setItem("insign-theme", nuevoTema);
    document.documentElement.dataset.theme = nuevoTema === "oscuro" ? "dark" : "light";
  };

  useEffect(() => {
    if (!mostrarConfirmacion) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape" && !cerrandoSesion) {
        setMostrarConfirmacion(false);
      }
    };

    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [mostrarConfirmacion, cerrandoSesion]);

  const confirmarCierre = async () => {
    setCerrandoSesion(true);
    try {
      await cerrarSesion(router);
    } finally {
      setCerrandoSesion(false);
    }
  };

  return (
    <main className={styles.settingsMain}>
      <section className={styles.card}>
        <div className={`${styles.settingsIcon} ${styles.appearanceIcon}`}>
          <Image src="/apariencia.png" alt="" width={58} height={58} aria-hidden="true" />
        </div>
        <div className={styles.cardContent}>
          <h2>Apariencia</h2>
          <label>Claro <input type="radio" name="tema" checked={tema === "claro"} onChange={() => cambiarTema("claro")} /></label>
          <label>Oscuro <input type="radio" name="tema" checked={tema === "oscuro"} onChange={() => cambiarTema("oscuro")} /></label>
        </div>
      </section>

      <button type="button" className={styles.optionCard}>
        <span className={`${styles.settingsIcon} ${styles.parentalIcon}`}>
          <Image src="/control-parental.png" alt="" width={58} height={58} aria-hidden="true" />
        </span>
        <span><strong>Control parental</strong><small>Gestioná el tiempo y el contenido</small></span>
        <b aria-hidden="true">›</b>
      </button>

      <Link href="/auth/change_password" className={styles.optionCard}>
        <span className={`${styles.settingsIcon} ${styles.passwordIcon}`}>
          <Image src="/contrasena.png" alt="" width={58} height={58} aria-hidden="true" />
        </span>
        <span><strong>Contraseña</strong><small>Cambiá la contraseña de tu cuenta</small></span>
        <b aria-hidden="true">›</b>
      </Link>

      <button type="button" className={styles.logout} onClick={() => setMostrarConfirmacion(true)}>
        <span className={styles.logoutIcon} aria-hidden="true">
          <Image src="/cerrar-sesion.png" alt="" width={100} height={100} />
        </span>
        <span><strong>Cerrar sesión</strong><small>Salir de tu cuenta</small></span>
      </button>

      {mostrarConfirmacion && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cerrandoSesion) {
              setMostrarConfirmacion(false);
            }
          }}
        >
          <section
            className={styles.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setMostrarConfirmacion(false)}
              disabled={cerrandoSesion}
              aria-label="Cerrar confirmación"
            >
              X
            </button>

            <h2 id="logout-modal-title">¿Quiere cerrar sesión?</h2>
            <p id="logout-modal-description">
              ¿Estas seguro de que quiere cerrar la sesión? Si lo hace, necesitará volver iniciar sesión en InSign.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setMostrarConfirmacion(false)}
                disabled={cerrandoSesion}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={confirmarCierre}
                disabled={cerrandoSesion}
              >
                {cerrandoSesion ? "Cerrando…" : "Cerrar la sesión"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
