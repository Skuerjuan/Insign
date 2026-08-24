"use client"

import { AuthUIProvider, ResetPasswordForm } from "@neondatabase/auth/react/ui";
import "@neondatabase/auth/ui/css";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";
import Link from "next/link";
import styles from "../authScreens.module.css";

export default function ResetPassword(){
    return (
        <main className={styles.page}>
            <Link href="/auth/sign-in" className={styles.back} aria-label="Volver a iniciar sesión">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12H5m6-7-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <h1 className={styles.heading}>Una nueva <strong>contraseña</strong></h1>
            <div className={styles.layout}>
                <div className={styles.monkeyWrap}>
                    <Image className={styles.monkey} src="/mono-abecedario.png" alt="Mono de InSign" width={373} height={498} priority />
                </div>
                <section className={styles.card}>
                <h2 className={styles.title}>¡Ya casi está!</h2>
                <p className={styles.description}>Creá tu nueva contraseña para seguir aprendiendo y jugando</p>
                <AuthUIProvider
                    authClient={authClient as never}
                    redirectTo="/auth/sign-in"
                    credentials={{ confirmPassword: true }}
                >
                    <ResetPasswordForm
                        className={styles.authForm}
                        classNames={{
                            label: styles.authLabel,
                            input: styles.authInput,
                            error: styles.authError,
                            button: styles.primaryButton,
                            primaryButton: styles.primaryButton,
                        }}
                        localization={{
                            NEW_PASSWORD: "Nueva contraseña",
                            NEW_PASSWORD_PLACEHOLDER: "Nueva contraseña",
                            CONFIRM_PASSWORD: "Repetir contraseña",
                            CONFIRM_PASSWORD_PLACEHOLDER: "Repetir contraseña",
                            RESET_PASSWORD_ACTION: "Continuar",
                        }}
                    />
                </AuthUIProvider>
            </section>
            </div>
        </main>
    )
}
