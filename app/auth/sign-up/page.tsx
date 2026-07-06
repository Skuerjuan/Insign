'use client';

import styles from "./style.module.css";
import Link from "next/link";
import Input from "../../../components/Input";

import { useActionState } from 'react';
import { signUpWithEmail } from './actions';

export default function SignUpForm() {
    const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

    return (
    <div className={styles.fondo}>
      <h1 className={styles.logo}>
        <span className={styles.blanco}>In</span>
        <span className={styles.amarillo}>Sign</span>
      </h1>

      <div className={styles.gorilaSaludando}></div>

      <form action={formAction}>  
      <div className={styles.container}>
        <h2 className={styles.titulo}>¡Crea tu cuenta!</h2>

        <Input
          placeholder="Nombre de usuario"
          type="text"
          icon="/user.png"
          eyeIcon={null}
          idInput={"name"}
        />

        <Input
          placeholder="Correo electronico"
          type="email"
          icon="/card.png"
          eyeIcon={null}
          idInput={"email"}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
          idInput={"password"}
        />

        <Input
          placeholder="Repetir Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
          idInput={"confirmPassword"}
        />

        {state?.error && (
            <div className="rounded-md px-3 py-2 text-sm text-red-500">
            {state.error}
            </div>
        )}

        <button type="submit" disabled={isPending} className={styles.inicia}>
          Registrarme
        </button>
      </div>
      </form>
    </div>
    );
}