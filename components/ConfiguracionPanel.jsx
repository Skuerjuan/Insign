"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/app/configuracion/styles.module.css";
import cerrarSesion from "@/lib/client/cerrarSesion";
import Link from "next/link";

export default function ConfiguracionPanel() {
  const [tema, setTema] = useState("claro");
  const router = useRouter();

  return (
    <main className={styles.settingsMain}>
      <section className={styles.card}>
        <div className={`${styles.settingsIcon} ${styles.appearanceIcon}`}>
          <Image src="/apariencia.png" alt="" width={58} height={58} aria-hidden="true" />
        </div>
        <div className={styles.cardContent}>
          <h2>Apariencia</h2>
          <label>Claro <input type="radio" name="tema" checked={tema === "claro"} onChange={() => setTema("claro")} /></label>
          <label>Oscuro <input type="radio" name="tema" checked={tema === "oscuro"} onChange={() => setTema("oscuro")} /></label>
        </div>
      </section>

      <button type="button" className={styles.optionCard}>
        <span className={`${styles.settingsIcon} ${styles.parentalIcon}`}>
          <Image src="/control-parental.png" alt="" width={58} height={58} aria-hidden="true" />
        </span>
        <span><strong>Control parental</strong><small>Gestioná el tiempo y el contenido</small></span>
        <b aria-hidden="true">›</b>
      </button>

      <Link href="/auth/change_password">
        <button type="button" className={styles.optionCard}>
          <span className={`${styles.settingsIcon} ${styles.passwordIcon}`}>
            <Image src="/contrasena.png" alt="" width={58} height={58} aria-hidden="true" />
          </span>
          <span><strong>Contraseña</strong><small>Cambiá la contraseña de tu cuenta</small></span>
          <b aria-hidden="true">›</b>
        </button>
      </Link>

      <button type="button" className={styles.logout} onClick={() => cerrarSesion(router)}>
        <span aria-hidden="true">⇥</span>
        <span><strong>Cerrar sesión</strong><small>Salir de tu cuenta</small></span>
      </button>
    </main>
  );
}
