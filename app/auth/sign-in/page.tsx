'use client';

import styles from "./styles.module.css";
import Link from "next/link";
import Input from "@/components/Input";

import { useActionState } from 'react';
import { Suspense } from 'react';
import { signInWithEmail } from './actions';
import signInWithGoogle from '@/lib/client/signInWithGoogle';
import { useSearchParams } from "next/navigation";

function SignInForm() {
    const [state, formAction, isPending] = useActionState(signInWithEmail, null);
    const searchParams = useSearchParams();
    const oauthError = searchParams.get('error');
    const oauthErrorMessage = oauthError === 'account_not_linked'
      ? 'Esta cuenta de Google no está vinculada a una cuenta existente. Inicia sesión con el método original o pide que habiliten el vínculo en Neon Auth.'
      : null;

    return (
    <div className={styles.fondo}>
      <div className={styles.authLayout}>

      <div className={styles.leftStage}>
        <h1 className={styles.logo}>
          <span className={styles.blanco}>In</span>
          <span className={styles.amarillo}>Sign</span>
        </h1>

        <div className={styles.gorilaSaludando}></div>
      </div>

      <form action={formAction}>
      <div className={styles.container}>
        <h2 className={styles.titulo}>¡Bienvenido!</h2>

        <p className={styles.adInicia}>
          Inicia sesión para seguir aprendiendo
        </p>

        <div className={styles.fields}>
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
        </div>

        {state?.error && (
          <div className="rounded-md px-3 py-2 text-sm text-red-500">
          {state.error}
          </div>
        )}

        {oauthErrorMessage && (
          <div className="rounded-md px-3 py-2 text-sm text-red-500">
          {oauthErrorMessage}
          </div>
        )}

        <button type="submit" disabled={isPending} className={styles.inicia}>
          Inicia Sesión
        </button>

        <Link className={styles.olvid} href="/auth/forgot_password">
          ¿Olvidaste tu contraseña?
        </Link>

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
            alt=""
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
    </div>
    );
}

export default function SignIn() {
    return (
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    );
}
