'use client';

import styles from "./style.module.css";
import Link from "next/link";
import Input from "../../../components/input";

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

      <div className={styles.container}>
        <h2 className={styles.titulo}>¡Crea tu cuenta!</h2>

        <Input
          placeholder="Nombre de usuario"
          type="text"
          icon="/user.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Correo electronico"
          type="email"
          icon="/card.png"
          eyeIcon={null}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Input
          placeholder="Repetir Contraseña"
          type="password"
          icon="/lock.png"
          eyeIcon="/eye.png"
        />

        <Link href="/auth/sign-in" className={styles.inicia}>
          Registrarme
        </Link>
      </div>
    </div>
    );
}