"use client"

import { AuthUIProvider, ResetPasswordForm } from "@neondatabase/auth/react/ui";
import "@neondatabase/auth/ui/css";
import { authClient } from "@/lib/auth/client";
import styles from "../form.module.css";

export default function ResetPassword(){
    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.logo}>In<span>Sign</span></p>
                <h1 className={styles.title}>Nueva contraseña</h1>
                <p className={styles.description}>Elegí una contraseña nueva para volver a ingresar a tu cuenta.</p>
                <AuthUIProvider
                    authClient={authClient as never}
                    redirectTo="/auth/sign-in"
                >
                    <ResetPasswordForm localization={{}} />
                </AuthUIProvider>
            </section>
        </main>
    )
}
