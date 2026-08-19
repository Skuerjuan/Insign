
"use client"

import { AuthUIProvider, ForgotPasswordForm } from "@neondatabase/auth/react/ui";
import "@neondatabase/auth/ui/css";
import { authClient } from "@/lib/auth/client";
import styles from "../form.module.css";

export default function ForgotPassword(){
    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.logo}>In<span>Sign</span></p>
                <h1 className={styles.title}>Recuperar contraseña</h1>
                <p className={styles.description}>
                    Ingresá tu correo y te enviaremos las instrucciones para recuperar tu cuenta.
                </p>
                <AuthUIProvider
                    authClient={authClient as never}
                    redirectTo="/auth/reset-password"
                >
                    <ForgotPasswordForm localization={{}} />
                </AuthUIProvider>
            </section>
        </main>
    )
}
