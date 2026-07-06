'use client';

import styles from "./styles.module.css";
import Link from "next/link";
import Input from "@/components/Input";

import { useActionState } from 'react';
import { signInWithEmail } from './actions';
import { useRouter } from "next/navigation";
import signInWithGoogle from '@/lib/client/signInWithGoogle';


export default function SignIn() {
    const [state, formAction, isPending] = useActionState(signInWithEmail, null);
    const router = useRouter();

    return (
    <div className={styles.fondo}>

      <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>

      <div className={styles.gorilaSaludando}></div>

      <form action={formAction}>
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
          idInput="email"
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
          idInput="password"
        />

        {state?.error && (
          <div className="rounded-md px-3 py-2 text-sm text-red-500">
          {state.error}
          </div>
        )}

        <button type="submit" disabled={isPending} className={styles.inicia}>
          Inicia Sesión
        </button>

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

        <button
          type="button"
          onClick={signInWithGoogle}
          className={styles.googleBtn}
        >
          <img
            src="/google.png"
            className={styles.googleIcon}
            />

          <span className={styles.googleLink}>Google</span>
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
      </form>
    </div>
    );
}