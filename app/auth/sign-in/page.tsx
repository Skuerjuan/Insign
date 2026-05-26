'use client';

import styles from "./styles.module.css";
import Link from "next/link";
import Input from "../../../components/input";

import { useActionState } from 'react';
import { signInWithEmail } from './actions';

export default function SignIn() {
    const [state, formAction, isPending] = useActionState(signInWithEmail, null);

    return (
      <div className={styles.fondo}>
      <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>

      <div className={styles.gorilaSaludando}></div>

      <div className={styles.container}>
        <h2 className={styles.titulo}>¡Bienvenido!</h2>

        <p className={styles.adInicia}>
          Inicia sesión para seguir aprendiendo
        </p>

        <Input
          placeholder="Correo electrónico"
          type="email"
          icon="/user.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Link href="/menu" className={styles.inicia}>
          Inicia Sesión
        </Link>

        <p className={styles.olvid}>
          ¿Olvidaste tu contraseña?
        </p>

        <div className={styles.separador}>
          <div className={styles.linea}></div>

          <p className={styles.textoSeparador}>
            o continúa con
          </p>

          <div className={styles.linea}></div>
        </div>

        <button className={styles.googleBtn}>
          <img
            src="/google.png"
            className={styles.googleIcon}
          />

          <Link
            href="/"
            className={styles.googleLink}
          >
            Google
          </Link>
        </button>

        <div className={styles.registro}>
          <p className={styles.registroTexto}>
            ¿No tienes una cuenta?
          </p>

          <Link
            href="/auth/sign-up"
            className={styles.registroLink}
          >
            Registrate
          </Link>
        </div>
      </div>
    </div>
    );
}